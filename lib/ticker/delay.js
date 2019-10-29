import { TweenMax } from 'gsap';
import { find, remove } from 'lodash-es';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
const Logger = getLogger('core > delayed');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addDelay(_callback, _delay, _params) {
    if (!_callback || typeof _callback !== 'function') {
        Logger.warn('addDelay()', 'No callback provided...');
        return;
    }
    return TweenMax.delayedCall(_delay, _callback, _params);
}
function killDelay(_callback) {
    if (!_callback) {
        Logger.warn('killDelay()', 'No callback provided...');
        return;
    }
    TweenMax.killDelayedCallsTo(_callback);
}
function pauseDelay(_callback) {
    if (!_callback) {
        Logger.warn('pauseDelay()', 'No callback provided...');
        return;
    }
    const calls = TweenMax.getTweensOf(_callback);
    for (let i = 0, ln = calls.length; i < ln; i++) {
        calls[i].pause();
    }
}
function resumeDelay(_callback) {
    if (!_callback) {
        Logger.warn('resumeDelay()', 'No callback provided...');
        return;
    }
    const calls = TweenMax.getTweensOf(_callback);
    for (let i = 0, ln = calls.length; i < ln; i++) {
        calls[i].resume();
    }
}
function killAllDelays() {
    TweenMax.killAll(false, false, true, false);
}
function callAsync(_callback) {
    TweenMax.delayedCall(0, _callback);
}
async function waitFor(_delay = 0) {
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
    constructor() {
        this.__delayed = [];
    }
    addDelay(_callback, _delay, _params) {
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
    killDelay(_callback) {
        // welke items zijn dat
        const calls = TweenMax.getTweensOf(_callback);
        for (let i = 0, ln = calls.length; i < ln; i++) {
            // bestaat hij in de lijst? kill
            const item = find(this.__delayed, calls[i]);
            if (item) {
                // remove
                remove(this.__delayed, item);
                // kill
                item.kill();
            }
        }
    }
    pauseDelay(_callback) {
        // welke items zijn dat
        const calls = TweenMax.getTweensOf(_callback);
        for (let i = 0, ln = calls.length; i < ln; i++) {
            // bestaat hij in de lijst? pause
            const item = find(this.__delayed, calls[i]);
            if (item) {
                item.pause();
            }
        }
    }
    remumeDelay(_callback) {
        // welke items zijn dat
        const calls = TweenMax.getTweensOf(_callback);
        for (let i = 0, ln = calls.length; i < ln; i++) {
            // bestaat hij in de lijst? resume
            const item = find(this.__delayed, calls[i]);
            if (item) {
                item.resume();
            }
        }
    }
    killDelays() {
        for (const item of this.__delayed) {
            item.kill();
        }
        this.__delayed.length = 0;
    }
    pauseDelays() {
        for (const item of this.__delayed) {
            item.pause();
        }
    }
    resumeDelays() {
        for (const item of this.__delayed) {
            item.resume();
        }
    }
}
//# sourceMappingURL=delay.js.map