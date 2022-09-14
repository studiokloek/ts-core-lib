import { gsap } from 'gsap';
import { Bind } from 'lodash-decorators-esm';
import { ceil, get, round } from 'lodash-es';
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
} from 'pixi.js';
import { Screen } from '.';
import { CoreDebug } from '../debug';
import { Delayed } from '../delay';
import { getGPUInfo, GPUInfo, isApp } from '../device';
import { AppEvent, PubSub } from '../events';
import { getLogger } from '../logger';
import { restoreTickerTimeAfterSleep, setTickerGlobalTimeScale, storeTickerTimeBeforeSleep } from '../ticker';
import { Tween } from '../tween';
import { constrainNumber } from '../util/math';
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
  private _interaction: InteractionManager | undefined;
  private sharedTicker!: PixiTicker;
  private _timeScale = 1;
  private timeScaleBeforeSleep: number | undefined;
  private sleeping = false;
  private forcedScreenOrientation: string | undefined;
  private firstResize = true;

  public constructor() {
    this._view = new Container();
    this._view.interactive = true;
  }

  // INIT

  public init(_options: StageOptions, _sizingOptions?: SizeOptions | MultiSizeOptions): void {
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
    this.initInteraction();
    this.connectToTarget();

    // listen for resize
    this.onScreenResized();
    Screen.resized.attach(this.onScreenResized);

    // een keer renderen zodat we geen zwarte flits zien
    this.render();
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

      // body zelfde achtegrond kleur
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

  private initInteraction(): void {
    if (!this.renderer) {
      return;
    }

    this._interaction = this.renderer.plugins.interaction as InteractionManager;
    this._interaction.autoPreventDefault = true;
  }

  private initRenderer(): void {
    const renderSettings = this.getRendererOptions();

    // zet filter resolutie op scherm resolutie
    settings.FILTER_RESOLUTION = renderSettings.resolution as number;

    // pixi renderer
    this.renderer = autoDetectRenderer(renderSettings);
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

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    Logger.debug('Starting...');

    GSAPTicker.add(this.render);
  }

  @Bind()
  private render(): void {
    this.sharedTicker.update(GSAPTicker.time * 1000);
    this.renderer.render(this._view);
  }

  // RESIZE

  private resize(): void {
    const options = this.currentSizeOptions;

    if (!options) {
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

    this._aspect = options.orientation === OrientationMode.LANDSCAPE ? round(this.scale.y / this.scale.x, 5) : round(this.scale.x / this.scale.y, 5);

    // afronden
    this._width = ceil(this._width);
    this._height = ceil(this._height);

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
      PubSub.publish(AppEvent.RESIZED, info, true);
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

    // bestaat er een optie voor de huidige orientatie
    if (this._sizeOptions) {
      if (this._sizeOptions[orientation]) {
        Logger.debug('determineSizeOptions()', `Found options for orientation:${orientation}`);
        options = this._sizeOptions[orientation];
      } else {
        // is er wel een vaste groote voor andere orientatie?
        // dan gebruiken we deze voor beide groottes
        const oppositeOrientation = orientation === OrientationMode.LANDSCAPE ? OrientationMode.PORTRAIT : OrientationMode.LANDSCAPE;
        if (this._sizeOptions[oppositeOrientation]) {
          Logger.debug('determineSizeOptions()', `Found options for opposite orientation:${oppositeOrientation}`);
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

    if (!sizingOptions) {
      // helemaal geen sizing, dan default...
      this._sizeOptions = { [DefaultSizeOptions.orientation]: DefaultSizeOptions };
    } else {
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
    }
  }

  // SLEEP / WAKE
  public sleep(): void {
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

  public wake(): void {
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
  }

  // TIMESCALE
  public get timeScale(): number {
    return this._timeScale;
  }

  public set timeScale(_value: number) {
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
  public lowPerformance(): void {
    // Logger.info('ticker', 'Starting energy saving mode');
    Logger.debug('Starting energy saving mode.');

    // GSAPTicker.useRAF(false);
    GSAPTicker.fps(30);
  }

  public highPerformance(): void {
    Logger.debug('Exiting energy saving mode');

    // GSAPTicker.useRAF(true);
    GSAPTicker.fps(this.options ? this.options.fps : 60);
  }

  // TEXTURES
  public unloadTextures(): void {
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

  public generateTexture(_displayObject: DisplayObject, _region?: Rectangle): Texture | RenderTexture {
    return this.renderer.generateTexture(_displayObject, {
      scaleMode: settings.SCALE_MODE,
      resolution: this._generateResolution,
      region: _region,
      multisample: MSAA_QUALITY.MEDIUM,
    });
  }

  public destroyTextureIn(_sprite: Sprite, _destroyBaseTexture?: boolean): void {
    const oldTexture = _sprite.texture;

    _sprite.texture = Texture.EMPTY;

    if (oldTexture && oldTexture !== Texture.EMPTY) {
      oldTexture.destroy(_destroyBaseTexture === false ? false : true);
    }
  }

  public getGlobalPosition(source: Container, position: Point = new Point(0, 0)): IPoint {
    const pos = this.view.toLocal(source.toGlobal(position));
    pos.x = pos.x / this.scale.x;
    pos.y = pos.y / this.scale.y;
    return pos;
  }

  public extractImage(_source: DisplayObject | RenderTexture, _format?: string, _quality?: number): HTMLImageElement {
    return this.renderer.plugins.extract.image(_source, _format, _quality);
  }

  public extractPixels(_source: DisplayObject | RenderTexture): Uint8Array {
    return this.renderer.plugins.extract.pixels(_source);
  }

  public takeScreenshot(): void {
    const w = window.open('', '');

    // geblokt door popup?
    if (!w || !w.document) {
      return;
    }

    w.document.title = 'Screenshot';
    w.document.body.style.backgroundColor = 'black';

    this.render();

    const img = new Image();
    img.src = this.renderer.view.toDataURL('image/png');
    img.style.transformOrigin = '0 0';
    img.style.transform = 'scale(0.25)';

    w.document.body.append(img);
  }

  // GET / SET

  public get interaction(): InteractionManager | undefined {
    return this._interaction;
  }

  public get view(): Container {
    return this._view;
  }

  public get fps(): number {
    return this._fps;
  }

  public get scale(): { x: number; y: number } {
    return this._scale;
  }

  public get position(): { x: number; y: number } {
    return this._position;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }

  public get aspect(): number {
    return this._aspect;
  }

  public get textureResolution(): number {
    return this._textureResolution;
  }

  public get generateResolution(): number {
    return this._generateResolution;
  }

  public get resolution(): number {
    return this._rendererResolution;
  }

  public get screenOrientation(): string {
    return this.forcedScreenOrientation || Screen.orientation;
  }

  public set forcedOrientation(_value: string) {
    const oldScreenOrientation = this.screenOrientation;
    this.forcedScreenOrientation = _value;

    // in app force orientation with plugin
    const orientation = get(window, 'screen.orientation') as ScreenOrientation;
    if (isApp() && orientation) {
      if (this.forcedScreenOrientation) {
        const lockOrientation = this.forcedScreenOrientation === OrientationMode.LANDSCAPE ? 'landscape-primary' : 'portrait-primary';

        if (orientation.type !== lockOrientation) {
          orientation
            .lock(lockOrientation)
            .then(() => {
              Logger.debug(`Locked orientation to '${lockOrientation}'`);
              return;
            })
            .catch(() => {
              Logger.warn('Could not lock orientation on this device.');
            });
        }
      } else {
        orientation.unlock();
      }
    } else {
      if (_value !== oldScreenOrientation) {
        this.onScreenResized();
      }
    }
  }

  public get defaultWidth(): number {
    return this.currentSizeOptions ? this.currentSizeOptions.size.default.width : DefaultSizeOptions.size.default.width;
  }

  public get defaultHeight(): number {
    return this.currentSizeOptions ? this.currentSizeOptions.size.default.height : DefaultSizeOptions.size.default.height;
  }
}

export const Stage = new ConcreteStage();
