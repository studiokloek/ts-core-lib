var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Plugins } from '@capacitor/core';
import { Bind } from 'lodash-decorators';
import { round } from 'lodash-es';
import { deviceNeedsMediaTrigger, isApp } from '@studiokloek/kloek-ts-core/device';
import { PubSub } from '@studiokloek/kloek-ts-core/events';
import { AppEvent } from '@studiokloek/kloek-ts-core/eventtypes';
import { Logger } from '@studiokloek/kloek-ts-core/logger';
import { constrainNumber, mapNumber, randomBetween } from '@studiokloek/kloek-ts-core/math';
import { Stage } from '@studiokloek/kloek-ts-core/screen';
import { Delayed } from '@studiokloek/kloek-ts-core/ticker';
import { Tween } from '@studiokloek/kloek-ts-core/tween';
import { getElement } from '@studiokloek/kloek-ts-core/html/selector';
import { Sine } from 'gsap';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
const { SplashScreen } = Plugins;
class MediaTriggerScreen {
    constructor(_target) {
        this.isReady = false;
        if (!_target) {
            Logger.error('splash', 'No target provided...');
            return;
        }
        this.parent = _target;
        this.element = this.parent.querySelector('.media-trigger');
        if (!this.element) {
            Logger.error('splash', 'Could not find media trigger element...');
            return;
        }
        // luister naar touch
        this.element.addEventListener('click', this.onClicked);
        // Screen size change?
        PubSub.subscribe(AppEvent.RESIZED, this.handleAppResized);
        // tonen
        Tween.to(this.element, 0.5, { autoAlpha: 1 }, { delay: 1 });
    }
    async triggered() {
        return new Promise(resolve => {
            this.loadedResolver = resolve;
            this.checkReady();
        });
    }
    onClicked() {
        if (!this.element) {
            return;
        }
        this.isReady = true;
        Tween.to(this.element, 0.5, { autoAlpha: 0 });
        this.checkReady();
    }
    checkReady() {
        if (!this.element || (!CoreDebug.skipMediaTrigger() && (!this.isReady || !this.loadedResolver))) {
            return;
        }
        this.loadedResolver();
        Tween.to(this.element, 0.5, { autoAlpha: 0 });
        PubSub.unsubscribe(this.handleAppResized);
    }
    layout() {
        if (!this.element) {
            return;
        }
        // const offset = this.element.getBoundingClientRect();
        // const coords = this.parent.getBoundingClientRect();
        // Tween.set(this.closeButton, {
        //   x: coords.right - offset.left - 40,
        //   y: coords.top - offset.top - 20,
        // });
        Tween.set(this.element, {
            transformOrigin: '0 0',
            x: 0,
            y: Stage.position.y,
            width: Stage.width,
            height: Stage.height,
            backgroundSize: `${mapNumber(Stage.scale.x, 0.5, 1, 40, 80, true)}px`,
            backgroundPosition: `center ${mapNumber(Stage.scale.x, 0.5, 1, 90, 98, true)}%`,
        });
    }
    handleAppResized() {
        this.layout();
    }
}
__decorate([
    Bind
], MediaTriggerScreen.prototype, "onClicked", null);
__decorate([
    Bind
], MediaTriggerScreen.prototype, "handleAppResized", null);
class WebLoaderScreen {
    constructor(_target) {
        this.position = 0;
        this.targetPosition = 0;
        // target vinden
        this.element = getElement(_target);
        if (!this.element) {
            Logger.error('splash', 'No splash screen element found.');
            return;
        }
        // app? dan killen
        if (isApp()) {
            this.element.remove();
            this.element = null;
            return;
        }
        this.bar = this.element.querySelector('.bar');
        this.indicator = this.element.querySelector('.indicator');
        this.trickle();
    }
    trickle() {
        this.setPostition(this.targetPosition + (1 - this.targetPosition) * randomBetween(0.01, 0.1));
    }
    setPostition(value) {
        this.targetPosition = constrainNumber(round(value, 2), 0, 1);
        if (!this.indicator || !this.bar) {
            return;
        }
        Tween.killTweensOf(this.indicator);
        Tween.to(this, 1, { position: this.targetPosition }, {
            ease: Sine.easeInOut,
            onUpdate: () => {
                if (this.indicator) {
                    Tween.set(this.indicator, { width: `${this.position * 100}%` });
                }
            },
        });
        if (value < 1) {
            Delayed.call(this.trickle, randomBetween(2, 4));
        }
        else {
            Tween.to(this.bar, 0.4, { autoAlpha: 0 });
        }
    }
    complete() {
        this.setPostition(1);
        Delayed.kill(this.trickle);
    }
    hide() {
        if (!this.element) {
            return;
        }
        Tween.to(this.element, 0.5, { autoAlpha: 0 });
    }
    increment(_value = 0.01) {
        this.setPostition(this.position + _value);
    }
    get target() {
        return this.element;
    }
}
__decorate([
    Bind
], WebLoaderScreen.prototype, "trickle", null);
class ConcreteWebSplashScreen {
    init(_target) {
        this.initWebLoaderScreen(_target);
        this.initMediaTriggerScreen();
        PubSub.subscribe(AppEvent.LOAD_COMPLETE, this.onLoadComplete);
        PubSub.subscribe(AppEvent.LOAD_PROGRESS, this.onLoadProgress);
        PubSub.subscribe(AppEvent.READY, this.onReady);
    }
    initWebLoaderScreen(_target) {
        this.loader = new WebLoaderScreen(_target);
    }
    initMediaTriggerScreen() {
        if (this.loader && deviceNeedsMediaTrigger()) {
            this.mediatrigger = new MediaTriggerScreen(this.loader.target);
        }
    }
    async checkMediaReady() {
        if (this.mediatrigger) {
            await this.mediatrigger.triggered();
        }
    }
    onLoadComplete() {
        if (this.loader) {
            this.loader.complete();
        }
        PubSub.unsubscribe([this.onLoadComplete, this.onLoadProgress]);
    }
    onReady() {
        if (this.loader) {
            this.loader.hide();
        }
        SplashScreen.hide();
        PubSub.unsubscribe([this.onReady]);
    }
    onLoadProgress(value = 0.01) {
        if (this.loader) {
            this.loader.increment(value);
        }
    }
}
__decorate([
    Bind
], ConcreteWebSplashScreen.prototype, "onLoadComplete", null);
__decorate([
    Bind
], ConcreteWebSplashScreen.prototype, "onReady", null);
__decorate([
    Bind
], ConcreteWebSplashScreen.prototype, "onLoadProgress", null);
export const WebSplashScreen = new ConcreteWebSplashScreen();
//# sourceMappingURL=web-splash-screen.js.map