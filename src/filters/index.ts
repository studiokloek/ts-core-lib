import { filters } from 'pixi.js-legacy';
import { determineResolution } from '@studiokloek/kloek-ts-core/screen';

export function getColorMatrixFilter(matrix: number[]): filters.ColorMatrixFilter {
  const filter = new filters.ColorMatrixFilter();
  filter.padding = 12;

  const { texture: textureResolution } = determineResolution();
  filter.resolution = textureResolution;

  filter.matrix = matrix;

  return filter;
}
