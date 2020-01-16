import { gsap} from 'gsap';
import { find, remove } from 'lodash-es';
import { getLogger } from '../logger';
import { Delayed } from './delay';

const Logger = getLogger('delay > mixin');

export class DelayedMixin {
  private __delayed: gsap.core.Tween[] = [];

  protected addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): void {
    if (!_callback) {
      Logger.warn('DelayedMixin.addDelay()', 'No callback provided...');
      return;
    }

    // create new delay
    const item = Delayed.call(_callback, _delay);

    if (item) {
      item.eventCallback('onComplete', () => {
        // remove
        remove(this.__delayed, item);

        // call callback
        const parameters = _params ? _params : [];
        _callback(...parameters);
      });

      this.__delayed.push(item);
    }
  }

  protected killDelay(_callback: (...args: any[]) => void): void {
    // welke items zijn dat
    const calls = gsap.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? kill
      const item = find(this.__delayed, calls[i]) as gsap.core.Tween;

      if (item) {
        // remove
        remove(this.__delayed, item);

        // kill
        item.kill();
      }
    }
  }

  protected pauseDelay(_callback: (...args: any[]) => void): void {
    // welke items zijn dat
    const calls = gsap.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? pause
      const item = find(this.__delayed, calls[i]) as gsap.core.Tween;

      if (item) {
        item.pause();
      }
    }
  }

  protected remumeDelay(_callback: (...args: any[]) => void): void {
    // welke items zijn dat
    const calls = gsap.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? resume
      const item = find(this.__delayed, calls[i]) as gsap.core.Tween;

      if (item) {
        item.resume();
      }
    }
  }

  protected killDelays(): void {
    for (const item of this.__delayed) {
      item.kill();
    }

    this.__delayed.length = 0;
  }

  protected pauseDelays(): void {
    for (const item of this.__delayed) {
      item.pause();
    }
  }

  protected resumeDelays(): void {
    for (const item of this.__delayed) {
      item.resume();
    }
  }
}
