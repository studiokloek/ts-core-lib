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
import { initTweens } from './tween';

export async function initCoreLibrary(): Promise<void> {
  initTweens();
  await Promise.all([initNetworkStatusDetection(), getDeviceInfo()]);
  initScreen();
  initLogger();
}
