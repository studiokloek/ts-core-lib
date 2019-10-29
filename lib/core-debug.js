import { LogLevels } from '@studiokloek/kloek-ts-core/logger/levels';
import { assign } from 'lodash-es';
import { settings } from 'pixi.js-legacy';
// als er een get parameter ?debug aanwezig is, zetten we debug aan
const parameters = new URLSearchParams(location.search);
const values = {
    isEnabled: parameters.has('debug'),
    minLogLevel: LogLevels.WARN,
    globalTimescale: 1,
    showStats: false,
    disableSounds: false,
    forceLowResolution: false,
    skipMediaTrigger: false,
};
export function setCoreDebugSettings(_settings) {
    assign(values, settings);
}
export const CoreDebug = {
    isEnabled() {
        return values.isEnabled;
    },
    skipMediaTrigger() {
        return values.isEnabled && values.skipMediaTrigger;
    },
    disableSounds() {
        return values.isEnabled && values.disableSounds;
    },
    forceLowResolution() {
        return values.isEnabled && values.forceLowResolution;
    },
    getLogLevel() {
        if (values.isEnabled) {
            return LogLevels.DEBUG;
        }
        return values.minLogLevel;
    },
    getGlobalTimescale() {
        if (values.isEnabled) {
            return values.globalTimescale;
        }
        return 1;
    },
    showStats() {
        if (values.isEnabled) {
            return values.showStats;
        }
        return false;
    },
};
//# sourceMappingURL=core-debug.js.map