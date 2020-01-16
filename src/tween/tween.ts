import { gsap } from 'gsap';
import { get, set } from 'lodash-es';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from '../logger';
 
const Logger = getLogger('tween');

export const Tween = {
  to: async (target: {}, duration: number = 0, properties: gsap.TweenVars, settings?: gsap.TweenVars): Promise<TweenMax> => {
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

    // maak tween aan
    return gsap.to(target, vars);
  },
  from: async (target: {}, duration: number = 0, properties: gsap.TweenVars, settings?: gsap.TweenVars): Promise<TweenMax> => {
    let vars: gsap.TweenVars;

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

    vars.duration = duration;

    // maak tween aan
    return gsap.from(target, vars);
  },

  set: (target: {}, properties: gsap.TweenVars): TweenMax => {
    return gsap.set(target, properties);
  },

  killTweensOf(_target: {}, _vars?: {}): void {
    gsap.killTweensOf(_target, _vars);
  },
};
