import { set } from 'lodash-es';
import { Text, TextStyle } from 'pixi.js-legacy';
import { PrepareCleanupInterface } from '../patterns';
import { Stage } from '../screen';

const StylesRegister: Record<string, TextStyle> = {};

function getStyle(_base?: TextStyle | string, _overwrite?: Record<string, unknown>): TextStyle | undefined {
  if (!_base) {
    return;
  }

  const baseStyle = typeof _base === 'string' ? StylesRegister[_base] : (_base as TextStyle);

  if (!_overwrite) {
    return baseStyle;
  }

  // overwrite certain preoptyoes
  const overwriteStyle = baseStyle.clone();
  for (const [key, value] of Object.entries(_overwrite)) {
    set(overwriteStyle, key, value);
  }

  return overwriteStyle;
}

export class KloekText extends Text implements PrepareCleanupInterface {
  private _value: string;

  public constructor(_text = '', _style?: TextStyle | string, _styleOverwrite?: Record<string, unknown>) {
    super('', getStyle(_style, _styleOverwrite));
    this.resolution = Stage.textureResolution;
    this.text = _text;
    this._value = this.text;
  }

  public prepareAfterLoad(): void {
    this.text = this._value;
  }

  public cleanupBeforeUnload(): void {
    this._value = this.text;
    this.text = '';
  }

  public static create(_text: string, _style?: TextStyle | string, _styleOverwrite?: Record<string, unknown>): KloekText {
    return new KloekText(_text, _style, _styleOverwrite);
  }

  public static registerStyle(_name: string, _style: TextStyle): void {
    StylesRegister[_name] = _style;
  }
}
