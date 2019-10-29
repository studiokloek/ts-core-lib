import { Plugins } from '@capacitor/core';
import { Sine } from 'gsap';
import { Bind } from 'lodash-decorators';
import { round } from 'lodash-es';
import { CoreDebug } from '../debug';
import { Delayed } from '../delay';
import { deviceNeedsMediaTrigger, isApp } from '../device';
import { AppEvent, PubSub } from '../events';
import { getElement } from '../html';
import { Logger } from '../logger';
import { Stage } from '../screen';
import { Tween } from '../tween';
import { constrainNumber, mapNumber, randomBetween } from '../util/math';
const { SplashScreen } = Plugins;

class MediaTriggerScreen {
  private parent!: HTMLElement;
  private element!: HTMLElement | null;
  private loadedResolver!: (value?: any) => void;
  private isReady: boolean = false;

  public constructor(_target: HTMLElement | null) {
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

  public async triggered(): Promise<void> {
    return new Promise(resolve => {
      this.loadedResolver = resolve;
      this.checkReady();
    });
  }

  @Bind
  private onClicked(): void {
    if (!this.element) {
      return;
    }

    this.isReady = true;

    Tween.to(this.element, 0.5, { autoAlpha: 0 });

    this.checkReady();
  }

  private checkReady(): void {
    if (!this.element || (!CoreDebug.skipMediaTrigger() && (!this.isReady || !this.loadedResolver))) {
      return;
    }

    this.loadedResolver();

    Tween.to(this.element, 0.5, { autoAlpha: 0 });

    PubSub.unsubscribe(this.handleAppResized);
  }

  private layout(): void {
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

  @Bind
  protected handleAppResized(): void {
    this.layout();
  }
}

class WebLoaderScreen {
  private element: HTMLElement | null;
  private position: number = 0;
  private targetPosition: number = 0;
  private indicator!: HTMLElement | null;
  private bar!: HTMLElement | null;

  public constructor(_target: HTMLElement | string) {
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

  @Bind
  private trickle(): void {
    this.setPostition(this.targetPosition + (1 - this.targetPosition) * randomBetween(0.01, 0.1));
  }

  private setPostition(value: number): void {
    this.targetPosition = constrainNumber(round(value, 2), 0, 1);

    if (!this.indicator || !this.bar) {
      return;
    }

    Tween.killTweensOf(this.indicator);
    Tween.to(
      this,
      1,
      { position: this.targetPosition },
      {
        ease: Sine.easeInOut,
        onUpdate: () => {
          if (this.indicator) {
            Tween.set(this.indicator, { width: `${this.position * 100}%` });
          }
        },
      },
    );

    if (value < 1) {
      Delayed.call(this.trickle, randomBetween(2, 4));
    } else {
      Tween.to(this.bar, 0.4, { autoAlpha: 0 });
    }
  }

  public complete(): void {
    this.setPostition(1);
    Delayed.kill(this.trickle);
  }

  public hide(): void {
    if (!this.element) {
      return;
    }

    Tween.to(this.element, 0.5, { autoAlpha: 0 });
  }

  public increment(_value: number = 0.01): void {
    this.setPostition(this.position + _value);
  }

  public get target(): HTMLElement | null {
    return this.element;
  }
}

class ConcreteWebSplashScreen {
  private loader: WebLoaderScreen | undefined;
  private mediatrigger: MediaTriggerScreen | undefined;

  public init(_target: HTMLElement | string): void {
    this.initWebLoaderScreen(_target);
    this.initMediaTriggerScreen();

    PubSub.subscribe(AppEvent.LOAD_COMPLETE, this.onLoadComplete);
    PubSub.subscribe(AppEvent.LOAD_PROGRESS, this.onLoadProgress);
    PubSub.subscribe(AppEvent.READY, this.onReady);
  }

  private initWebLoaderScreen(_target: HTMLElement | string): void {
    this.loader = new WebLoaderScreen(_target);
  }

  private initMediaTriggerScreen(): void {
    if (this.loader && deviceNeedsMediaTrigger()) {
      this.mediatrigger = new MediaTriggerScreen(this.loader.target);
    }
  }

  public async checkMediaReady(): Promise<void> {
    if (this.mediatrigger) {
      await this.mediatrigger.triggered();
    }
  }

  @Bind
  private onLoadComplete(): void {
    if (this.loader) {
      this.loader.complete();
    }

    PubSub.unsubscribe([this.onLoadComplete, this.onLoadProgress]);
  }

  @Bind
  private onReady(): void {
    if (this.loader) {
      this.loader.hide();
    }

    SplashScreen.hide();

    PubSub.unsubscribe([this.onReady]);
  }

  @Bind
  private onLoadProgress(value: number = 0.01): void {
    if (this.loader) {
      this.loader.increment(value);
    }
  }
}

export const WebSplashScreen = new ConcreteWebSplashScreen();
