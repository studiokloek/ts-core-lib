import { Plugins } from '@capacitor/core';
import { Bind } from 'lodash-decorators';
import { isFunction, round } from 'lodash-es';
import { SyncEvent } from 'ts-events';
import { CoreDebug } from '../debug';
import { Delayed } from '../delay';
import { deviceNeedsMediaTrigger, isApp } from '../device';
import { AppEvent, PubSub } from '../events';
import { getElement } from '../html';
import { Logger } from '../logger';
import { Screen, Stage } from '../screen';
import { Tween, Easing } from '../tween';
import { constrainNumber, mapNumber, randomBetween } from '../util/math';

const { SplashScreen } = Plugins;

type ManualSplashLayout = boolean | ((ui: { element: HTMLElement | null; logo: HTMLElement | null }) => void);
interface WebSplashScreenOptions {
  manualLayout?: ManualSplashLayout;
  triggered?: () => void;
}

class MediaTriggerScreen {
  private parent!: HTMLElement;
  private element!: HTMLElement | null;
  private logo!: HTMLElement | null;
  public trigger: SyncEvent<void> = new SyncEvent();
  private loadedResolver!: (value?: any) => void;
  private isReady = false;
  private manualLayout: boolean | ManualSplashLayout | undefined;

  public constructor(_target: HTMLElement | null, _layout?: ManualSplashLayout) {
    if (!_target) {
      Logger.error('splash', 'No target provided...');
      return;
    }

    this.manualLayout = _layout;
    this.parent = _target;
    this.element = this.parent.querySelector('.media-trigger');
    this.logo = this.parent.querySelector('.logo');

    if (!this.element) {
      Logger.error('splash', 'Could not find media trigger element...');
      return;
    }

    // luister naar touch
    this.element.addEventListener('click', this.onClicked);

    // Screen size change?
    PubSub.subscribe(AppEvent.RESIZED, this.layout);

    // tonen
    Tween.to(this.element, 1, { autoAlpha: 1 }, { delay: 0.5 });
  }

  public async checkTriggered(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        return resolve();
      } else {
        this.loadedResolver = resolve;
        this.checkReady();
      }
    });
  }

  @Bind
  private onClicked(): void {
    if (!this.element) {
      return;
    }

    this.isReady = true;

    Tween.to(this.element, 0.5, { autoAlpha: 0 }, { delay: 0 });

    this.checkReady();
  }

  private checkReady(): void {
    if (!this.element || (!CoreDebug.skipMediaTrigger() && !this.isReady)) {
      return;
    }

    Tween.to(this.element, 0.5, { autoAlpha: 0 }, { delay: 0 });

    PubSub.unsubscribe(this.layout);
    this.element.removeEventListener('click', this.onClicked);

    this.trigger.post();

    // Laat weten dat het scherm is aangeraakt, handig voor bv fullscreen
    PubSub.publishSync(AppEvent.MEDIATRIGGER_READY);

    if (this.loadedResolver) {
      this.loadedResolver();
    }
  }

  @Bind
  private layout(): void {
    if (!this.element) {
      return;
    }

    if (this.manualLayout) {
      if (isFunction(this.manualLayout)) {
        this.manualLayout({ element: this.element, logo: this.logo });
      } else {
        return;
      }
    }

    const scaleWidth = Screen.height / Screen.width,
      scale = Math.min(1, Math.min(Stage.scale.x, Stage.scale.y) * 1.5);

    Tween.set(this.element, {
      transformOrigin: '0 0',
      x: 0,
      y: Stage.position.y,
      width: Stage.width,
      height: Stage.height,
      backgroundSize: `${mapNumber(scaleWidth, 0.5, 1, 100 * scale, 150 * scale, true)}px`,
      backgroundPosition: `center ${mapNumber(Stage.scale.x, 0.75, 1, 90, 80, true)}%`,
    });

    if (this.logo) {
      Tween.set(this.logo, {
        width: `${mapNumber(scaleWidth, 0.5, 1.33, 100 * scale, 150 * scale, true)}%`,
        height: `${mapNumber(scaleWidth, 0.5, 1.33, 100 * scale, 150 * scale, true)}%`,
      });
    }
  }
}

class WebLoaderScreen {
  private element: HTMLElement | null;
  private position = 0;
  private targetPosition = 0;
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
        ease: Easing.Sine.easeInOut,
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
      Tween.to(this.bar, 0.4, { autoAlpha: 0 }, { delay: 0 });
    }
  }

  public complete(): void {
    this.setPostition(1);
    Delayed.kill(this.trickle);
  }

  public showLoader(): void {
    if (!this.bar) {
      return;
    }

    Tween.to(this.bar, 0.5, { autoAlpha: 1 }, { delay: 0 });
  }

  public hide(): void {
    if (!this.element) {
      return;
    }

    Tween.to(this.element, 0.5, { autoAlpha: 0 }, { delay: 0 });
  }

  public increment(_value = 0.01): void {
    this.setPostition(this.targetPosition + _value);
  }

  public get target(): HTMLElement | null {
    return this.element;
  }
}

class ConcreteWebSplashScreen {
  private options: WebSplashScreenOptions | undefined;
  private loader: WebLoaderScreen | undefined;
  private mediatrigger: MediaTriggerScreen | undefined;

  public init(_target: HTMLElement | string, _options?: WebSplashScreenOptions): void {
    this.options = _options;
    this.initWebLoaderScreen(_target);
    this.initMediaTriggerScreen();

    PubSub.subscribe(AppEvent.LOAD_COMPLETE, this.onLoadComplete);
    PubSub.subscribe(AppEvent.LOAD_PROGRESS, this.onLoadProgress);
    PubSub.subscribeOnce(AppEvent.READY, this.onReady);
  }

  private initWebLoaderScreen(_target: HTMLElement | string): void {
    this.loader = new WebLoaderScreen(_target);
  }

  private initMediaTriggerScreen(): void {
    if (this.loader && deviceNeedsMediaTrigger()) {
      this.mediatrigger = new MediaTriggerScreen(this.loader.target, this.options?.manualLayout);
      this.mediatrigger.trigger.attach(this.onMediaTriggered);
    } else {
      if (this.loader) {
        this.loader.showLoader();
      }
    }
  }

  @Bind
  private onMediaTriggered(): void {
    if (this.options?.triggered) {
      this.options.triggered();
    }

    if (this.loader) {
      this.loader.showLoader();
    }
  }

  public async checkMediaReady(): Promise<void> {
    if (this.mediatrigger) {
      await this.mediatrigger.checkTriggered();
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
  private onLoadProgress(value = 0.01): void {
    if (this.loader) {
      this.loader.increment(value);
    }
  }
}

export const WebSplashScreen = new ConcreteWebSplashScreen();
