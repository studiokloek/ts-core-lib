// PIXI
import 'pixi.js-legacy';
import 'pixi-spine';
// GSAP & TWEEN
import 'gsap';
import 'gsap-then';
import { ColorPropsPlugin } from 'gsap/ColorPropsPlugin';
import { PixiPlugin } from 'gsap/PixiPlugin';
// "onzin" regel om er voor te zorgen dat de plugins ge-include worden tijdens een build
[PixiPlugin, ColorPropsPlugin];
PixiPlugin.registerPIXI(PIXI);
export * from './data';
export * from './device';
export * from './events';
export * from './eventtypes';
export * from './filters';
export * from './html';
export * from './loaders';
export * from './loaders/spine-loader';
export * from './loaders/sprites-loader';
export * from './loaders/sounds-loader';
export * from './loaders/font-loader';
export * from './logger';
export * from './media';
export * from './screen';
export * from './ticker';
export * from './ui';
export * from './app';
export * from './core-debug';
export * from './date';
export * from './math';
export * from './random';
export * from './tween';
export * from './type';
//# sourceMappingURL=index.js.map