/* eslint no-console: "off" */
import { trim, noop } from 'lodash-es';
import { calculateLoggerColor, getNextLoggerColor } from './colors';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
import { LogLevels } from './levels';
class LoggerClass {
    constructor(prefix, color) {
        this.prefix = '';
        this.isEnabled = true;
        this.logLevel = LogLevels.DEBUG;
        this._color = '';
        if (prefix) {
            this.prefix = `${prefix.toUpperCase()}`;
        }
        this._color = color || getNextLoggerColor();
        this._debug = this.getBoundMethod(console.log);
        this._info = this.getBoundMethod(console.info);
        this._warn = this.getBoundMethod(console.warn);
        this._error = this.getBoundMethod(console.error);
        this._table = console.table.bind(console);
        this._tree = console.dir.bind(console);
    }
    getBoundMethod(method) {
        return method.bind(console, `%c${this.prefix}`, `background:${this._color};color:#ffffff; font-size: 10px;padding:2px 4px 1px 4px; `);
    }
    get debug() {
        return this.shouldLog(LogLevels.DEBUG) ? this._debug : noop;
    }
    get info() {
        return this.shouldLog(LogLevels.INFO) ? this._info : noop;
    }
    get warn() {
        return this.shouldLog(LogLevels.WARN) ? this._warn : noop;
    }
    get error() {
        return this.shouldLog(LogLevels.ERROR) ? this._error : noop;
    }
    get table() {
        return this.shouldLog(LogLevels.DEBUG) ? this._table : noop;
    }
    get tree() {
        return this.shouldLog(LogLevels.DEBUG) ? this._tree : noop;
    }
    shouldLog(_level = LogLevels.DEBUG) {
        if (!this.isEnabled) {
            return false;
        }
        if (_level < this.logLevel) {
            return false;
        }
        return true;
    }
    get titleColor() {
        return this._color;
    }
    enable() {
        this.isEnabled = true;
    }
    disable() {
        this.isEnabled = false;
    }
    set level(_level) {
        this.logLevel = _level;
    }
}
const table = {};
export const Logger = getLogger();
export function getLogger(prefix = 'default') {
    prefix = prefix.toLowerCase();
    let logger = table[prefix];
    // bestaat deze logger al?
    if (!logger) {
        // nee, uitzoeken of er al een logger bestaat binnen deze namespace
        const parts = prefix.split('>').map(part => trim(part)), numberOfParts = parts.length;
        // eventuele sub loggers aanmaken
        let loggerPrefix = '', mainLoggerColor = 'ff0000';
        for (let depth = 0; depth < numberOfParts; depth++) {
            loggerPrefix += parts[depth];
            logger = table[loggerPrefix];
            let loggerColor;
            if (depth === 0) {
                // is er al een main logger?
                if (logger) {
                    mainLoggerColor = logger.titleColor;
                }
                else {
                    // nee nieuwe basis kleur opvragen
                    mainLoggerColor = getNextLoggerColor();
                }
                loggerColor = mainLoggerColor;
            }
            else {
                // nieuwe kleur op basis van niveau
                loggerColor = calculateLoggerColor(mainLoggerColor, depth);
            }
            // bestaat niet? aanmaken
            if (!logger) {
                logger = table[loggerPrefix] = new LoggerClass(loggerPrefix, loggerColor);
                logger.level = CoreDebug.getLogLevel();
            }
            if (depth === 0) {
                mainLoggerColor = logger.titleColor;
            }
            loggerPrefix += ' > ';
        }
    }
    return logger;
}
export function squashForLog(_value) {
    if (_value) {
        return JSON.stringify(_value);
    }
    else {
        return '';
    }
}
//# sourceMappingURL=logger.js.map