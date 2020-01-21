import { gsap, Tween as GSAPTween } from 'gsap';
import { get } from 'lodash-es';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from '../logger';

const Logger = getLogger('tween');

function getTweenVars(target: {}, duration: number = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTweenVars {
  let vars: GSAPTweenVars;

  if (settings) {
    // is the target a PixiJS object?
    if ((target as DisplayObject).worldTransform !== undefined) {
      // warn if props contain wrong values
      if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
        Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
      }

      // fix rotation
      // const rotation = get(properties, 'rotation', undefined);
      // if (typeof rotation === 'number') {
      //   set(properties, 'rotation', rotation * (180 / Math.PI));
      // }

      vars = { ...{ pixi: properties }, ...settings };
    } else {
      vars = { ...properties, ...settings };
    }
  } else {
    vars = { ...properties };
  }

  vars.duration = duration;

  return vars;
}

export const Tween = {
  to: (target: {}, duration: number = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTween => {
    // maak tween aan
    const vars = getTweenVars(target, duration, properties, settings);
    return gsap.to(target, vars) as GSAPTween;
  },
  from: (target: {}, duration: number = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTween => {
    // maak tween aan
    const vars = getTweenVars(target, duration, properties, settings);
    return gsap.from(target, vars) as GSAPTween;
  },

  set: (target: {}, properties: GSAPTweenVars): GSAPTween => {
    return gsap.set(target, properties) as GSAPTween;
  },

  killTweensOf: (_target: {}, _vars?: {}): void => {
    gsap.killTweensOf(_target, _vars);
  },
};
