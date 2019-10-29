declare class LoggerClass {
    private prefix;
    private isEnabled;
    private logLevel;
    private _color;
    private _debug;
    private _info;
    private _warn;
    private _error;
    private _table;
    private _tree;
    constructor(prefix: string, color?: string);
    private getBoundMethod;
    readonly debug: Function;
    readonly info: Function;
    readonly warn: Function;
    readonly error: Function;
    readonly table: Function;
    readonly tree: Function;
    private shouldLog;
    readonly titleColor: string;
    enable(): void;
    disable(): void;
    level: number;
}
export declare const Logger: LoggerClass;
export declare function getLogger(prefix?: string): LoggerClass;
export declare function squashForLog(_value?: {}): {};
export {};
