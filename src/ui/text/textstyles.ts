import { isPlainObject, set } from 'lodash';
import { Logger } from '../../logger';
import { ITextStyle, TextStyle } from 'pixi.js';
import { HTMLTextStyle } from './html-text';

const StylesRegister: Record<string, TextStyle> = {};

export function registerTextStyle(_name: string, _baseOrStyle: string | TextStyle | Partial<ITextStyle>, _style?: Partial<ITextStyle>): void {
  if (typeof _baseOrStyle === 'string' && _style) {
    const baseStyle = StylesRegister[_baseOrStyle];

    if (!baseStyle) {
      Logger.warn('registerTextStyle', `Could not find a base style named '${_baseOrStyle}'...`);
      return;
    }

    StylesRegister[_name] = overwriteTextStyle(baseStyle, _style);

    return;
  }

  // bestaat deze al?
  if (StylesRegister[_name]) {
    Logger.warn('registerTextStyle', `A style with the name '${_name}' already exists. It will be overwritten.`);
  }

  StylesRegister[_name] = isPlainObject(_baseOrStyle) ? new TextStyle(_baseOrStyle as Partial<ITextStyle>) : (_baseOrStyle as TextStyle);
}

export function overwriteTextStyle(_base: TextStyle, _overwrite: Partial<ITextStyle>): TextStyle {
  const style = _base.clone();

  for (const [key, value] of Object.entries(_overwrite)) {
    set(style, key, value);
  }

  return style;
}

export function getTextStyle(_base?: TextStyle | Partial<ITextStyle> | string, _overwrite?: Partial<ITextStyle>, _html = false): TextStyle | HTMLTextStyle | undefined {
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

  const style = _html ? HTMLTextStyle.from(baseStyle) : baseStyle;

  if (!_overwrite) {
    return style;
  }

  return overwriteTextStyle(style, _overwrite);
}
