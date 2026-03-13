import { padStart } from 'lodash';

interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Bepaalt of een kleur als donker wordt waargenomen op basis van de HSP-helderheidsformule (Highly Sensitive Poo).
 * Accepteert een CSS hex/rgb string of een RGB object.
 */
export function isDarkColor(color: string | RGB): boolean {
  const rgb = colorToRGB(color);

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  const hsp = Math.sqrt(0.299 * (rgb.r * rgb.r) + 0.587 * (rgb.g * rgb.g) + 0.114 * (rgb.b * rgb.b));

  // Using the HSP value, determine whether the color is light or dark
  return hsp > 127.5 ? false : true;
}

/**
 * Zet een kleurwaarde (CSS hex string, CSS rgb/rgba string of RGB object) om naar een RGB object.
 * Geeft `{r: 0, g: 0, b: 0}` terug als het parsen mislukt.
 */
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

/**
 * Zet een CSS hex-kleurstring (bijv. `"#fff"` of `"#ffffff"`) om naar een RGB object.
 */
export function hexToRGB(color: string): RGB {
  const colorValue = color.length < 5 ? +`0x${color.slice(1).replace(/./g, '$&$&')}` : +`0x${color.slice(1)}`;
  return {
    r: colorValue >> 16,
    g: (colorValue >> 8) & 255,
    b: colorValue & 255,
  };
}

/**
 * Zet een geheel getal (0–255) om naar een tweekarak­ter hex-string in kleine letters, waarbij waarden buiten bereik worden begrensd.
 */
export function intToHex(value: number): string {
  return padStart(Math.min(Math.max(Math.round(value), 0), 255).toString(16), 2, '0');
}

/**
 * Zet een RGB object om naar een CSS hex-kleurstring (bijv. `"#ff0080"`).
 */
export function rgbToHex(color: RGB): string {
  return `#${intToHex(color.r)}${intToHex(color.g)}${intToHex(color.b)}`;
}

/**
 * Zet een numerieke hex-kleurwaarde om naar een CSS hex-string (bijv. `0xff0080` → `"#ff0080"`).
 * Voegt optioneel een alfacomponent toe wanneer `alpha` (0–1) is opgegeven.
 */
export function hexToString(hex: number, alpha?: number): string {
  let hexString = hex.toString(16);
  hexString = '000000'.slice(0, Math.max(0, 6 - hexString.length)) + hexString;
  hexString = `#${hexString}`;

  if (alpha === undefined) {
    return hexString;
  }

  return `${hexString}${intToHex(Math.floor(alpha * 255))}`;
}

/**
 * Mengt een RGB-kleur richting wit met de gegeven `step`-factor (0 = originele kleur, 1 = wit).
 */
export function rgbTint(color: RGB, step: number): RGB {
  return {
    r: color.r + (255 - color.r) * step,
    g: color.g + (255 - color.g) * step,
    b: color.b + (255 - color.b) * step,
  };
}

/**
 * Zet een CSS hex-kleurstring (bijv. `"#ff0080"`) om naar een numerieke integerrepresentatie.
 */
export function hexToInt(s: string): number {
  return (Number.parseInt(s.slice(1), 16) << 8) / 256;
}

/**
 * Zet een RGB object om naar een gecomprimeerd 24-bit geheel getal (bijv. voor gebruik als PIXI-tintwaarde).
 */
export function rgbToInt(color: RGB): number {
  return (color.r << 16) | (color.g << 8) | color.b;
}
