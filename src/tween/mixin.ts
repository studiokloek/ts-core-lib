import { gsap } from 'gsap';
import { get, isNumber, pull, remove, set } from 'lodash-es';
import type { DisplayObject } from 'pixi.js';
import { getLogger } from '../logger';

const Logger = getLogger('tween > mixin');

export class TweenMixin {
  private __tweens: GSAPTween[] = [];

  private __getTweenSettings(
    targetOrDuration: GSAPTweenTarget | number,
    durationOrProperties: number | GSAPTweenVars,
    propertiesOrSettings?: GSAPTweenVars,
    settings?: GSAPTweenVars,
  ): { target: any; vars: Record<string, unknown> } {
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
      properties = propertiesOrSettings as GSAPTweenVars;
    }

    let vars: GSAPTweenVars;

    if (settings) {
      if ((target as DisplayObject).worldTransform !== undefined) {
        // warn if props contain wrong values
        if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
          Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
        }

        // // fix rotation
        const rotation = get(properties, 'rotation');
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

    return { target, vars };
  }

  private __registerTween(tween: GSAPTween): void {
    // bewaar in lijst
    this.__tweens.push(tween);

    const existing = tween.eventCallback('onComplete');

    // luister of tween klaar is, haal uit lijst
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tween.eventCallback('onComplete', (...arguments_: any[]) => {
      // haal uit lijst
      this.__tweens = pull(this.__tweens, tween);

      if (existing) {
        existing.apply(tween, arguments_);
      }
    });
  }

  protected tweenFrom(
    targetOrDuration: GSAPTweenTarget | number,
    durationOrProperties: number | GSAPTweenVars,
    propertiesOrSettings?: GSAPTweenVars,
    settings?: GSAPTweenVars,
  ): GSAPTween {
    // haal tween props op
    const { target, vars } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings);

    // maak tween aan
    const tween = gsap.from(target, vars);

    // registreer tween
    this.__registerTween(tween);

    return tween;
  }

  protected tween(
    targetOrDuration: GSAPTweenTarget | number,
    durationOrProperties: number | GSAPTweenVars,
    propertiesOrSettings?: GSAPTweenVars,
    settings?: GSAPTweenVars,
  ): GSAPTween {
    // haal tween props op
    const { target, vars } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings);

    // maak tween aan
    const tween = gsap.to(target, vars);

    // registreer tween
    this.__registerTween(tween);

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

  protected killTweenOf(_target?: GSAPTweenTarget, _vars?: GSAPTweenVars): void {
    if (_target) {
      // haal uit lijst
      const tweensToKill = remove(this.__tweens, (item) => item.targets().includes(_target));

      // kill
      for (const tween of tweensToKill) {
        tween.kill(_vars);
      }
    }
  }
}
