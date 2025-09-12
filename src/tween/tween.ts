import { gsap } from "gsap";
import { getTweenVars, setReducedMotion } from "./tween-vars";
import type { KloekReducedTweenVars, KloekTween, KloekTweenTarget, KloekTweenVars } from "./types";

export const Tween = {
  to: (
    target: KloekTweenTarget,
    duration = 0,
    properties: KloekTweenVars,
    settings?: KloekTweenVars,
    reducedProperties?: KloekReducedTweenVars,
    reducedSettings?: KloekTweenVars,
  ): KloekTween => {
    // maak tween aan
    const variables = getTweenVars(target, duration, properties, settings, reducedProperties, reducedSettings);
    return gsap.to(target, variables) as KloekTween;
  },

  from: (
    target: KloekTweenTarget,
    duration = 0,
    properties: KloekTweenVars,
    settings?: KloekTweenVars,
    reducedProperties?: KloekReducedTweenVars,
    reducedSettings?: KloekTweenVars,
  ): KloekTween => {
    // maak tween aan
    const variables = getTweenVars(target, duration, properties, settings, reducedProperties, reducedSettings);
    return gsap.from(target, variables) as KloekTween;
  },

  set: (target: KloekTweenTarget, properties: KloekTweenVars): KloekTween => {
    return gsap.set(target, properties) as KloekTween;
  },

  killTweensOf: (
    _target: KloekTweenTarget,
    _properties?: object | string,
  ): void => {
    gsap.killTweensOf(_target, _properties);
  },

  setReduceMotion: (value: boolean) => {
    setReducedMotion(value);
  },
};
