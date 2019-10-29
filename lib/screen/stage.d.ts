import { Container, DisplayObject, Point, Rectangle, Sprite, Texture } from 'pixi.js-legacy';
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
declare class Stage extends Container {
}
export declare class ConcreteStage {
    private _width;
    private _height;
    private _aspect;
    private _scale;
    private _position;
    private _fps;
    private _textureResolution;
    private _generateResolution;
    private options;
    private sizeOptions;
    private isRunning;
    private renderer;
    private target;
    private _view;
    private textureGC;
    private unloadingTextures;
    private interaction;
    private sharedTicker;
    private _timeScale;
    private timeScaleBeforeSleep;
    private sleeping;
    private stats;
    constructor();
    init(_options: StageOptions, _sizingOptions?: SizeOptions): void;
    private connectToTarget;
    private initDebug;
    private checkPerformance;
    private initTicker;
    private initGC;
    private initInteraction;
    private initRenderer;
    private getRendererOptions;
    start(): void;
    private render;
    private debugRender;
    private resize;
    private onScreenResized;
    sleep(): void;
    wake(): void;
    timeScale: number;
    lowPerformance(): void;
    highPerformance(): void;
    unloadTextures(): void;
    generateTexture(_displayObject: Container, _region?: Rectangle): Texture;
    destroyTextureIn(_sprite: Sprite, _destroyBaseTexture?: boolean): void;
    getGlobalPosition(source: Container, position?: Point): Point;
    extractImage(_source: DisplayObject): HTMLImageElement;
    takeScreenshot(): void;
    readonly view: Stage;
    readonly fps: number;
    readonly scale: {
        x: number;
        y: number;
    };
    readonly position: {
        x: number;
        y: number;
    };
    readonly width: number;
    readonly height: number;
    readonly aspect: number;
}
export {};
