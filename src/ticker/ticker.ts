import { gsap } from 'gsap';
import { Bind } from 'lodash-decorators-esm';
import { round } from 'lodash-es';
import { CoreDebug } from '../debug';
import { getLogger } from '../logger';

const Logger = getLogger('ticker');

export interface TickerCallback extends Function {
  __tickerid__?: number;
}

interface TickerItem {
  callback: TickerCallback;
  time: number;
  active: boolean;
}

const DELAY_FACTOR = round(1000 / 60, 5);
let TICKER_UUID = 0;

export class ConcreteTicker {
  private _name: string;
  private items: TickerItem[] = [];
  private hash: { [key: number]: TickerItem } = {};
  private startTime = 0;
  private numberOfItems = 0;
  private _time = 0;
  private previousTime = 0;
  private sleepStartTime = 0;
  private _timeScale = 1;
  private _globalTimeScale = 1;
  private beforeSleepTimeScale = 1;
  private isRunning = false;
  private autoSleep = false;

  constructor(name: string, autoSleep = false) {
    this._name = name;
    this.autoSleep = autoSleep;

    if (this.autoSleep) {
      this.storeTimeBeforeSleep();
    } else {
      this.wake();
    }
  }

  @Bind
  private update(): void {
    if (!this.isRunning) {
      return;
    }

    const timeScale = this._timeScale * this._globalTimeScale;

    const current = round((performance.now() - this.startTime) * 0.001, 3);
    const difference = current - this.previousTime;
    this.previousTime = current;

    this._time = this._time + difference * timeScale;

    const delay = round(((1000 * difference) / DELAY_FACTOR) * timeScale, 3);

    let needRemove = false;

    for (let index = 0; index < this.numberOfItems; index++) {
      const item = this.items[index];

      if (item.active) {
        // time, delay, running
        item.time = round(item.time + (this._time - item.time), 3);
        Reflect.apply(item.callback, undefined, [item.time, delay, this._time]);
      } else {
        needRemove = true;
      }
    }

    if (needRemove) {
      for (let index = this.items.length - 1; index >= 0; --index) {
        const item = this.items[index];

        if (!item.active) {
          this.items.splice(index, 1);
        }
      }

      this.numberOfItems = this.items.length;

      if (this.autoSleep && this.numberOfItems === 0) {
        this.sleep();
      }
    }
  }

  add(callback: TickerCallback): number {
    if (typeof callback !== 'function') {
      Logger.error('Ticker', 'Could not add callback. No valid callback provided.');
      return -1;
    }

    // wake if needed
    if (this.autoSleep) {
      this.wake();
    }

    // haal ticker id op, of zet een nieuwe
    const tickerCallbackId = callback.__tickerid__ || ++TICKER_UUID;
    callback.__tickerid__ = tickerCallbackId;

    // tijd update
    const time = round((performance.now() - this.startTime) * 0.001, 5);

    // kijk of item al bestaat
    let item = this.hash[tickerCallbackId];

    if (item) {
      if (CoreDebug.isEnabled()) {
        Logger.warn('Ticker', `The callback '${callback.name}()' was already added.`);
      }

      return time;
    }

    item = {
      callback,
      time: 0,
      active: true,
    };

    this.items.push(item);
    this.numberOfItems = this.items.length;
    this.hash[tickerCallbackId] = item;

    return time;
  }

  remove(callback: TickerCallback | TickerCallback[]): void {
    // meerdere callbacks?
    if (Array.isArray(callback)) {
      for (const item of callback) {
        this.remove(item);
      }

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

  removeAll(): void {
    for (const item of this.items) {
      this.remove(item.callback);
    }
  }

  wake(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.restoreTimeAfterSleep();

    gsap.ticker.add(this.update);
  }

  sleep(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    this.storeTimeBeforeSleep();

    gsap.ticker.remove(this.update);
  }

  restoreTimeAfterSleep(): void {
    this.startTime += performance.now() - this.sleepStartTime;
    this._timeScale = this.beforeSleepTimeScale;
    this.previousTime = round((performance.now() - this.startTime) * 0.001, 5);
  }

  storeTimeBeforeSleep(): void {
    this.sleepStartTime = performance.now();

    if (this._timeScale !== 0) {
      this.beforeSleepTimeScale = this._timeScale;
      this._timeScale = 0;
    }
  }

  get name(): string {
    return this._name;
  }

  get time(): number {
    return this._time;
  }

  get timeScale(): number {
    return this._timeScale;
  }

  set timeScale(_value: number) {
    // helemaal 0 kan niet...
    const value = _value || 0.000_000_000_1;

    if (!this.isRunning) {
      this.beforeSleepTimeScale = value;
    } else {
      this._timeScale = value;
    }
  }

  set globalTimeScale(_value: number) {
    this._globalTimeScale = _value;
  }
}
