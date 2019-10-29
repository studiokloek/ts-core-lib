export * from './delay';
import { ConcreteTicker as TickerClass } from './ticker';
export declare function getTicker(name?: string): TickerClass;
export declare function setTickerGlobalTimeScale(_value: number): void;
export declare function storeTickerTimeBeforeSleep(): void;
export declare function restoreTickerTimeAfterSleep(): void;
export declare const Ticker: TickerClass;
export { TickerMixin } from './ticker';
