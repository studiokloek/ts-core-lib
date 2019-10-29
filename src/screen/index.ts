import { Screen as ScreenClass } from './screen';
import { ConcreteStage as StageClass } from './stage';

export interface StageInfo {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  size: { width: number; height: number };
}

export const Screen = new ScreenClass();
export const Stage = new StageClass();

export function initScreen(): void {
  Screen.init();
}

export * from './constants';
export * from './resolution';
