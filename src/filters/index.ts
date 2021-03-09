import { ColorMatrix, ColorMatrixFilter } from '@pixi/filter-color-matrix';
import { determineResolution } from '../screen';

export function getColorMatrixFilter(matrix: ColorMatrix): ColorMatrixFilter {
  const filter = new ColorMatrixFilter();
  filter.padding = 12;

  const { texture: textureResolution } = determineResolution();
  filter.resolution = textureResolution;

  filter.matrix = matrix;

  return filter;
}
