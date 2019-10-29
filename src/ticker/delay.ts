import { Tween, TweenMax } from 'gsap';
import { find, remove } from 'lodash-es';
import { getLogger } from '@studiokloek/ts-core-lib';

const Logger = getLogger('core > delayed');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): TweenMax | undefined {
  if (!_callback || typeof _callback !== 'function') {
    Logger.warn('addDelay()', 'No callback provided...');
    return;
  }

  return TweenMax.delayedCall(_delay, _callback, _params);
}

function killDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('killDelay()', 'No callback provided...');
    return;
  }

  TweenMax.killDelayedCallsTo(_callback);
}

function pauseDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('pauseDelay()', 'No callback provided...');
    return;
  }

  const calls = TweenMax.getTweensOf(_callback);

  for (let i = 0, ln = calls.length; i < ln; i++) {
    calls[i].pause();
  }
}

function resumeDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('resumeDelay()', 'No callback provided...');
    return;
  }

  const calls = TweenMax.getTweensOf(_callback);

  for (let i = 0, ln = calls.length; i < ln; i++) {
    calls[i].resume();
  }
}

function killAllDelays(): void {
  TweenMax.killAll(false, false, true, false);
}

function callAsync(_callback: (...args: any[]) => void): void {
  TweenMax.delayedCall(0, _callback);
}

async function waitFor(_delay: number = 0): Promise<void> {
  return new Promise(resolve => TweenMax.delayedCall(_delay, resolve));
}

export const Delayed = {
  call: addDelay,
  kill: killDelay,
  killAll: killAllDelays,
  pause: pauseDelay,
  resume: resumeDelay,
  async: callAsync,
  wait: waitFor,
};

// MIXIN

export class DelayedMixin {
  private __delayed: Tween[] = [];

  protected addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): void {
    if (!_callback) {
      Logger.warn('DelayedMixin.addDelay()', 'No callback provided...');
      return;
    }

    // create new delay
    const item = addDelay(_callback, _delay);

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
    const calls = TweenMax.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? kill
      const item = find(this.__delayed, calls[i]) as Tween;

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
    const calls = TweenMax.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? pause
      const item = find(this.__delayed, calls[i]) as Tween;

      if (item) {
        item.pause();
      }
    }
  }

  protected remumeDelay(_callback: (...args: any[]) => void): void {
    // welke items zijn dat
    const calls = TweenMax.getTweensOf(_callback);

    for (let i = 0, ln = calls.length; i < ln; i++) {
      // bestaat hij in de lijst? resume
      const item = find(this.__delayed, calls[i]) as Tween;

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
