import { isPlainObject, set } from 'lodash-es';
import { Text, TextStyle } from 'pixi.js';
import { getLogger } from '../logger';
import type { PrepareCleanupInterface } from '../patterns';
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
  private _value: string;

  public constructor(_text = '', _style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>) {
    super('', getStyle(_style, _styleOverwrite));
    this.determineResolution();
    this.text = _text;
    this._value = this.text;
  }

  public prepareAfterLoad(): void {
    this.determineResolution();
    this.text = this._value;
  }

  public cleanupBeforeUnload(): void {
    this.resolution = 1;
    this._value = this.text;
    this.text = '';
  }

  private determineResolution(): void {
    this.resolution = Stage.textureResolution;
    // this.resolution = Math.max(Stage.textureResolution, Math.round(Stage.textureResolution * Stage.scale.x));
  }

  public static create(_text: string, _style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>): KloekText {
    return new KloekText(_text, _style, _styleOverwrite);
  }

  public static registerStyle(_name: string, _baseOrStyle: string | TextStyle | Record<string, unknown>, _style?: Record<string, unknown>): void {
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
