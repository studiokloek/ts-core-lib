var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bind, Debounce } from 'lodash-decorators';
import { AsyncEvent } from 'ts-events';
import { isMobile } from '@studiokloek/kloek-ts-core/device';
import { OrientationMode, ResolutionMode } from './constants';
import { determineResolution } from './resolution';
export class Screen {
    constructor() {
        this._width = 1;
        this._height = 1;
        this._orientation = OrientationMode.LANDSCAPE;
        this._resolution = ResolutionMode.NORMAL;
        this.resized = new AsyncEvent();
        this.orientationChanged = new AsyncEvent();
        this.calculateDimension();
        // resolutie wordt maar 1 keer geupdate, omdat we geen het pixicanvas
        // niet dynamisch kan wisselen van resolutie
        ({ screen: this._resolution } = determineResolution());
        window.addEventListener('resize', this.onResize);
    }
    onResize() {
        this.calculateDimension();
        this.determineOrientation();
    }
    calculateDimension() {
        const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0), height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        // is er wel wat veranderd?
        if (this.height === height && this.width === width) {
            return;
        }
        this._width = width;
        this._height = height;
        this.resized.post({ width: this.width, height: this.height });
    }
    determineOrientation() {
        let orientation = this._orientation;
        // alleen op mobiel kan portrait voorkomen
        if (isMobile() && this.width < this.height) {
            orientation = OrientationMode.PORTRAIT;
        }
        else {
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
    get orientation() {
        return this._orientation;
    }
    get resolution() {
        return this._resolution;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
}
__decorate([
    Debounce(500),
    Bind
], Screen.prototype, "onResize", null);
//# sourceMappingURL=screen.js.map