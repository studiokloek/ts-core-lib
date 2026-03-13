// GSAP & TWEEN
import { gsap } from 'gsap';

// PIXI en plugins
import * as PIXI from 'pixi.js';
import { PixiPlugin } from './pixi-plugin.js';

/**
 * Initialiseert GSAP met de PIXI.js-instantie van de applicatie. Moet eenmalig worden aangeroepen bij
 * het opstarten van de applicatie, vóór het aanmaken van tweens. Stelt de standaard overschrijfmodus van GSAP
 * in op `'auto'` en registreert de PixiPlugin zodat PIXI display-objecteigenschappen direct
 * geanimeerd kunnen worden.
 */
export function initTweens(): void {
  gsap.defaults({ overwrite: 'auto' });
  PixiPlugin.registerPIXI(PIXI);
  gsap.registerPlugin(PixiPlugin);
}

export * from './ease';
export * from './tween';
export * from './mixin';
