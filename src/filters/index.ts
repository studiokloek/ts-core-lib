import { determineResolution } from '@studiokloek/ts-core-lib';
import { filters } from 'pixi.js-legacy';

export function getColorMatrixFilter(matrix: number[]): filters.ColorMatrixFilter {
  const filter = new filters.ColorMatrixFilter();
  filter.padding = 12;

  const { texture: textureResolution } = determineResolution();
  filter.resolution = textureResolution;

  filter.matrix = matrix;

  return filter;
}
