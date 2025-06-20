import { isPlainObject, set } from 'lodash';
import { Logger } from '../../logger';
import { TextStyle } from 'pixi.js';

const StylesRegister: Record<string, TextStyle> = {};

export function registerTextStyle(_name: string, _baseOrStyle: string | TextStyle | Record<string, unknown>, _style?: Record<string, unknown>): void {
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

  StylesRegister[_name] = isPlainObject(_baseOrStyle) ? new TextStyle(_baseOrStyle as Record<string, unknown>) : (_baseOrStyle as TextStyle);
}

export function overwriteTextStyle(_base: TextStyle, _overwrite: Record<string, unknown>): TextStyle {
  const style = _base.clone();

  for (const [key, value] of Object.entries(_overwrite)) {
    set(style, key, value);
  }

  return style;
}

export function getTextStyle(_base?: TextStyle | Record<string, unknown> | string, _overwrite?: Record<string, unknown>): TextStyle | undefined {
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

  return overwriteTextStyle(baseStyle, _overwrite);
}
