import * as gsap from 'gsap';
import { get, set } from 'lodash-es';
import { DisplayObject } from 'pixi.js-legacy';
import { getLogger } from '../logger';

const Logger = getLogger('tween');

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
