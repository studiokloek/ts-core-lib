import { gsap } from 'gsap';
import { Bind } from 'lodash-decorators';
import { round } from 'lodash';

import {
  IPoint,
  IRendererOptionsAuto,
  MSAA_QUALITY,
  AbstractRenderer,
  autoDetectRenderer,
  Container,
  DisplayObject,
  InteractionManager,
  Point,
  Rectangle,
  Renderer,
  RenderTexture,
  settings,
  Sprite,
  Texture,
  TextureGCSystem,
  Ticker as PixiTicker,
  utils,
  AccessibilityManager,
  IRenderableObject,
  IRendererRenderOptions,
} from 'pixi.js';
import { hexToString } from '../util/color';
import { Screen } from '.';
import { CoreDebug } from '../debug';
import { Delayed } from '../delay';
import { getGPUInfo, GPUInfo, isApp } from '../device';
import { AppEvent, PubSub } from '../events';
import { getLogger } from '../logger';
import { restoreTickerTimeAfterSleep, setTickerGlobalTimeScale, storeTickerTimeBeforeSleep } from '../ticker';
import { Tween } from '../tween';
import { constrainNumber, mapNumber } from '../util/math';
import { OrientationMode, ResolutionMode } from './constants';
import { determineResolution } from './resolution';
import { StageInfo } from './stageinfo';

const Logger = getLogger('device > stage');

// geen pixi bericht
utils.skipHello();

export interface RendererOptions {
  width?: number;
  height?: number;
  view?: HTMLCanvasElement;
  transparent?: boolean;
  autoDensity?: boolean;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  backgroundColor?: number;
  clearBeforeRender?: boolean;
  resolution?: number;
  forceCanvas?: boolean;
  forceFXAA?: boolean;
  powerPreference?: string;
}

export interface StageOptions {
  backgroundColor?: number | undefined;
  fps: number;
  antialias?: boolean;
  target: HTMLElement | string;
}

export interface SizeOptions {
  orientation: string;
  size: {
    default: {
      width: number;
      height: number;
    };
    minimum: {
      width: number;
      height: number;
    };
    maximum: {
      width: number;
      height: number;
    };
  };
  ratio: {
    min: number;
    max: number;
  };
}

export function isSizeOptions(_options: SizeOptions): _options is SizeOptions {
  return _options && typeof _options.orientation === 'string' && typeof _options.size === 'object' && typeof _options.ratio === 'object';
}

export interface MultiSizeOptions {
  [key: string]: SizeOptions | undefined;
}

const DefaultStageOptions: StageOptions = {
  fps: 60,
  antialias: false,
  backgroundColor: 0x00_00_00,
  target: '#app',
};

const DefaultSizeOptions: SizeOptions = {
  orientation: OrientationMode.LANDSCAPE,
  size: {
    default: {
      width: 1024,
      height: 768,
    },
    minimum: {
      width: 320,
      height: 240,
    },
    maximum: {
      width: 2048,
      height: 1536,
    },
  },
  ratio: {
    min: 4 / 3,
    max: 16 / 9,
  },
};

const gpuInfo: GPUInfo = getGPUInfo();
const GSAPTicker = gsap.ticker;

export class ConcreteStage {
  private _width = 640;
  private _height = 480;
  private _aspect = 0;
  private _scale = { x: 1, y: 1 };
  private _position = { x: 0, y: 0 };
  private _fps = 60;
  private lowPerformanceDetected = false;
  private _rendererResolution: number = ResolutionMode.NORMAL;
  private _textureResolution: number = ResolutionMode.NORMAL;
  private _generateResolution: number = ResolutionMode.NORMAL;

  private options: StageOptions | undefined;
  private _sizeOptions: MultiSizeOptions | undefined;
  private currentSizeOptions: SizeOptions | undefined;
  private isRunning = false;
  private renderer!: AbstractRenderer;
  private target: HTMLElement | null | undefined;
  private _view: Container;
  private textureGC: TextureGCSystem | undefined;
  private unloadingTextures: boolean | undefined;
  private sharedTicker!: PixiTicker;
  private _timeScale = 1;
  private timeScaleBeforeSleep: number | undefined;
  private sleeping = false;
  private forcedScreenOrientation: string | undefined;
  private firstResize = true;
  private resizedWhileSleeping = false;

  constructor() {
    this._view = new Container();
    this._view.interactive = true;
  }

  // INIT

  init(_options: StageOptions, _sizingOptions?: SizeOptions | MultiSizeOptions): void {
    this.options = { ...DefaultStageOptions, ..._options };

    this.setSizingOptions(_sizingOptions);

    // basis fps
    this._fps = this.options.fps || DefaultStageOptions.fps;

    // bepaal texture resolutie
    ({ texture: this._textureResolution } = determineResolution());
    this._generateResolution = this._textureResolution;

    this.checkPerformance();
    this.initRenderer();
    this.initTicker();
    this.initGC();
    this.connectToTarget();

    // listen for resize
    this.onScreenResized();
    Screen.resized.attach(this.onScreenResized);

    // een keer renderen zodat we geen zwarte flits zien
    this.update();

    this.initDebug();

    PubSub.publish(AppEvent.STAGE_READY);
  }

  private initDebug(): void {
    if (CoreDebug.isEnabled()) {
      (globalThis as any).__PIXI_STAGE__ = this._view;
      (globalThis as any).__PIXI_RENDERER__ = this.renderer;
    }
  }

  private connectToTarget(): void {
    if (!this.options || !this.renderer) {
      return;
    }

    // target vinden
    if (typeof this.options.target === 'string') {
      this.target = document.querySelector(this.options.target as string) as HTMLElement;
    } else if (this.options.target instanceof HTMLElement) {
      this.target = this.options.target as HTMLElement;
    }

    if (!this.target) {
      this.target = document.body;
    }

    if (this.target) {
      // geen context menu
      this.target.addEventListener('contextmenu', (event: Event) => {
        event.preventDefault();
      });

      // body zelfde achtergrond kleur
      if (this.options.backgroundColor !== undefined) {
        document.body.style.backgroundColor = `#${this.options.backgroundColor === 0 ? '000' : this.options.backgroundColor.toString(16)}`;
      }

      this.target.append(this.renderer.view);
    }
  }

  private checkPerformance(): void {
    // canvas renderers krijgen nooit retina
    if (!gpuInfo.isWebGLSupported || gpuInfo.useLegacyWebGL) {
      Logger.warn('Using low performance settings...', gpuInfo);
      this.lowPerformanceDetected = true;
      this._textureResolution = 1;
      this._generateResolution = 1;
      this._fps = 30;
    }
  }

  private initTicker(): void {
    if (!this.options) {
      return;
    }

    // Ticker.fps = this.fps;
    GSAPTicker.fps(this.options.fps);
    // GSAPTicker.useRAF(true);

    // stop de standaard ticker, wij update zelf
    this.sharedTicker = PixiTicker.shared;
    this.sharedTicker.autoStart = false;
    this.sharedTicker.stop();

    this.timeScale = CoreDebug.getGlobalTimescale();
  }

  private initGC(): void {
    if (this.renderer instanceof Renderer) {
      // iets agressievere GC (alleen actief bij WebGL)
      const gc = this.renderer.textureGC;
      if (gc) {
        this.textureGC = gc;
        this.textureGC.maxIdle = 120;
        this.textureGC.checkCountMax = 60;
      }
    }
  }

  private initRenderer(): void {
    const renderSettings = this.getRendererOptions();

    // zet filter resolutie op scherm resolutie
    settings.FILTER_RESOLUTION = renderSettings.resolution as number;

    // pixi renderer
    this.renderer = autoDetectRenderer(renderSettings);

    // interactie
    if (this.interaction) {
      this.interaction.autoPreventDefault = true;
    }
  }

  private getRendererOptions(): IRendererOptionsAuto {
    // standaard zelfde resolutie als het scherm
    let rendererResolution = Screen.resolution;

    // lagere texture resolutie? (bv geen webgl) dan ook renderen lager
    if (this.lowPerformanceDetected) {
      rendererResolution = ResolutionMode.NORMAL;
    }

    this._rendererResolution = rendererResolution;

    const renderOptions: IRendererOptionsAuto = {
      width: this.width,
      height: this.height,
      autoDensity: true,
      preserveDrawingBuffer: gpuInfo.preserveDrawingBuffer,
      antialias: this.options?.antialias === true ? true : false,
      resolution: this._rendererResolution,
      forceCanvas: !gpuInfo.isWebGLSupported,
      backgroundColor: this.options ? this.options.backgroundColor : 0x00_00_00,
    };

    Logger.debug('Render options:', renderOptions);

    return renderOptions;
  }

  // RENDER

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    Logger.debug('Starting...');

    GSAPTicker.add(this.update);
  }

  @Bind()
  private update(): void {
    this.sharedTicker.update(GSAPTicker.time * 1000);
    this.render(this._view);
  }

  // RESIZE

  private resize(): void {
    const options = this.currentSizeOptions;

    if (!options) {
      return;
    }

    if (this.sleeping) {
      this.resizedWhileSleeping = true;
      return;
    }

    const screenRatio = Screen.width / Screen.height;
    const { min: minRatio, max: maxRatio } = options.ratio;
    const { width: minWidth, height: minHeight } = options.size.minimum;
    const { width: maxWidth, height: maxHeight } = options.size.maximum;

    if (screenRatio < minRatio) {
      // balken boven en onder
      this._width = Screen.width;
      this._width = constrainNumber(this._width, minWidth, maxWidth);
      this._height = this._width / minRatio;
    } else if (screenRatio > maxRatio) {
      // balken aan de zijkant
      this._height = Screen.height;
      this._height = constrainNumber(this._height, minHeight, maxHeight);
      this._width = this._height * maxRatio;
    } else {
      // uitvullen
      this._width = Screen.width;
      this._height = Screen.height;
    }

    const { width: defaultWidth, height: defaultHeight } = options.size.default;
    this.scale.x = round(this.width / defaultWidth, 4);
    this.scale.y = round(this.height / defaultHeight, 4);

    this.position.x = round(Screen.width - this.width) * 0.5;
    this.position.y = round(Screen.height - this.height) * 0.5;

    if (options.orientation === OrientationMode.LANDSCAPE) {
      const deltaWidth = this.width - this.height;
      this._aspect = mapNumber(deltaWidth / (this.defaultHeight * this.scale.x), 0.333_333_333_333, 0.584_484_734_475, 0, 1, true, 5);
    } else {
      const deltaHeight = this._height - this._width;
      this._aspect = mapNumber(deltaHeight / (this.defaultWidth * this.scale.x), 0.777_777_777_78, 1.166_666_666_67, 0, 1, true, 5);
    }

    // afronden
    this._width = round(this._width);
    this._height = round(this._height);

    if (this.target) {
      Tween.set(this.target, {
        transformOrigin: '0 0',
        x: this.position.x,
        y: this.position.y,
        width: this.width,
        height: this.height,
      });
    }

    if (this.renderer) {
      this.renderer.resize(this.width, this.height);
    }

    const info: StageInfo = {
      size: { width: this.width, height: this.height },
      scale: this.scale,
      position: this.position,
    };

    if (!this.firstResize) {
      PubSub.publish(AppEvent.RESIZED, info);
    }

    this.firstResize = false;
  }

  // RESIZE
  @Bind
  private onScreenResized(): void {
    this.determineSizeOptions();
    this.resize();
  }

  private determineSizeOptions(): void {
    const orientation = this.forcedScreenOrientation || Screen.orientation;

    let options;

    // bestaat er een optie voor de huidige oriëntatie
    if (this._sizeOptions) {
      if (this._sizeOptions[orientation]) {
        // Logger.verbose('determineSizeOptions()', `Found options for orientation:${orientation}`);
        options = this._sizeOptions[orientation];
      } else {
        // is er wel een vaste grootte voor andere oriëntatie?
        // dan gebruiken we deze voor beide groottes
        const oppositeOrientation = orientation === OrientationMode.LANDSCAPE ? OrientationMode.PORTRAIT : OrientationMode.LANDSCAPE;
        if (this._sizeOptions[oppositeOrientation]) {
          // Logger.verbose('determineSizeOptions()', `Found options for opposite orientation:${oppositeOrientation}`);
          options = this._sizeOptions[oppositeOrientation];
        }
      }
    }

    if (!options) {
      Logger.warn('determineSizeOptions()', `No options found for any orientation:${orientation}`);
      options = DefaultSizeOptions;
    }

    this.currentSizeOptions = options;
  }

  private setSizingOptions(_sizingOptions?: SizeOptions | MultiSizeOptions): void {
    let sizingOptions = _sizingOptions;

    if (sizingOptions) {
      // enkele sizing?
      sizingOptions = _sizingOptions as SizeOptions;
      if (isSizeOptions(sizingOptions)) {
        this._sizeOptions = { [sizingOptions.orientation]: sizingOptions };
      } else {
        sizingOptions = _sizingOptions as MultiSizeOptions;

        // complexer object
        if (sizingOptions) {
          this._sizeOptions = sizingOptions;
        }
      }
    } else {
      // helemaal geen sizing, dan default...
      this._sizeOptions = { [DefaultSizeOptions.orientation]: DefaultSizeOptions };
    }
  }

  // SLEEP / WAKE
  sleep(): void {
    if (this.sleeping) {
      return;
    }
    this.sleeping = true;

    Logger.debug('sleep()');

    this.timeScaleBeforeSleep = this._timeScale;
    this._timeScale = 0;

    storeTickerTimeBeforeSleep();
    setTickerGlobalTimeScale(0);
    gsap.globalTimeline.timeScale(0);
    GSAPTicker.lagSmoothing(0, 0);
    GSAPTicker.sleep();
  }

  wake(): void {
    if (!this.sleeping) {
      return;
    }
    this.sleeping = false;

    Logger.debug('wake()');

    GSAPTicker.wake();
    GSAPTicker.lagSmoothing(500, 33);

    if (typeof this.timeScaleBeforeSleep === 'number') {
      this._timeScale = this.timeScaleBeforeSleep;
      gsap.globalTimeline.timeScale(this._timeScale);
      setTickerGlobalTimeScale(this._timeScale);
    }

    restoreTickerTimeAfterSleep();

    if (this.resizedWhileSleeping) {
      this.resize();
    }

    this.resizedWhileSleeping = false;
  }

  // TIMESCALE
  get timeScale(): number {
    return this._timeScale;
  }

  set timeScale(_value: number) {
    if (_value === 0) {
      this.sleep();
      return;
    } else {
      this.wake();
    }

    this._timeScale = _value;
    gsap.globalTimeline.timeScale(_value);
    setTickerGlobalTimeScale(_value);
  }

  // PERFORMANCE
  lowPerformance(): void {
    // Logger.info('ticker', 'Starting energy saving mode');
    Logger.debug('Starting energy saving mode.');

    // GSAPTicker.useRAF(false);
    GSAPTicker.fps(30);
  }

  highPerformance(): void {
    Logger.debug('Exiting energy saving mode');

    // GSAPTicker.useRAF(true);
    GSAPTicker.fps(this.options ? this.options.fps : 60);
  }

  // TEXTURES
  unloadTextures(): void {
    if (!this.textureGC || this.unloadingTextures) {
      return;
    }

    this.unloadingTextures = true;

    const oldIdle = this.textureGC.maxIdle;
    this.textureGC.maxIdle = 0;

    Delayed.async(() => {
      if (this.textureGC) {
        this.textureGC.run();
        this.textureGC.maxIdle = oldIdle;
      }
      this.unloadingTextures = false;
    });
  }

  generateTexture(_displayObject: DisplayObject, _region?: Rectangle): Texture | RenderTexture {
    return this.renderer.generateTexture(_displayObject, {
      scaleMode: settings.SCALE_MODE,
      resolution: this._generateResolution,
      region: _region,
      multisample: MSAA_QUALITY.MEDIUM,
    });
  }

  destroyTextureIn(_sprite: Sprite, _destroyBaseTexture?: boolean): void {
    const oldTexture = _sprite.texture;

    _sprite.texture = Texture.EMPTY;

    if (oldTexture && oldTexture !== Texture.EMPTY) {
      oldTexture.destroy(_destroyBaseTexture === false ? false : true);
    }
  }

  getGlobalPosition(source: Container, position: Point = new Point(0, 0)): IPoint {
    const pos = this.view.toLocal(source.toGlobal(position));
    pos.x = pos.x / this.scale.x;
    pos.y = pos.y / this.scale.y;
    return pos;
  }

  extractImage(_source: DisplayObject | RenderTexture, _format?: string, _quality?: number): HTMLImageElement {
    return this.renderer.plugins.extract.image(_source, _format, _quality);
  }

  extractPixels(_source: DisplayObject | RenderTexture): Uint8Array {
    return this.renderer.plugins.extract.pixels(_source);
  }

  takeScreenshot(): void {
    const w = window.open('', '');

    // geblokt door popup?
    if (!w || !w.document) {
      return;
    }

    w.document.title = 'Screenshot';
    w.document.body.style.backgroundColor = 'black';

    this.update();

    const img = new Image();
    img.src = this.renderer.view.toDataURL('image/png');
    img.style.transformOrigin = '0 0';
    img.style.transform = 'scale(0.25)';

    w.document.body.append(img);
  }

  // GET / SET

  get interaction(): InteractionManager | undefined {
    return this.renderer.plugins.interaction;
  }

  get accessibility(): AccessibilityManager | undefined {
    return this.renderer.plugins.accessibility;
  }

  get view(): Container {
    return this._view;
  }

  get fps(): number {
    return this._fps;
  }

  get scale(): { x: number; y: number } {
    return this._scale;
  }

  get position(): { x: number; y: number } {
    return this._position;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get aspectRatio(): number {
    return this._aspect;
  }

  get textureResolution(): number {
    return this._textureResolution;
  }

  get generateResolution(): number {
    return this._generateResolution;
  }

  get resolution(): number {
    return this._rendererResolution;
  }

  get screenOrientation(): string {
    return this.forcedScreenOrientation || Screen.orientation;
  }

  setBackgroundColor(color: number, alpha = 1): void {
    this.renderer.backgroundAlpha = alpha;
    this.renderer.backgroundColor = color;
    document.body.style.backgroundColor = alpha === 0 ? 'transparent' : hexToString(color, alpha);
  }

  render(displayObject: IRenderableObject, options?: IRendererRenderOptions): void {
    this.renderer.render(displayObject, options);
  }

  set forcedOrientation(_value: string) {
    const oldScreenOrientation = this.screenOrientation;
    this.forcedScreenOrientation = _value;

    if (!isApp() && _value !== oldScreenOrientation) {
      this.onScreenResized();
    }
  }

  get defaultWidth(): number {
    return this.currentSizeOptions ? this.currentSizeOptions.size.default.width : DefaultSizeOptions.size.default.width;
  }

  get defaultHeight(): number {
    return this.currentSizeOptions ? this.currentSizeOptions.size.default.height : DefaultSizeOptions.size.default.height;
  }

  mapAspectRatio(_standardScreen: number, _wideScreen: number): number {
    return mapNumber(this._aspect, 0, 1, _standardScreen, _wideScreen, true, 5);
  }
}

export const Stage = new ConcreteStage();
