import { gsap } from 'gsap';
import { Bind } from 'lodash-decorators';
import { round } from 'lodash-es';
import { CoreDebug } from '../debug';
import { getLogger } from '../logger';

const Logger = getLogger('ticker');

export interface TickerCallback extends Function {
  __tickerid__?: number;
}

interface TickerItem {
  callback: TickerCallback;
  startTime: number;
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

  public constructor(name: string, autoStart = true) {
    this._name = name;

    if (autoStart) {
      this.wake();
    } else {
      this.storeTimeBeforeSleep();
    }
  }

  @Bind
  private update(): void {
    this._time = round((performance.now() - this.startTime) * 0.001, 5);

    const delay = round((1000 * (this._time - this.previousTime)) / DELAY_FACTOR, 5) * this._timeScale * this._globalTimeScale;
    this.previousTime = this._time;

    let needRemove = false;

    for (let i = 0; i < this.numberOfItems; i++) {
      const item = this.items[i];

      if (item.active) {
        // time, delay, running
        Reflect.apply(item.callback, undefined, [round((this._time - item.startTime) * this._timeScale * this._globalTimeScale, 5), delay, this._time]);
      } else {
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

      if (this.numberOfItems === 0) {
        this.sleep();
      }
    }
  }

  public add(callback: (_time?: number, _delay?: number) => void): number {
    if (typeof callback !== 'function') {
      Logger.error('Ticker', 'Could not add callback. No valid callback provided.');
      return -1;
    }

    const tickerCallback = callback as TickerCallback;

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

    this.wake();

    return time;
  }

  public remove(callback: TickerCallback | TickerCallback[]): void {
    // meerdere callbacks?
    if (Array.isArray(callback)) {
      callback.forEach((item) => {
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

  public removeAll(): void {
    for (const item of this.items) {
      this.remove(item.callback);
    }
  }

  public wake(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    this.restoreTimeAfterSleep();

    gsap.ticker.add(this.update);
  }

  public sleep(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    this.storeTimeBeforeSleep();

    gsap.ticker.remove(this.update);
  }

  public restoreTimeAfterSleep(): void {
    this.startTime += performance.now() - this.sleepStartTime;
    this._timeScale = this.beforeSleepTimeScale;
    this.previousTime = round((performance.now() - this.startTime) * 0.001, 5);
  }

  public storeTimeBeforeSleep(): void {
    this.sleepStartTime = performance.now();

    if (this._timeScale !== 0) {
      this.beforeSleepTimeScale = this._timeScale;
      this._timeScale = 0;
    }
  }

  public get name(): string {
    return this._name;
  }

  public get time(): number {
    return this._time;
  }

  public get timeScale(): number {
    return this._timeScale;
  }

  public set timeScale(_value: number) {
    // helemaal 0 kan niet...
    _value = _value || 0.0000000001;

    if (!this.isRunning) {
      this.beforeSleepTimeScale = _value;
    } else {
      this._timeScale = _value;
    }
  }

  public set globalTimeScale(_value: number) {
    this._globalTimeScale = _value;
  }
}
