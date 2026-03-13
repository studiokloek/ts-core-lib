import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
import type { ColorMatrix } from '@pixi/filter-color-matrix';
import { determineResolution } from '../screen';

/**
 * Maakt een kleurfilter (`ColorMatrixFilter`) aan, klaar voor gebruik met de huidige schermresolutie.
 * Geef een 4×5 kleurmatrix mee om te bepalen hoe kleuren worden omgezet.
 */
export function getColorMatrixFilter(matrix: ColorMatrix): ColorMatrixFilter {
  const filter = new ColorMatrixFilter();
  filter.padding = 12;

  const { texture: textureResolution } = determineResolution();
  filter.resolution = textureResolution;

  filter.matrix = matrix;

  return filter;
}
