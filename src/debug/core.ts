import { LogLevels } from '../logger/levels';
import { assign } from 'lodash-es';

// als er een get parameter ?debug aanwezig is, zetten we debug aan
const parameters = new URLSearchParams(location.search);

export interface CoreDebugSettings {
  isEnabled?: boolean;
  minLogLevel: number;
  globalTimescale: number;
  showStats: boolean;
  forceLowResolution: boolean;
  disableSounds: boolean;
  skipMediaTrigger: boolean;
}

const values = {
  isEnabled: parameters.has('debug'),
  minLogLevel: LogLevels.WARN,
  globalTimescale: 1,
  showStats: false,
  disableSounds: false,
  forceLowResolution: false,
  skipMediaTrigger: false,
};

export function setCoreDebugSettings(_settings: CoreDebugSettings): void {
  assign(values, _settings);
}

export const CoreDebug = {
  isEnabled(): boolean {
    return values.isEnabled;
  },
  skipMediaTrigger(): boolean {
    return values.isEnabled && values.skipMediaTrigger;
  },
  disableSounds(): boolean {
    return values.isEnabled && values.disableSounds;
  },
  forceLowResolution(): boolean {
    return values.isEnabled && values.forceLowResolution;
  },
  getLogLevel(): number {
    if (values.isEnabled) {
      return LogLevels.DEBUG;
    }
    return values.minLogLevel;
  },
  getGlobalTimescale(): number {
    if (values.isEnabled) {
      return values.globalTimescale;
    }
    return 1;
  },
  showStats(): boolean {
    if (values.isEnabled) {
      return values.showStats;
    }
    return false;
  },
};
