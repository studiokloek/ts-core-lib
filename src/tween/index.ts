export * from './ease';
export * from './tween';
export * from './mixin';

// fix promises then() from GSAP Animation
import { gsap } from 'gsap';

gsap.core.Animation.prototype.then = function(onFulfilled?: (result: GSAPAnimation) => any): Promise<GSAPAnimation> {
  const then = this.then;

  return new Promise(resolve => {
    const existing = this.eventCallback('onComplete');

    this.eventCallback('onComplete', (...arguments_: any[]) => {
      if (existing) {
        existing.apply(this as GSAPAnimation, arguments_);
      }

      // temporarily null the then() method to avoid an infinite loop (see https://github.com/greensock/GSAP/issues/322)
      // @ts-ignore
      this.then = null;

      if (typeof onFulfilled === 'function') {
        onFulfilled(this as GSAPAnimation);
      }

      resolve();
      this.then = then;
    });
  });
};
