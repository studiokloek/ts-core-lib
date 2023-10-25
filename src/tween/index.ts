// GSAP & TWEEN
import { gsap } from 'gsap';
gsap.defaults({ overwrite: 'auto' });

// PIXI en plugins
import * as PIXI from 'pixi.js';
import { PixiPlugin } from './pixi-plugin.js';
PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(PixiPlugin);

export * from './ease';
export * from './tween';
export * from './mixin';
