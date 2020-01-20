import { gsap, Tween as GSAPTween } from 'gsap';
import { get, isNumber, pull, set } from 'lodash-es';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from '../logger';

const Logger = getLogger('tween > mixin');

export class TweenMixin {
  private __tweens: GSAPTween[] = [];

  private __getTweenSettings(
    targetOrDuration: gsap.TweenTarget | number,
    durationOrProperties: number | gsap.TweenVars,
    propertiesOrSettings?: gsap.TweenVars,
    settings?: gsap.TweenVars,
  ): { target: any; vars: object; completeHandler: Function | undefined; completeHandlerParams: any[] | undefined } {
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
      properties = propertiesOrSettings as gsap.TweenVars;
    }

    let vars: gsap.TweenVars;

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

    vars.duration = duration;

    // remember old on complete event
    const existingOnComplete = vars.onComplete,
      existingOnCompleteParams = vars.onCompleteParams;
    vars.onComplete = undefined;
    vars.onCompleteParams = undefined;

    return { target, vars, completeHandler: existingOnComplete, completeHandlerParams: existingOnCompleteParams };
  }

  private __registerTween(tween: GSAPTween, completeHandler: Function | undefined, onCompleteParams?: any[]): void {
    // bewaar in lijst
    this.__tweens.push(tween);

    // luister of tween klaar is, haal uit lijst
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tween.eventCallback('onComplete', (...arguments_: any[]) => {
      // haal uit lijst
      this.__tweens = pull(this.__tweens, tween);
      if (completeHandler) {
        completeHandler.apply(tween, onCompleteParams || arguments_);
      }
    });
  }

  protected tweenFrom(
    targetOrDuration: gsap.TweenTarget | number,
    durationOrProperties: number | gsap.TweenVars,
    propertiesOrSettings?: gsap.TweenVars,
    settings?: gsap.TweenVars,
  ): GSAPTween {
    // haal tween props op
    const { target, vars, completeHandler, completeHandlerParams } = this.__getTweenSettings(
      targetOrDuration,
      durationOrProperties,
      propertiesOrSettings,
      settings,
    );

    // maak tween aan
    const tween = gsap.from(target, vars);

    // registreer tween
    this.__registerTween(tween, completeHandler, completeHandlerParams);

    return tween;
  }

  protected tween(
    targetOrDuration: gsap.TweenTarget | number,
    durationOrProperties: number | gsap.TweenVars,
    propertiesOrSettings?: gsap.TweenVars,
    settings?: gsap.TweenVars,
  ): GSAPTween {
    // haal tween props op
    const { target, vars, completeHandler, completeHandlerParams } = this.__getTweenSettings(
      targetOrDuration,
      durationOrProperties,
      propertiesOrSettings,
      settings,
    );

    // maak tween aan
    const tween = gsap.to(target, vars);

    // registreer tween
    this.__registerTween(tween, completeHandler, completeHandlerParams);

    return tween;
  }

  protected killTweens(_target?: object, _propertiesList?: string): void {
    for (const tween of this.__tweens) {
      tween.kill(_target, _propertiesList);
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

  protected killTweenOf(target?: gsap.TweenTarget, _vars?: gsap.TweenVars): void {
    if (target) {
      // haal uit lijst
      const tweensToKill = this.__tweens.filter(item => item.targets().includes(target));

      // kill
      for (const tween of tweensToKill) {
        tween.kill(_vars);
      }

      // update lijst
      this.__tweens = this.__tweens.filter(item => !item.targets().includes(target));
    }
  }
}
