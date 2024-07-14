import { isPlainObject, set } from 'lodash-es';
import { Container, Text, TextStyle } from 'pixi.js';
import { getLogger } from '../logger';
import { PrepareCleanupInterface } from '../patterns';
import { Stage } from '../screen';

const Logger = getLogger('ui > kloektext');

const StylesRegister: Record<string, TextStyle> = {};

function overwriteStyle(_base: TextStyle, _overwrite: Record<string, unknown>): TextStyle {
  const style = _base.clone();

  for (const [key, value] of Object.entries(_overwrite)) {
    set(style, key, value);
  }

  return style;
}

function getStyle(_base?: TextStyle | Record<string, unknown> | string, _overwrite?: Record<string, unknown>): TextStyle | undefined {
  if (!_base) {
    return;
  }

  let baseStyle;

  if (typeof _base === 'string') {
    baseStyle = StylesRegister[_base];
  } else if (isPlainObject(_base)) {
    baseStyle = new TextStyle(_base);
  } else {
    baseStyle = _base as TextStyle;
  }

  if (!_overwrite) {
    return baseStyle;
  }

  return overwriteStyle(baseStyle, _overwrite);
}

export class KloekText extends Text implements PrepareCleanupInterface {
  protected isPrepared = false;
  private _value: string | number | undefined;
  protected target: Container | undefined;

  constructor(_text: string | number, _style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>) {
    super('', getStyle(_style, _styleOverwrite));
    this.text = _text;
  }

  get text(): string {
    return this._value?.toString() ?? '';
  }

  set text(text: string | number) {
    this._value = text;
    this.updateTextField();
  }

  private updateTextField(): void {
    if (!this.isPrepared) {
      return;
    }

    this.determineResolution();
    super.text = this._value ?? '';
  }

  updateStyle(_style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>): void {
    const style = getStyle(_style, _styleOverwrite);
    this.style = style ?? new TextStyle();
  }

  prepareAfterLoad(): void {
    if (this.isPrepared) {
      return;
    }
    this.isPrepared = true;

    this.updateTextField();
  }

  cleanupBeforeUnload(): void {
    if (!this.isPrepared) {
      return;
    }
    this.isPrepared = false;

    this.resolution = 1;
    super.text = '';
  }

  private determineResolution(): void {
    this.resolution = Stage.textureResolution;
  }

  // target
  setTarget(_target: Container | undefined): void {
    this.target = _target;
  }

  addToTarget(): void {
    if (this.target) {
      this.target.addChild(this);
    }
  }

  removeFromTarget(): void {
    if (this.target && this.parent) {
      this.target.removeChild(this);
    }
  }

  static create(_text: string | number, _style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>): KloekText {
    return new KloekText(_text, _style, _styleOverwrite);
  }

  static registerStyle(_name: string, _baseOrStyle: string | TextStyle | Record<string, unknown>, _style?: Record<string, unknown>): void {
    if (typeof _baseOrStyle === 'string' && _style) {
      const baseStyle = StylesRegister[_baseOrStyle];

      if (!baseStyle) {
        Logger.warn('registerStyle', `Could not find a base style named '${_baseOrStyle}'...`);
        return;
      }

      StylesRegister[_name] = overwriteStyle(baseStyle, _style);

      return;
    }

    if (isPlainObject(_baseOrStyle)) {
      StylesRegister[_name] = new TextStyle(_baseOrStyle as Record<string, unknown>);
    } else {
      StylesRegister[_name] = _baseOrStyle as TextStyle;
    }
  }
}
