export * from './screen';
export * from './stage';

import {Screen} from './screen';

export function initScreen(): void {
  Screen.init();
}

export * from './stageinfo';
export * from './constants';
export * from './resolution';
