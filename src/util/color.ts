import { padStart } from 'lodash';

interface RGB {
  r: number;
  g: number;
  b: number;
}

export function isDarkColor(color: string | RGB): boolean {
  const rgb = colorToRGB(color);

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (rgb.r * rgb.r) + 0.587 * (rgb.g * rgb.g) + 0.114 * (rgb.b * rgb.b));

  // Using the HSP value, determine whether the color is light or dark
  return hsp > 127.5 ? false : true;
}

export function colorToRGB(color: string | RGB): RGB {
  if (typeof color !== 'string') {
    return color;
  }

  // Check the format of the color, HEX or RGB?
  if (color.startsWith('rgb')) {
    const splittedColor = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

    if (!splittedColor) {
      return { r: 0, g: 0, b: 0 };
    }

    return {
      r: Number.parseInt(splittedColor[0]),
      g: Number.parseInt(splittedColor[1]),
      b: Number.parseInt(splittedColor[2]),
    };
  } else {
    return hexToRGB(color);
  }
}

export function hexToRGB(color: string): RGB {
  const colorValue = color.length < 5 ? +`0x${color.slice(1).replace(/./g, '$&$&')}` : +`0x${color.slice(1)}`;
  return {
    r: colorValue >> 16,
    g: (colorValue >> 8) & 255,
    b: colorValue & 255,
  };
}

export function intToHex(value: number): string {
  return padStart(Math.min(Math.max(Math.round(value), 0), 255).toString(16), 2, '0');
}

export function rgbToHex(color: RGB): string {
  return `#${intToHex(color.r)}${intToHex(color.g)}${intToHex(color.b)}`;
}

export function hexToString(hex: number, alpha?: number): string {
  let hexString = hex.toString(16);
  hexString = '000000'.slice(0, Math.max(0, 6 - hexString.length)) + hexString;
  hexString = `#${hexString}`;

  if (alpha === undefined) {
    return hexString;
  }

  return `${hexString}${intToHex(Math.floor(alpha * 255))}`;
}

export function rgbTint(color: RGB, step: number): RGB {
  return {
    r: color.r + (255 - color.r) * step,
    g: color.g + (255 - color.g) * step,
    b: color.b + (255 - color.b) * step,
  };
}

export function hexToInt(s: string): number {
  return (Number.parseInt(s.slice(1), 16) << 8) / 256;
}

export function rgbToInt(color: RGB): number {
  return (color.r << 16) | (color.g << 8) | color.b;
}
