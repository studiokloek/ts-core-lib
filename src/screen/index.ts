import { Screen as ScreenClass } from './screen';
import { ConcreteStage as StageClass } from './stage';

import { RendererOptions as RendererOptions2, SizeOptions as SizeOptions2, StageOptions as StageOptions2 } from './stage';
export type RendererOptions = RendererOptions2;
export type SizeOptions = SizeOptions2;
export type StageOptions = StageOptions2;

export const Screen = new ScreenClass();
export const Stage = new StageClass();

export function initScreen(): void {
  Screen.init();
}

export * from './stageinfo';
export * from './constants';
export * from './resolution';
