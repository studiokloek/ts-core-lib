export * from './delay';

import { ConcreteTicker as TickerClass } from './ticker';
import { values } from 'lodash-es';

const table: { [key: string]: TickerClass } = {};

let globalTimeScale = 1;

export function getTicker(name: string = 'default'): TickerClass {
  let ticker = table[name] as TickerClass;

  if (!ticker) {
    ticker = table[name] = new TickerClass(name);
  }

  ticker.globalTimeScale = globalTimeScale;

  return ticker;
}

export function setTickerGlobalTimeScale(_value: number): void {
  globalTimeScale = _value;

  const tickers = values(table);
  for (const ticker of tickers) {
    ticker.globalTimeScale = _value;
  }
}

export function storeTickerTimeBeforeSleep(): void {
  const tickers = values(table);

  for (const ticker of tickers) {
    ticker.storeTimeBeforeSleep();
  }
}

export function restoreTickerTimeAfterSleep(): void {
  const tickers = values(table);

  for (const ticker of tickers) {
    ticker.restoreTimeAfterSleep();
  }
}

export const Ticker = getTicker();

export { TickerMixin } from './ticker';
