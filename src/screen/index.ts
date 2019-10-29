import { Screen as ScreenClass } from './screen';
import { ConcreteStage as StageClass } from './stage';

export const Screen = new ScreenClass();
export const Stage = new StageClass();

export function initScreen(): void {
  Screen.init();
}

export * from './stageinfo';
export * from './constants';
export * from './resolution';
