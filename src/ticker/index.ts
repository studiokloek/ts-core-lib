import { ConcreteTicker } from './ticker';
import { values } from 'lodash';

const table: { [key: string]: ConcreteTicker } = {};

let globalTimeScale = 1;

export function getTicker(name = 'default', autoSleep = false): ConcreteTicker {
  let ticker = table[name] as ConcreteTicker;

  if (!ticker) {
    ticker = table[name] = new ConcreteTicker(name, autoSleep);
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

export * from './mixin';
