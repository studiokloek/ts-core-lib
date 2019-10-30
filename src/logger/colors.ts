import { padStart } from 'lodash-es';

export const BaseLoggerColors = [
  '#2c3e50',
  '#F9A825',
  '#FC427B',
  '#00695C',
  '#3aaf85',
  '#283593',
  '#00a8ff',
  // '#D84315',
  '#8e44ad',
  '#1E7D32',
  '#718093',
  '#AD1457',
  '#462255',
  '#7EE081',
  '#D2E0BF',
  '#CE84AD',
  // '#c0392b',
];

const NUM_SHADES = 6;

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRGB(color: string): RGB {
  return {
    r: parseInt(color.substr(0, 2), 16),
    g: parseInt(color.substr(2, 2), 16),
    b: parseInt(color.substr(4, 2), 16),
  };
}

function intToHex(value: number): string {
  return padStart(Math.min(Math.max(Math.round(value), 0), 255).toString(16), 2, '0');
}

function rgbToHex(color: RGB): string {
  return `#${intToHex(color.r)}${intToHex(color.g)}${intToHex(color.b)}`;
}

function rgbTint(color: RGB, step: number): RGB {
  return {
    r: color.r + (255 - color.r) * step,
    g: color.g + (255 - color.g) * step,
    b: color.b + (255 - color.b) * step,
  };
}

// function rgbShade(color: RGB, step: number): RGB {
//   return {
//     r: color.r * (1 - step),
//     g: color.g * (1 - step),
//     b: color.b * (1 - step),
//   };
// }

export function calculateLoggerColor(value: string, step: number = 0): string {
  const baseColor = hexToRGB(value.replace('#', ''));
  const color = rgbTint(baseColor, step * (1 / NUM_SHADES));
  // console.log(`%c${rgbToHex(color)}`, `background:${rgbToHex(color)};color:#ffffff; font-size: 10px;padding:2px 4px 1px 4px; `);
  return rgbToHex(color);
}

let currentColorIndex = -1;
export function getNextLoggerColor(): string {
  return BaseLoggerColors[++currentColorIndex % BaseLoggerColors.length];
}
