import { gsap } from 'gsap';
import { getLogger } from '../logger';

const Logger = getLogger('delay');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDelay(_callback: (...args: any[]) => void, _delay: number, _params?: any[]): gsap.core.Tween | undefined {
  if (!_callback || typeof _callback !== 'function') {
    Logger.warn('addDelay()', 'No callback provided...');
    return;
  }

  return gsap.delayedCall(_delay, _callback, _params);
}

function killDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('killDelay()', 'No callback provided...');
    return;
  }

  gsap.killTweensOf(_callback);
}

function pauseDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('pauseDelay()', 'No callback provided...');
    return;
  }

  const calls = gsap.getTweensOf(_callback);

  for (let i = 0, ln = calls.length; i < ln; i++) {
    calls[i].pause();
  }
}

function resumeDelay(_callback: (...args: any[]) => void): void {
  if (!_callback) {
    Logger.warn('resumeDelay()', 'No callback provided...');
    return;
  }

  const calls = gsap.getTweensOf(_callback);

  for (let i = 0, ln = calls.length; i < ln; i++) {
    calls[i].resume();
  }
}

function callAsync(_callback: (...args: any[]) => void): void {
  gsap.delayedCall(0, _callback);
}

async function waitFor(_delay: number = 0): Promise<void> {
  return new Promise(resolve => gsap.delayedCall(_delay, resolve));
}

export const Delayed = {
  call: addDelay,
  kill: killDelay,
  pause: pauseDelay,
  resume: resumeDelay,
  async: callAsync,
  wait: waitFor,
};
