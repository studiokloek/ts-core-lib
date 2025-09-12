import { gsap } from 'gsap';
import { isNumber, pull, remove } from 'lodash';
import { getTweenVars } from './tween-vars';
import type { KloekTween, KloekTweenTarget, KloekTweenVars, KloekReducedTweenVars } from './types';

// const Logger = getLogger('tween > mixin');

export class TweenMixin {
  private __tweens: KloekTween[] = [];

  private __getTweenSettings(
    targetOrDuration: KloekTweenTarget | number,
    durationOrProperties: number | KloekTweenVars,
    propertiesOrSettings?: KloekTweenVars,
    settings?: KloekTweenVars,
    reducedProperties?: KloekReducedTweenVars,
    reducedSettings?: KloekTweenVars
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
      properties = propertiesOrSettings as KloekTweenVars;
    }

    return { target, vars: getTweenVars(target, duration, properties, settings, reducedProperties, reducedSettings) };
  }

  private __registerTween(tween: KloekTween): void {
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
    targetOrDuration: KloekTweenTarget | number,
    durationOrProperties: number | KloekTweenVars,
    propertiesOrSettings?: KloekTweenVars,
    settings?: KloekTweenVars,
    reducedProperties?: KloekReducedTweenVars,
    reducedSettings?: KloekTweenVars
  ): KloekTween {
    // haal tween props op
    const { target, vars } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings, reducedProperties, reducedSettings);

    // maak tween aan
    const tween = gsap.from(target, vars);

    // registreer tween
    this.__registerTween(tween);

    return tween;
  }

  protected tween(
    targetOrDuration: KloekTweenTarget | number,
    durationOrProperties: number | KloekTweenVars,
    propertiesOrSettings?: KloekTweenVars,
    settings?: KloekTweenVars,
    reducedProperties?: KloekReducedTweenVars,
    reducedSettings?: KloekTweenVars
  ): KloekTween {
    // haal tween props op
    const { target, vars } = this.__getTweenSettings(targetOrDuration, durationOrProperties, propertiesOrSettings, settings, reducedProperties, reducedSettings);

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

  protected killTweenOf(_target?: KloekTweenTarget, _properties?: string): void {
    if (_target) {
      // haal uit lijst
      const tweensToKill = remove(this.__tweens, (item) => item.targets().includes(_target));

      // kill
      for (const tween of tweensToKill) {
        tween.kill(undefined, _properties);
      }
    }
  }
}
