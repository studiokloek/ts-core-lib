import { get } from 'lodash';
import { getTicker } from '.';
import { getLogger } from '../logger';
import { ConcreteTicker, TickerCallback } from './ticker';

const Logger = getLogger('ticker > mixin');

// MIXIN
let MIXIN_UUID = 0;
/**
 * Mixin die per-frame ticker-callback-beheer aan een klasse toevoegt. Elke instantie
 * krijgt zijn eigen auto-sleep `ConcreteTicker` (vernoemd naar de `name` of `id` van de instantie).
 * Gebruik `addTicker(callback)` om een frame-updatefunctie te registreren en `removeTicker` /
 * `removeTickers` om de registratie ongedaan te maken. `pauseTickers` / `resumeTickers` pauzeren en hervatten
 * de onderliggende ticker. Gebruik via `Mixin(BaseClass, TickerMixin)` vanuit ts-mixer.
 */
export class TickerMixin {
  private __ticker?: ConcreteTicker;

  protected addTicker(callback: TickerCallback): number {
    if (typeof callback !== 'function') {
      Logger.error('addTicker', 'Could not add callback. No valid callback provided.');
      return -1;
    }

    if (!this.__ticker) {
      const name = (get(this, 'name') || get(this, 'id') || `mixin-ticker-${++MIXIN_UUID}`) as string;
      this.__ticker = getTicker(name, true);
    }

    return this.__ticker.add(callback);
  }

  protected removeTicker(callback: TickerCallback | TickerCallback[]): void {
    if (this.__ticker) {
      return this.__ticker.remove(callback);
    }
  }

  protected removeTickers(): void {
    if (this.__ticker) {
      this.__ticker.removeAll();
    }
  }

  protected pauseTickers(): void {
    if (this.__ticker) {
      this.__ticker.sleep();
    }
  }

  protected resumeTickers(): void {
    if (this.__ticker) {
      this.__ticker.wake();
    }
  }

  get tickerTime(): number {
    return this.__ticker ? this.__ticker.time : 0;
  }
}
