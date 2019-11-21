import { isMobile } from '../device';
import { Bind, Debounce } from 'lodash-decorators';
import { AsyncEvent } from 'ts-events';
import { OrientationMode, ResolutionMode } from './constants';
import { determineResolution } from './resolution';

export class Screen {
  private _width = 1;
  private _height = 1;
  private _orientation: string = OrientationMode.LANDSCAPE;
  private _resolution: number = ResolutionMode.NORMAL;

  public resized = new AsyncEvent<{ width: number; height: number }>();
  public orientationChanged = new AsyncEvent<string>();

  public init(): void {
    this.calculateDimension();
    this.determineOrientation();

    // resolutie wordt maar 1 keer geupdate, omdat het pixicanvas
    // niet dynamisch kan wisselen van resolutie
    ({ screen: this._resolution } = determineResolution());

    window.addEventListener('resize', this.onResize);
  }

  @Debounce(500)
  @Bind
  private onResize(): void {
    this.calculateDimension();
    this.determineOrientation();
  }

  private calculateDimension(): void {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // is er wel wat veranderd?
    if (this.height === height && this.width === width) {
      return;
    }

    this._width = width;
    this._height = height;

    this.resized.post({ width: this.width, height: this.height });
  }

  private determineOrientation(): void {
    let orientation = this._orientation;

    // alleen op mobiel kan portrait voorkomen
    if (isMobile() && this.width < this.height) {
      orientation = OrientationMode.PORTRAIT;
    } else {
      orientation = OrientationMode.LANDSCAPE;
    }

    // zelfde?
    if (this._orientation === orientation) {
      return;
    }

    this._orientation = orientation;

    // scroll naar boven
    document.body.scrollTop = 0;

    this.orientationChanged.post(this.orientation);
  }

  public get orientation(): string {
    return this._orientation;
  }

  public get resolution(): number {
    return this._resolution;
  }

  public get width(): number {
    return this._width;
  }

  public get height(): number {
    return this._height;
  }
}
