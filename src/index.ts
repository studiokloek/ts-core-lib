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

import { initNetworkStatusDetection, getDeviceInfo } from './device';
import { initScreen } from './screen';
import { initLogger } from './logger';

interface ICoreLibraryOptions {
  assetsBasePath:string;
}

export const CoreLibraryOptions = {
  ASSET_BASE_PATH: './'
}
  
export async function initCoreLibrary(_options:ICoreLibraryOptions): Promise<void> {
  // set options
  CoreLibraryOptions.ASSET_BASE_PATH = _options?.assetsBasePath ??  CoreLibraryOptions.ASSET_BASE_PATH;

  await Promise.all([initNetworkStatusDetection(), getDeviceInfo()]);
  initScreen();
  initLogger();
}
