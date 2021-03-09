import { hexToRGB, rgbTint, rgbToHex } from './../util';

export const BaseLoggerColors = [
  '#2c3e50',
  '#F9A825',
  '#FC427B',
  '#00695C',
  '#3aaf85',
  '#283593',
  '#00a8ff',
  '#8e44ad',
  '#1E7D32',
  '#718093',
  '#AD1457',
  '#462255',
  '#7EE081',
  '#D2E0BF',
  '#CE84AD',
];

const NUM_SHADES = 6;

export function calculateLoggerColor(value: string, step = 0): string {
  const baseColor = hexToRGB(value.replace('#', ''));
  const color = rgbTint(baseColor, step * (1 / NUM_SHADES));
  return rgbToHex(color);
}

let currentColorIndex = -1;
export function getNextLoggerColor(): string {
  return BaseLoggerColors[++currentColorIndex % BaseLoggerColors.length];
}
