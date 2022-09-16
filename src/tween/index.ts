// GSAP & TWEEN
import { gsap } from 'gsap';

// PIXI en plugins
import * as PIXI from 'pixi.js';
import { PixiPlugin } from './pixi-plugin.js';

export function initTweens(): void {
  gsap.defaults({ overwrite: 'auto' });
  PixiPlugin.registerPIXI(PIXI);
  gsap.registerPlugin(PixiPlugin);
}

export * from './ease';
export * from './tween';
export * from './mixin';
