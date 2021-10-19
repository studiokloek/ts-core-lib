import { gsap } from 'gsap';
import { get, set } from 'lodash-es';
import { DisplayObject } from 'pixi.js';
import { getLogger } from '../logger';

const Logger = getLogger('tween');

function getTweenVariables(target: {}, duration = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTweenVars {
  let variables: GSAPTweenVars;

  if (settings) {
    // is the target a PixiJS object?
    if ((target as DisplayObject).worldTransform !== undefined) {
      // warn if props contain wrong values
      if (get(properties, 'delay') || get(properties, 'ease') || get(properties, 'onComplete')) {
        Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
      }

      // fix rotation
      const rotation = get(properties, 'rotation');
      if (typeof rotation === 'number') {
        set(properties, 'rotation', rotation * (180 / Math.PI));
      }

      variables = { pixi: properties as GSAPTweenVars['pixi'], ...settings };
    } else {
      variables = { ...properties, ...settings };
    }
  } else {
    variables = { ...properties };
  }

  variables.duration = duration;

  return variables;
}

export const Tween = {
  to: (target: {}, duration = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTween => {
    // maak tween aan
    const variables = getTweenVariables(target, duration, properties, settings);
    return gsap.to(target, variables) as GSAPTween;
  },
  from: (target: {}, duration = 0, properties: GSAPTweenVars, settings?: GSAPTweenVars): GSAPTween => {
    // maak tween aan
    const variables = getTweenVariables(target, duration, properties, settings);
    return gsap.from(target, variables) as GSAPTween;
  },

  set: (target: {}, properties: GSAPTweenVars): GSAPTween => {
    return gsap.set(target, properties) as GSAPTween;
  },

  killTweensOf: (_target: {}, _variables?: {}): void => {
    gsap.killTweensOf(_target, _variables);
  },
};
