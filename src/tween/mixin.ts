import * as gsap from 'gsap';
import { get, isNumber, pull, set } from 'lodash-es';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from '../logger';

const Logger = getLogger('tween > mixin');

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

  protected killTweens(_vars?: {}, _target?: {}): void {
    for (const tween of this.__tweens) {
      tween.kill(_vars, _target);
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

  protected killTweenOf(target?: {}, _vars?: {}): void {
    if (target) {
      // haal uit lijst
      const tweensToKill = this.__tweens.filter(item => item.target === target);

      // kill
      for (const tween of tweensToKill) {
        tween.kill(_vars);
      }

      // update lijst
      this.__tweens = this.__tweens.filter(item => item.target !== target);
    }
  }
}
