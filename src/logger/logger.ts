/* eslint no-console: "off" */

import { trim, noop } from 'lodash-es';
import { calculateLoggerColor, getNextLoggerColor } from './colors';
import { CoreDebug } from '@studiokloek/kloek-ts-core';
import { LogLevels } from './levels';

class LoggerClass {
  private prefix: string = '';
  private isEnabled: boolean = true;
  private logLevel: number = LogLevels.DEBUG;
  private _color: string = '';

  private _debug: Function;
  private _info: Function;
  private _warn: Function;
  private _error: Function;
  private _table: Function;
  private _tree: Function;

  public constructor(prefix: string, color?: string) {
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

  private getBoundMethod(method: Function): Function {
    return method.bind(console, `%c${this.prefix}`, `background:${this._color};color:#ffffff; font-size: 10px;padding:2px 4px 1px 4px; `);
  }

  public get debug(): Function {
    return this.shouldLog(LogLevels.DEBUG) ? this._debug : noop;
  }

  public get info(): Function {
    return this.shouldLog(LogLevels.INFO) ? this._info : noop;
  }

  public get warn(): Function {
    return this.shouldLog(LogLevels.WARN) ? this._warn : noop;
  }

  public get error(): Function {
    return this.shouldLog(LogLevels.ERROR) ? this._error : noop;
  }

  public get table(): Function {
    return this.shouldLog(LogLevels.DEBUG) ? this._table : noop;
  }

  public get tree(): Function {
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

export function getLogger(prefix: string = 'default'): LoggerClass {
  prefix = prefix.toLowerCase();
  let logger = table[prefix] as LoggerClass;

  // bestaat deze logger al?
  if (!logger) {
    // nee, uitzoeken of er al een logger bestaat binnen deze namespace
    const parts = prefix.split('>').map(part => trim(part)),
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

export function squashForLog(_value?: {}): {} {
  if (_value) {
    return JSON.stringify(_value);
  } else {
    return '';
  }
}
