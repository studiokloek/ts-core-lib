/* eslint no-console: "off" */
import { noop, trim } from 'lodash-es';
import { CoreDebug } from '../debug/core';
import { calculateLoggerColor, getNextLoggerColor } from './colors';
import { LogLevels } from './levels';

class LoggerClass {
  private prefix = '';
  private isEnabled = true;
  private logLevel: number = LogLevels.DEBUG;
  private _color = '';

  private _verbose: (message?: unknown, ...optionalParams: unknown[]) => void;
  private _debug: (message?: unknown, ...optionalParams: unknown[]) => void;
  private _info: (message?: unknown, ...optionalParams: unknown[]) => void;
  private _warn: (message?: unknown, ...optionalParams: unknown[]) => void;
  private _error: (message?: unknown, ...optionalParams: unknown[]) => void;
  private _table: (tabularData?: unknown, properties?: string[]) => void;
  private _tree: (obj: unknown, options?: Record<string, unknown>) => void;

  public constructor(prefix: string, color?: string) {
    if (prefix) {
      this.prefix = `${prefix.toUpperCase()}`;
    }

    this._color = color || getNextLoggerColor();
    this._verbose = this.getBoundMethod(console.log);
    this._debug = this.getBoundMethod(console.log);
    this._info = this.getBoundMethod(console.info);
    this._warn = this.getBoundMethod(console.warn);
    this._error = this.getBoundMethod(console.error);
    this._table = console.table ? console.table.bind(console) : console.dir.bind(console);
    this._tree = console.dir.bind(console);
  }

  private getBoundMethod(method: (message?: unknown, ...optionalParams: unknown[]) => void): (message?: unknown, ...optionalParams: unknown[]) => void {
    return method.bind(console, `%c${this.prefix}`, `background:${this._color};color:#ffffff; font-size: 10px;padding:2px 4px 1px 4px; `);
  }

  public get verbose(): (message?: unknown, ...optionalParams: unknown[]) => void {
    return this.shouldLog(LogLevels.VERBOSE) ? this._verbose : noop;
  }

  public get debug(): (message?: unknown, ...optionalParams: unknown[]) => void {
    return this.shouldLog(LogLevels.DEBUG) ? this._debug : noop;
  }

  public get info(): (message?: unknown, ...optionalParams: unknown[]) => void {
    return this.shouldLog(LogLevels.INFO) ? this._info : noop;
  }

  public get warn(): (message?: unknown, ...optionalParams: unknown[]) => void {
    return this.shouldLog(LogLevels.WARN) ? this._warn : noop;
  }

  public get error(): (message?: unknown, ...optionalParams: unknown[]) => void {
    return this.shouldLog(LogLevels.ERROR) ? this._error : noop;
  }

  public get table(): (tabularData?: unknown, properties?: string[]) => void {
    return this.shouldLog(LogLevels.DEBUG) ? this._table : noop;
  }

  public get tree(): (obj: unknown, options?: Record<string, unknown>) => void {
    return this.shouldLog(LogLevels.DEBUG) ? this._tree : noop;
  }

  private shouldLog(_level: number = LogLevels.DEBUG): boolean {
    if (!this.isEnabled) {
      return false;
    }

    if (_level < this.logLevel) {
      return false;
    }

    return true;
  }

  public get titleColor(): string {
    return this._color;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public set level(_level: number) {
    this.logLevel = _level;
  }
}

const table: { [key: string]: LoggerClass } = {};

export const Logger = getLogger();

export function initLogger(): void {
  const loggers = Object.values(table);

  for (const logger of loggers) {
    logger.level = CoreDebug.getLogLevel();
  }
}

export function getLogger(prefix = 'default'): LoggerClass {
  prefix = prefix.toLowerCase();

  // om resources te sparen gebruiken we default zodra we niet in debug modus zijn
  if (!CoreDebug.isEnabled()) {
    prefix = 'default';
  }

  let logger = table[prefix] as LoggerClass;

  // bestaat deze logger al?
  if (!logger) {
    // nee, uitzoeken of er al een logger bestaat binnen deze namespace
    const parts = prefix.split('>').map((part) => trim(part)),
      numberOfParts = parts.length;

    // eventuele sub loggers aanmaken
    let loggerPrefix = '',
      mainLoggerColor = 'ff0000';

    for (let depth = 0; depth < numberOfParts; depth++) {
      loggerPrefix += parts[depth];
      logger = table[loggerPrefix];

      let loggerColor;

      if (depth === 0) {
        // is er al een main logger?
        if (logger) {
          mainLoggerColor = logger.titleColor;
        } else {
          // nee nieuwe basis kleur opvragen
          mainLoggerColor = getNextLoggerColor();
        }

        loggerColor = mainLoggerColor;
      } else {
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
