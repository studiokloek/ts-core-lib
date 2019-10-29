var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { TweenMax } from 'gsap';
import { Bind } from 'lodash-decorators';
import { get, round } from 'lodash-es';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { getTicker } from '.';
const Logger = getLogger('core');
const DELAY_FACTOR = round(1000 / 60);
let TICKER_UUID = 0;
export class ConcreteTicker {
    constructor(name) {
        this.items = [];
        this.hash = {};
        this.startTime = 0;
        this.numberOfItems = 0;
        this._time = 0;
        this.previousTime = 0;
        this.sleepStartTime = 0;
        this._timeScale = 1;
        this._globalTimeScale = 1;
        this.beforeSleepTimeScale = 1;
        this.isRunning = false;
        this._name = name;
        this.wake();
    }
    update() {
        this._time = round((performance.now() - this.startTime) * 0.001, 5);
        const delay = round((1000 * (this._time - this.previousTime)) / DELAY_FACTOR, 5) * this._timeScale * this._globalTimeScale;
        this.previousTime = this._time;
        let needRemove = false;
        for (let i = 0; i < this.numberOfItems; i++) {
            const item = this.items[i];
            if (item.active) {
                // time, delay, running
                item.callback.apply(null, [round((this._time - item.startTime) * this._timeScale * this._globalTimeScale, 5), delay, this._time]);
            }
            else {
                needRemove = true;
            }
        }
        if (needRemove) {
            for (let i = this.items.length - 1; i >= 0; --i) {
                const item = this.items[i];
                if (!item.active) {
                    this.items.splice(i, 1);
                }
            }
            this.numberOfItems = this.items.length;
        }
    }
    add(callback) {
        if (typeof callback !== 'function') {
            Logger.error('Ticker', 'Could not add callback. No valid callback provided.');
            return -1;
        }
        const tickerCallback = callback;
        // haal ticker id op, of zet een nieuwe
        const tickerCallbackId = tickerCallback.__tickerid__ || ++TICKER_UUID;
        tickerCallback.__tickerid__ = tickerCallbackId;
        // tijd update
        const time = round((performance.now() - this.startTime) * 0.001, 5);
        // kijk of item al bestaat
        let item = this.hash[tickerCallbackId];
        if (item) {
            // update starttime
            item.startTime = time;
            if (CoreDebug.isEnabled()) {
                Logger.warn('Ticker', `The callback '${callback.name}()' was allready added, updated startTime.`);
            }
            return time;
        }
        item = {
            callback: tickerCallback,
            startTime: time,
            active: true,
        };
        this.items.push(item);
        this.numberOfItems = this.items.length;
        this.hash[tickerCallbackId] = item;
        return time;
    }
    remove(callback) {
        // meerdere callbacks?
        if (Array.isArray(callback)) {
            callback.forEach(item => {
                this.remove(item);
            });
            return;
        }
        const tickerCallbackId = callback.__tickerid__;
        if (!tickerCallbackId) {
            // Logger.error('Ticker', `Could not remove callback. '${callback.name}()' is not registered.`);
            return;
        }
        // is deze wel aangemeld?
        const item = this.hash[tickerCallbackId];
        if (!item) {
            // Logger.warn('Ticker', `Could not remove callback. '${callback.name}()' is currently not active.`);
            return;
        }
        delete callback.__tickerid__;
        item.active = false;
        delete this.hash[tickerCallbackId];
    }
    removeAll() {
        for (const item of this.items) {
            this.remove(item.callback);
        }
    }
    wake() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.restoreTimeAfterSleep();
        TweenMax.ticker.addEventListener('tick', this.update, null, false, 20);
    }
    sleep() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        this.storeTimeBeforeSleep();
        TweenMax.ticker.removeEventListener('tick', this.update);
    }
    restoreTimeAfterSleep() {
        this.startTime += performance.now() - this.sleepStartTime;
        this._timeScale = this.beforeSleepTimeScale;
        this.previousTime = round((performance.now() - this.startTime) * 0.001, 5);
    }
    storeTimeBeforeSleep() {
        this.sleepStartTime = performance.now();
        if (this._timeScale !== 0) {
            this.beforeSleepTimeScale = this._timeScale;
            this._timeScale = 0;
        }
    }
    get name() {
        return this._name;
    }
    get time() {
        return this._time;
    }
    get timeScale() {
        return this._timeScale;
    }
    set timeScale(_value) {
        // helemaal 0 kan niet...
        _value = _value || 0.0000000001;
        if (!this.isRunning) {
            this.beforeSleepTimeScale = _value;
        }
        else {
            this._timeScale = _value;
        }
    }
    set globalTimeScale(_value) {
        this._globalTimeScale = _value;
    }
}
__decorate([
    Bind
], ConcreteTicker.prototype, "update", null);
// MIXIN
let MIXIN_UUID = 0;
export class TickerMixin {
    addTicker(callback) {
        if (typeof callback !== 'function') {
            Logger.error('addTicker', 'Could not add callback. No valid callback provided.');
            return -1;
        }
        if (!this.__ticker) {
            const name = get(this, 'name') || get(this, 'id') || `mixin-ticker-${++MIXIN_UUID}`;
            this.__ticker = getTicker(name);
        }
        return this.__ticker.add(callback);
    }
    removeTicker(callback) {
        if (this.__ticker) {
            return this.__ticker.remove(callback);
        }
    }
    removeTickers() {
        if (this.__ticker) {
            this.__ticker.removeAll();
        }
    }
    pauseTickers() {
        if (this.__ticker) {
            this.__ticker.sleep();
        }
    }
    resumeTickers() {
        if (this.__ticker) {
            this.__ticker.wake();
        }
    }
    get tickerTime() {
        if (this.__ticker) {
            return this.__ticker.time;
        }
        else {
            return 0;
        }
    }
}
//# sourceMappingURL=ticker.js.map