var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TweenMax } from 'gsap';
import { Bind } from 'lodash-decorators';
import { ceil, round } from 'lodash-es';
import { autoDetectRenderer, Container, Point, settings, Texture, Ticker as PixiTicker, utils, Renderer, } from 'pixi.js-legacy';
import Stats from 'stats.js';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
import { getGPUInfo } from '@studiokloek/kloek-ts-core/device';
import { PubSub } from '@studiokloek/kloek-ts-core/events';
import { AppEvent } from '@studiokloek/kloek-ts-core/eventtypes';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { constrainNumber } from '@studiokloek/kloek-ts-core/math';
import { Delayed, restoreTickerTimeAfterSleep, setTickerGlobalTimeScale, storeTickerTimeBeforeSleep } from '@studiokloek/kloek-ts-core/ticker';
import { Tween } from '@studiokloek/kloek-ts-core/tween';
import { determineResolution, ResolutionMode, Screen } from '.';
const Logger = getLogger('core > stage');
// geen pixi bericht
utils.skipHello();
const DefaultStageOptions = {
    fps: 60,
    backgroundColor: 0x000000,
    target: '#app',
};
const DefaultSizeOptions = {
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
const gpuInfo = getGPUInfo();
const TweenMaxTicker = TweenMax.ticker;
class Stage extends Container {
}
export class ConcreteStage {
    constructor() {
        this._width = Screen.width;
        this._height = Screen.height;
        this._aspect = 0;
        this._scale = { x: 1, y: 1 };
        this._position = { x: 0, y: 0 };
        this._fps = 60;
        this._textureResolution = ResolutionMode.NORMAL;
        this._generateResolution = ResolutionMode.NORMAL;
        this.isRunning = false;
        this._timeScale = 1;
        this.sleeping = false;
        this._view = new Stage();
        this._view.interactive = true;
    }
    // INIT
    init(_options, _sizingOptions) {
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
    connectToTarget() {
        if (!this.options || !this.renderer) {
            return;
        }
        // target vinden
        if (typeof this.options.target === 'string') {
            this.target = document.querySelector(this.options.target);
        }
        else if (this.options.target instanceof HTMLElement) {
            this.target = this.options.target;
        }
        if (!this.target) {
            this.target = document.body;
        }
        if (this.target) {
            // geen context menu
            this.target.addEventListener('contextmenu', (event) => {
                event.preventDefault();
            });
            // body zelfde achtegrond kleur
            if (this.options.backgroundColor !== undefined) {
                document.body.style.backgroundColor = `#${this.options.backgroundColor === 0 ? '000' : this.options.backgroundColor.toString(16)}`;
            }
            this.target.append(this.renderer.view);
        }
    }
    initDebug() {
        if (!CoreDebug.showStats()) {
            return;
        }
        this.stats = new Stats();
        this.stats.dom.style.top = null;
        this.stats.dom.style.bottom = '0';
        document.body.append(this.stats.dom);
        this.stats.showPanel(0);
    }
    checkPerformance() {
        // canvas renderers krijgen nooit retina
        if (!gpuInfo.isWebGLSupported || gpuInfo.useLegacyWebGL) {
            this._textureResolution = 1;
            this._generateResolution = 1;
            this._fps = 30;
        }
    }
    initTicker() {
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
    initGC() {
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
    initInteraction() {
        if (!this.renderer) {
            return;
        }
        this.interaction = this.renderer.plugins.interaction;
        this.interaction.autoPreventDefault = true;
    }
    initRenderer() {
        const renderSettings = this.getRendererOptions();
        // zet filter resolutie op scherm resolutie
        settings.FILTER_RESOLUTION = renderSettings.resolution;
        // pixi renderer
        this.renderer = autoDetectRenderer(renderSettings);
    }
    getRendererOptions() {
        // standaard zelfde resolutie als het scherm
        let rendererResolution = Screen.resolution;
        // lagere texture resolutie? (bv geen webgl) dan ook renderen lager
        if (this._textureResolution === ResolutionMode.NORMAL) {
            rendererResolution = ResolutionMode.NORMAL;
        }
        const renderOptions = {
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
    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        Logger.debug('Starting...');
        if (CoreDebug.showStats() && this.stats) {
            TweenMaxTicker.addEventListener('tick', this.debugRender, this, false, 1);
            this.stats.begin();
        }
        else {
            TweenMaxTicker.addEventListener('tick', this.render, this, false, 1);
        }
    }
    render() {
        this.sharedTicker.update(TweenMaxTicker.time * 1000);
        this.renderer.render(this._view);
    }
    debugRender() {
        this.render();
        if (this.stats) {
            this.stats.update();
        }
    }
    // RESIZE
    resize() {
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
        }
        else if (screenRatio > maxRatio) {
            // balken aan de zijkant
            this._height = Screen.height;
            this._height = constrainNumber(this._height, minHeight, maxHeight);
            this._width = this._height * maxRatio;
        }
        else {
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
        const info = {
            size: { width: this.width, height: this.height },
            scale: this.scale,
            position: this.position,
        };
        PubSub.publish(AppEvent.RESIZED, info, true);
        if (this.stats) {
            this.stats.dom.style.left = `${this.position.x - 1}px`;
        }
    }
    onScreenResized() {
        this.resize();
    }
    // SLEEP / WAKE
    sleep() {
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
    wake() {
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
    get timeScale() {
        return this._timeScale;
    }
    set timeScale(_value) {
        if (_value === 0) {
            this.sleep();
            return;
        }
        else {
            this.wake();
        }
        this._timeScale = _value;
        TweenMax.globalTimeScale(_value);
        setTickerGlobalTimeScale(_value);
    }
    // PERFORMANCE
    lowPerformance() {
        // Logger.info('ticker', 'Starting energy saving mode');
        Logger.info('Starting energy saving mode.');
        TweenMaxTicker.useRAF(false);
        TweenMaxTicker.fps(30);
    }
    highPerformance() {
        Logger.info('Exiting energy saving mode');
        TweenMaxTicker.useRAF(true);
        TweenMaxTicker.fps(this.options ? this.options.fps : 60);
    }
    // TEXTURES
    unloadTextures() {
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
    generateTexture(_displayObject, _region) {
        if (typeof _displayObject.generateCanvasTexture === 'function') {
            return _displayObject.generateCanvasTexture(settings.SCALE_MODE, 1);
        }
        return this.renderer.generateTexture(_displayObject, settings.SCALE_MODE, this._generateResolution, _region);
    }
    destroyTextureIn(_sprite, _destroyBaseTexture) {
        const oldTexture = _sprite.texture;
        _sprite.texture = Texture.EMPTY;
        if (oldTexture && oldTexture !== Texture.EMPTY) {
            oldTexture.destroy(_destroyBaseTexture === false ? false : true);
        }
    }
    getGlobalPosition(source, position = new Point(0, 0)) {
        const pos = this.view.toLocal(source.toGlobal(position));
        pos.x = pos.x / this.scale.x;
        pos.y = pos.y / this.scale.y;
        return pos;
    }
    extractImage(_source) {
        return this.renderer.plugins.extract.image(_source);
    }
    takeScreenshot() {
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
    get view() {
        return this._view;
    }
    get fps() {
        return this._fps;
    }
    get scale() {
        return this._scale;
    }
    get position() {
        return this._position;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    get aspect() {
        return this._aspect;
    }
}
__decorate([
    Bind
], ConcreteStage.prototype, "onScreenResized", null);
//# sourceMappingURL=stage.js.map