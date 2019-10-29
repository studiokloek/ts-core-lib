export * from './delay';
import { ConcreteTicker as TickerClass } from './ticker';
import { values } from 'lodash-es';
const table = {};
let globalTimeScale = 1;
export function getTicker(name = 'default') {
    let ticker = table[name];
    if (!ticker) {
        ticker = table[name] = new TickerClass(name);
    }
    ticker.globalTimeScale = globalTimeScale;
    return ticker;
}
export function setTickerGlobalTimeScale(_value) {
    globalTimeScale = _value;
    const tickers = values(table);
    for (const ticker of tickers) {
        ticker.globalTimeScale = _value;
    }
}
export function storeTickerTimeBeforeSleep() {
    const tickers = values(table);
    for (const ticker of tickers) {
        ticker.storeTimeBeforeSleep();
    }
}
export function restoreTickerTimeAfterSleep() {
    const tickers = values(table);
    for (const ticker of tickers) {
        ticker.restoreTimeAfterSleep();
    }
}
export const Ticker = getTicker();
export { TickerMixin } from './ticker';
//# sourceMappingURL=index.js.map