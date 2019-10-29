interface TickerCallback extends Function {
    __tickerid__?: number;
}
export declare class ConcreteTicker {
    private _name;
    private items;
    private hash;
    private startTime;
    private numberOfItems;
    private _time;
    private previousTime;
    private sleepStartTime;
    private _timeScale;
    private _globalTimeScale;
    private beforeSleepTimeScale;
    private isRunning;
    constructor(name: string);
    private update;
    add(callback: Function): number;
    remove(callback: TickerCallback | TickerCallback[]): void;
    removeAll(): void;
    wake(): void;
    sleep(): void;
    restoreTimeAfterSleep(): void;
    storeTimeBeforeSleep(): void;
    readonly name: string;
    readonly time: number;
    timeScale: number;
    globalTimeScale: number;
}
export declare class TickerMixin {
    private __ticker?;
    protected addTicker(callback: Function): number;
    protected removeTicker(callback: TickerCallback | TickerCallback[]): void;
    protected removeTickers(): void;
    protected pauseTickers(): void;
    protected resumeTickers(): void;
    readonly tickerTime: number;
}
export {};
