import {
  AppEvent,
  constrainNumber,
  CoreDebug,
  Delayed,
  getGPUInfo,
  getLogger,
  GPUInfo,
  PubSub,
  restoreTickerTimeAfterSleep,
  setTickerGlobalTimeScale,
  storeTickerTimeBeforeSleep,
  Tween,
} from '@studiokloek/ts-core-lib';
import { TweenMax } from 'gsap';
import { Bind } from 'lodash-decorators';
import { ceil, round } from 'lodash-es';
import {
  autoDetectRenderer,
  CanvasRenderer,
  Container,
  DisplayObject,
  Graphics,
  interaction,
  Point,
  Rectangle,
  Renderer,
  settings,
  Sprite,
  systems,
  Texture,
  Ticker as PixiTicker,
  utils,
} from 'pixi.js-legacy';
import Stats from 'stats.js';
import { determineResolution, ResolutionMode, Screen, StageInfo } from '.';

const Logger = getLogger('core > stage');

// geen pixi bericht
utils.skipHello();

interface RendererOptions {
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

interface StageOptions {
  backgroundColor?: number | undefined;
  fps: number;
  target: HTMLElement | string;
}

interface SizeOptions {
  size: {
    default: {
      width: number;
      heigth: number;
    };
    minimum: {
      width: number;
      heigth: number;
    };
    maximum: {
      width: number;
      heigth: number;
    };
  };
  ratio: {
    min: number;
    max: number;
  };
}

const DefaultStageOptions: StageOptions = {
  fps: 60,
  backgroundColor: 0x000000,
  target: '#app',
};

const DefaultSizeOptions: SizeOptions = {
  size: {
    default: {
      width: 1024,
      heigth: 768,
    },
    minimum: {
      width: 320,
      heigth: 240,
    },
    maximum: {
      width: 2048,
      heigth: 1536,
    },
  },
  ratio: {
    min: 4 / 3,
    max: 16 / 9,
  },
};

const gpuInfo: GPUInfo = getGPUInfo();
const TweenMaxTicker = TweenMax.ticker;

class Stage extends Container {}

export class ConcreteStage {
  private _width: number = Screen.width;
  private _height: number = Screen.height;
  private _aspect = 0;
  private _scale = { x: 1, y: 1 };
  private _position = { x: 0, y: 0 };
  private _fps = 60;
  private _textureResolution: number = ResolutionMode.NORMAL;
  private _generateResolution: number = ResolutionMode.NORMAL;

  private options: StageOptions | undefined;
  private sizeOptions: SizeOptions | undefined;
  private isRunning = false;
  private renderer!: Renderer | CanvasRenderer;
  private target: HTMLElement | null | undefined;
  private _view: Stage;
  private textureGC: systems.TextureGCSystem | undefined;
  private unloadingTextures: boolean | undefined;
  private interaction: interaction.InteractionManager | undefined;
  private sharedTicker!: PixiTicker;
  private _timeScale: number = 1;
  private timeScaleBeforeSleep: number | undefined;
  private sleeping = false;
  private stats: Stats | undefined;

  public constructor() {
    this._view = new Stage();
    this._view.interactive = true;
  }

  // INIT

  public init(_options: StageOptions, _sizingOptions?: SizeOptions): void {
    this.options = { ...DefaultStageOptions, ..._options };
    this.sizeOptions = { ...DefaultSizeOptions, ..._sizingOptions };

    // basis fps
    this._fps = this.options.fps || DefaultStageOptions.fps;

    // bepaal texture resolutie
    ({ texture: this._textureResolution } = determineResolution());
    this._generateResolution = this._textureResolution;

    this.checkPerformance();
    this.initDebug();
    this.initRenderer();
    this.initTicker();
    this.initGC();
    this.initInteraction();
    this.connectToTarget();

    // force once and then listen for resizes
    this.resize();
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

  private initDebug(): void {
    if (!CoreDebug.showStats()) {
      return;
    }

    this.stats = new Stats();
    this.stats.dom.style.top = null;
    this.stats.dom.style.bottom = '0';
    document.body.append(this.stats.dom);
    this.stats.showPanel(0);
  }

  private checkPerformance(): void {
    // canvas renderers krijgen nooit retina
    if (!gpuInfo.isWebGLSupported || gpuInfo.useLegacyWebGL) {
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
    TweenMaxTicker.fps(this.options.fps);
    TweenMaxTicker.useRAF(true);

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

    this.interaction = this.renderer.plugins.interaction as interaction.InteractionManager;
    this.interaction.autoPreventDefault = true;
  }

  private initRenderer(): void {
    const renderSettings: RendererOptions = this.getRendererOptions();

    // zet filter resolutie op scherm resolutie
    settings.FILTER_RESOLUTION = renderSettings.resolution as number;

    // pixi renderer
    this.renderer = autoDetectRenderer(renderSettings);
  }

  private getRendererOptions(): RendererOptions {
    // standaard zelfde resolutie als het scherm
    let rendererResolution = Screen.resolution;

    // lagere texture resolutie? (bv geen webgl) dan ook renderen lager
    if (this._textureResolution === ResolutionMode.NORMAL) {
      rendererResolution = ResolutionMode.NORMAL;
    }

    const renderOptions: RendererOptions = {
      width: this.width,
      height: this.height,
      autoDensity: true,
      preserveDrawingBuffer: gpuInfo.preserveDrawingBuffer,
      transparent: false,
      antialias: false,
      resolution: rendererResolution,
      forceCanvas: !gpuInfo.isWebGLSupported,
      backgroundColor: this.options ? this.options.backgroundColor : 0x000000,
      forceFXAA: false,
    };

    Logger.info('Render options:', renderOptions);

    return renderOptions;
  }

  // RENDER

  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    Logger.debug('Starting...');

    if (CoreDebug.showStats() && this.stats) {
      TweenMaxTicker.addEventListener('tick', this.debugRender, this, false, 1);
      this.stats.begin();
    } else {
      TweenMaxTicker.addEventListener('tick', this.render, this, false, 1);
    }
  }

  private render(): void {
    this.sharedTicker.update(TweenMaxTicker.time * 1000);
    this.renderer.render(this._view);
  }

  private debugRender(): void {
    this.render();

    if (this.stats) {
      this.stats.update();
    }
  }

  // RESIZE

  private resize(): void {
    if (!this.sizeOptions) {
      return;
    }

    const screenRatio = Screen.width / Screen.height;
    const { min: minRatio, max: maxRatio } = this.sizeOptions.ratio;
    const { width: minWidth, heigth: minHeight } = this.sizeOptions.size.minimum;
    const { width: maxWidth, heigth: maxHeight } = this.sizeOptions.size.maximum;

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

    // afronden
    this._width = ceil(this._width);
    this._height = ceil(this._height);

    const { width: defaultWidth, heigth: defaultHeight } = this.sizeOptions.size.default;
    this.scale.x = round(this.width / defaultWidth, 5);
    this.scale.y = round(this.height / defaultHeight, 5);

    this.position.x = round(Screen.width - this.width) * 0.5;
    this.position.y = round(Screen.height - this.height) * 0.5;

    this._aspect = round(this.scale.y / this.scale.x, 5);

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

    PubSub.publish(AppEvent.RESIZED, info, true);

    if (this.stats) {
      this.stats.dom.style.left = `${this.position.x - 1}px`;
    }
  }

  @Bind
  private onScreenResized(): void {
    this.resize();
  }

  // SLEEP / WAKE
  public sleep(): void {
    if (this.sleeping) {
      return;
    }
    this.sleeping = true;

    Logger.info('sleep()');

    this.timeScaleBeforeSleep = this._timeScale;
    this._timeScale = 0;

    TweenMaxTicker.sleep();

    TweenMax.globalTimeScale(0);
    setTickerGlobalTimeScale(0);

    TweenMax.lagSmoothing(0, 0);

    storeTickerTimeBeforeSleep();
  }

  public wake(): void {
    if (!this.sleeping) {
      return;
    }
    this.sleeping = false;

    Logger.info('wake()');

    TweenMaxTicker.wake(false);
    TweenMax.lagSmoothing(500, 33);

    if (typeof this.timeScaleBeforeSleep === 'number') {
      this._timeScale = this.timeScaleBeforeSleep;
      TweenMax.globalTimeScale(this._timeScale);
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
    TweenMax.globalTimeScale(_value);
    setTickerGlobalTimeScale(_value);
  }

  // PERFORMANCE
  public lowPerformance(): void {
    // Logger.info('ticker', 'Starting energy saving mode');
    Logger.info('Starting energy saving mode.');

    TweenMaxTicker.useRAF(false);
    TweenMaxTicker.fps(30);
  }

  public highPerformance(): void {
    Logger.info('Exiting energy saving mode');

    TweenMaxTicker.useRAF(true);
    TweenMaxTicker.fps(this.options ? this.options.fps : 60);
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

  public generateTexture(_displayObject: Container, _region?: Rectangle): Texture {
    if (typeof (_displayObject as Graphics).generateCanvasTexture === 'function') {
      return (_displayObject as Graphics).generateCanvasTexture(settings.SCALE_MODE, 1);
    }

    return this.renderer.generateTexture(_displayObject, settings.SCALE_MODE, this._generateResolution, _region);
  }

  public destroyTextureIn(_sprite: Sprite, _destroyBaseTexture?: boolean): void {
    const oldTexture = _sprite.texture;

    _sprite.texture = Texture.EMPTY;

    if (oldTexture && oldTexture !== Texture.EMPTY) {
      oldTexture.destroy(_destroyBaseTexture === false ? false : true);
    }
  }

  public getGlobalPosition(source: Container, position: Point = new Point(0, 0)): Point {
    const pos = this.view.toLocal(source.toGlobal(position));
    pos.x = pos.x / this.scale.x;
    pos.y = pos.y / this.scale.y;
    return pos;
  }

  public extractImage(_source: DisplayObject): HTMLImageElement {
    return this.renderer.plugins.extract.image(_source);
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
    // eslint-disable-next-line unicorn/prevent-abbreviations
    img.src = this.renderer.view.toDataURL('image/png');
    img.style.transformOrigin = '0 0';
    img.style.transform = 'scale(0.25)';

    w.document.body.append(img);
  }

  // GET / SET

  public get view(): Stage {
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
}
