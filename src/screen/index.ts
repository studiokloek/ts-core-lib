export * from './screen';
export * from './stage';

import { Screen } from './screen';

/** Initialiseert de `Screen` singleton door window-resize-listeners te koppelen en de beginafmetingen en -resolutie te berekenen. Moet eenmalig worden aangeroepen voordat schermafhankelijke functies worden gebruikt. */
export function initScreen(): void {
  Screen.init();
}

export * from './stageinfo';
export * from './constants';
export * from './resolution';
