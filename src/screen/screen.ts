// import { isMobile } from '../device';
import { Bind, Throttle } from 'lodash-decorators';
import { AsyncEvent } from 'ts-events';
import { OrientationMode, ResolutionMode } from './constants';
import { determineResolution } from './resolution';

class ConcreteScreen {
  private _width = 0;
  private _height = 0;
  private _orientation: string = OrientationMode.LANDSCAPE;
  private _resolution: number = ResolutionMode.NORMAL;

  public resized = new AsyncEvent<{ width: number; height: number }>();
  public orientationChanged = new AsyncEvent<string>();

  public init(): void {
    this.handleResize();

    // resolutie wordt maar 1 keer geupdate, omdat het pixicanvas
    // niet dynamisch kan wisselen van resolutie
    ({ screen: this._resolution } = determineResolution());

    window.addEventListener('resize', this.onResize);
  }

  @Throttle(250)
  @Bind
  private onResize(): void {
    this.handleResize();
  }

  private handleResize(): void {
    const resized = this.calculateDimension();

    if (!resized) {
      return;
    }

    const orientationChanged = this.determineOrientation();

    if (orientationChanged) {
      this.orientationChanged.post(this.orientation);
    }

    this.resized.post({ width: this.width, height: this.height });
  }

  private calculateDimension(): boolean {
    const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
      height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // is er wel wat veranderd?
    if (this.height === height && this.width === width) {
      return false;
    }

    this._width = width;
    this._height = height;

    return true;
  }

  private determineOrientation(): boolean {
    let orientation = this._orientation;

    // alleen op mobiel kan portrait voorkomen
    orientation = this.width < this.height ? OrientationMode.PORTRAIT : OrientationMode.LANDSCAPE;

    // zelfde?
    if (this._orientation === orientation) {
      return false;
    }

    this._orientation = orientation;

    // scroll naar boven
    document.body.scrollTop = 0;

    return true;
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

export const Screen = new ConcreteScreen();
