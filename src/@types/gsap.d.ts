declare namespace gsap {
  interface PixiPlugin extends TweenPlugin {
    parseColor(v: string | number): [number] | number;
    formatColors(s: string, toHSL: boolean): string;
    colorStringFilter(a: []): void;
    registerPIXI(PIXI: {}): void;
  }

  interface ColorPropsPlugin extends TweenPlugin {}
}

declare module 'gsap/ColorPropsPlugin';
declare module 'gsap/PixiPlugin';
