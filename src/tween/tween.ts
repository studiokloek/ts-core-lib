import { gsap } from "gsap";
import { getTweenVars, setReducedMotion } from "./tween-vars";
import type { ReducedTweenVars } from "./types";

export const Tween = {
  to: (
    target: GSAPTweenTarget,
    duration = 0,
    properties: GSAPTweenVars,
    settings?: GSAPTweenVars,
    reducedProperties?: ReducedTweenVars,
    reducedSettings?: GSAPTweenVars,
  ): GSAPTween => {
    // maak tween aan
    const variables = getTweenVars(target, duration, properties, settings, reducedProperties, reducedSettings);
    return gsap.to(target, variables) as GSAPTween;
  },

  from: (
    target: GSAPTweenTarget,
    duration = 0,
    properties: GSAPTweenVars,
    settings?: GSAPTweenVars,
    reducedProperties?: ReducedTweenVars,
    reducedSettings?: GSAPTweenVars,
  ): GSAPTween => {
    // maak tween aan
    const variables = getTweenVars(target, duration, properties, settings, reducedProperties, reducedSettings);
    return gsap.from(target, variables) as GSAPTween;
  },

  set: (target: GSAPTweenTarget, properties: GSAPTweenVars): GSAPTween => {
    return gsap.set(target, properties) as GSAPTween;
  },

  killTweensOf: (
    _target: GSAPTweenTarget,
    _properties?: object | string,
  ): void => {
    gsap.killTweensOf(_target, _properties);
  },

  setReduceMotion: (value: boolean) => {
    setReducedMotion(value);
  },
};
