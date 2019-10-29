import { isNumber, get, set, pull } from 'lodash-es';
import * as gsap from 'gsap';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from './logger';

const Logger = getLogger('core > tween');

export const Back = gsap.Back;
export const Bounce = gsap.Bounce;
export const Circ = gsap.Circ;
export const Elastic = gsap.Elastic;
export const Expo = gsap.Expo;
export const Linear = gsap.Linear;
export const Sine = gsap.Sine;
export const SlowMo = gsap.SlowMo;
export const Power0 = gsap.Power0;
export const Power1 = gsap.Power1;
export const Power2 = gsap.Power2;
export const Power3 = gsap.Power3;
export const Power4 = gsap.Power4;

export const Tween = {
  to: async (target: {}, duration: number = 0, properties: gsap.TweenConfig, settings?: gsap.TweenConfig): Promise<gsap.TweenMax> => {
    let vars: gsap.TweenConfig;

    if (settings) {
      if ((target as DisplayObject).worldTransform !== undefined) {
        // warn if props contain wrong values
        if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
          Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
        }

        // fix rotation
        const rotation = get(properties, 'rotation', undefined);
        if (typeof rotation === 'number') {
          set(properties, 'rotation', rotation * (180 / Math.PI));
        }

        vars = { ...{ pixi: properties }, ...settings };
      } else {
        vars = { ...properties, ...settings };
      }
    } else {
      vars = { ...properties };
    }

    // maak tween aan
    return gsap.TweenMax.to(target, duration, vars);
  },
  from: async (target: {}, duration: number = 0, properties: gsap.TweenConfig, settings?: gsap.TweenConfig): Promise<gsap.TweenMax> => {
    let vars: gsap.TweenConfig;

    if (settings) {
      // if (target instanceof DisplayObject) {

      if ((target as DisplayObject).worldTransform !== undefined) {
        // warn if props contain wrong values
        if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
          Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
        }

        // fix rotation
        const rotation = get(properties, 'rotation', undefined);
        if (typeof rotation === 'number') {
          set(properties, 'rotation', rotation * (180 / Math.PI));
        }

        vars = { ...{ pixi: properties }, ...settings };
      } else {
        vars = { ...properties, ...settings };
      }
    } else {
      vars = { ...properties };
    }

    // maak tween aan
    return gsap.TweenMax.from(target, duration, vars);
  },

  set: (target: {}, properties: gsap.TweenConfig): gsap.TweenMax => {
    return gsap.TweenMax.set(target, properties);
  },

  killTweensOf(_target: {}): void {
    gsap.TweenMax.killTweensOf(_target);
  },
};

export class TweenMixin {
  private __tweens: gsap.TweenMax[] = [];

  private __getTweenSettings(
    targetOrDuration: {} | number,
    durationOrProperties: number | gsap.TweenConfig,
    propertiesOrSettings?: gsap.TweenConfig,
    settings?: gsap.TweenConfig,
  ): { target: any; duration: number; vars: object; completeHandler: Function | undefined } {
    let target,
      duration = 0,
      properties = {};

    if (isNumber(targetOrDuration)) {
      target = this;
      duration = targetOrDuration;
      properties = durationOrProperties;
      settings = propertiesOrSettings;
    } else {
      target = targetOrDuration;
      duration = durationOrProperties as number;
      properties = propertiesOrSettings as gsap.TweenConfig;
    }

    let vars: gsap.TweenConfig;

    if (settings) {
      if ((target as DisplayObject).worldTransform !== undefined) {
        // warn if props contain wrong values
        if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
          Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
        }

        // fix rotation
        const rotation = get(properties, 'rotation', undefined);
        if (typeof rotation === 'number') {
          set(properties, 'rotation', rotation * (180 / Math.PI));
        }

        vars = { ...{ pixi: properties }, ...settings };
      } else {
        vars = { ...properties, ...settings };
      }
    } else {
      vars = { ...properties };
    }

    // remember old on complete event
    const existingOnComplete = vars.onComplete;
    vars.onComplete = undefined;

    return { target, duration, vars, completeHandler: existingOnComplete };
  }

  private __registerTween(tween: gsap.TweenMax, completeHandler: Function | undefined): void {
    // bewaar in lijst
    this.__tweens.push(tween);

    // luister of tween klaar is, haal uit lijst
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tween.eventCallback('onComplete', (...arguments_: any[]) => {
      // haal uit lijst
      this.__tweens = pull(this.__tweens, tween);
      if (completeHandler) {
        completeHandler.apply(tween, arguments_);
      }
    });
  }

  protected tweenFrom(
    targetOrDuration: {} | number,
    durationOrProperties: number | gsap.TweenConfig,
    propertiesOrSettings?: gsap.TweenConfig,
    settings?: gsap.TweenConfig,
  ): gsap.TweenMax {
    // haal tween props op
    const { target, duration, vars, completeHandler } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings);

    // maak tween aan
    const tween = gsap.TweenMax.from(target, duration, vars);

    // registreer tween
    this.__registerTween(tween, completeHandler);

    return tween;
  }

  protected tween(
    targetOrDuration: {} | number,
    durationOrProperties: number | gsap.TweenConfig,
    propertiesOrSettings?: gsap.TweenConfig,
    settings?: gsap.TweenConfig,
  ): gsap.TweenMax {
    // haal tween props op
    const { target, duration, vars, completeHandler } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings);

    // maak tween aan
    const tween = gsap.TweenMax.to(target, duration, vars);

    // registreer tween
    this.__registerTween(tween, completeHandler);

    return tween;
  }

  protected killTweens(): void {
    for (const tween of this.__tweens) {
      tween.kill();
    }
    this.__tweens.length = 0;
  }

  protected pauseTweens(): void {
    for (const tween of this.__tweens) {
      tween.pause();
    }
  }

  protected resumeTweens(): void {
    for (const tween of this.__tweens) {
      tween.resume();
    }
  }

  protected killTweenOf(target?: {}): void {
    if (target) {
      // haal uit lijst
      const tweensToKill = this.__tweens.filter(item => item.target === target);

      // kill
      for (const tween of tweensToKill) {
        tween.kill();
      }

      // update lijst
      this.__tweens = this.__tweens.filter(item => item.target !== target);
    }
  }
}
