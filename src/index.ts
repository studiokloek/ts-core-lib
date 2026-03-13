export * from './debug';
export * from './logger';
export * from './events';

export * from './ticker';
export * from './delay';
export * from './tween';

export * from './device';
export * from './screen';

export * from './loaders';
export * from './data';
export * from './media';

export * from './app';
export * from './filters';

export * from './patterns';
export * from './html';
export * from './ui';

export * from './input';
export * from './util';

import { initNetworkStatusDetection, initDeviceInfo } from './device';
import { initAppInfo } from './app';
import { initScreen, ResolutionBreakpoint } from './screen';
import { initLogger } from './logger';
import { initTweens } from './tween';

/**
 * Instellingen die kunnen worden meegegeven aan `initCoreLibrary()` bij het opstarten.
 */
interface ICoreLibraryOptions {
  assetsBasePath?: string;
  resolutionBreakPoints?: ResolutionBreakpoint;
}

/**
 * Globale instellingen ingevuld door `initCoreLibrary()`.
 * Bevat het basispad voor bestanden en de resolutie-instellingen die door de hele bibliotheek worden gebruikt.
 */
export const CoreLibraryOptions = {
  ASSET_BASE_PATH: './',
  RESOLUTION_BREAKPOINTS: { ios: 1024, android: 1280, desktop: 1280 },
};

/**
 * Start de kernbibliotheek op: detecteert het apparaat, laadt app-informatie, configureert het scherm en de animaties.
 * Roep dit eenmalig aan bij het starten van de app.
 * Optionele instellingen kunnen het basispad voor bestanden en de resolutie-instellingen aanpassen.
 */
export async function initCoreLibrary(_options?: ICoreLibraryOptions): Promise<void> {
  // set options
  CoreLibraryOptions.ASSET_BASE_PATH = _options?.assetsBasePath ?? CoreLibraryOptions.ASSET_BASE_PATH;
  CoreLibraryOptions.RESOLUTION_BREAKPOINTS = _options?.resolutionBreakPoints ?? CoreLibraryOptions.RESOLUTION_BREAKPOINTS;

  initTweens();

  // init capacitor plugins
  await Promise.all([initNetworkStatusDetection(), initDeviceInfo(), initAppInfo()]);
  initScreen();
  initLogger();
}

// libs
export { hasMixin, Mixin } from 'ts-mixer';
export { AsyncEvent, SyncEvent } from 'ts-events';
