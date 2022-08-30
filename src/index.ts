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

interface ICoreLibraryOptions {
  assetsBasePath?: string;
  resolutionBreakPoints?: ResolutionBreakpoint;
}

export const CoreLibraryOptions = {
  ASSET_BASE_PATH: './',
  RESOLUTION_BREAKPOINTS: { ios: 1024, android: 1280, desktop: 1280 },
};

export async function initCoreLibrary(_options?: ICoreLibraryOptions): Promise<void> {
  // set options
  CoreLibraryOptions.ASSET_BASE_PATH = _options?.assetsBasePath ?? CoreLibraryOptions.ASSET_BASE_PATH;
  CoreLibraryOptions.RESOLUTION_BREAKPOINTS = _options?.resolutionBreakPoints ?? CoreLibraryOptions.RESOLUTION_BREAKPOINTS;

  // init capacitor plugins
  await Promise.all([initNetworkStatusDetection(), initDeviceInfo(), initAppInfo()]);
  initScreen();
  initLogger();
}
