import { AsyncEvent } from 'ts-events';
export declare class Screen {
    private _width;
    private _height;
    private _orientation;
    private _resolution;
    resized: AsyncEvent<{
        width: number;
        height: number;
    }>;
    orientationChanged: AsyncEvent<string>;
    constructor();
    private onResize;
    private calculateDimension;
    private determineOrientation;
    readonly orientation: string;
    readonly resolution: number;
    readonly width: number;
    readonly height: number;
}
