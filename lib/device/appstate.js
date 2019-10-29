import { Plugins } from '@capacitor/core';
import { PubSub } from '@studiokloek/kloek-ts-core/events';
import { AppEvent } from '@studiokloek/kloek-ts-core/eventtypes';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { isApp } from './device';
import { isReloadedPage } from '@studiokloek/kloek-ts-core/app';
const Logger = getLogger('core > app state');
const { App } = Plugins;
function handleAppState(state) {
    if (!state) {
        return;
    }
    if (state.isActive) {
        PubSub.publishSync(AppEvent.STATE_ACTIVE);
    }
    else {
        PubSub.publishSync(AppEvent.STATE_INACTIVE);
    }
    Logger.info(`Changed to '${state.isActive ? 'active' : 'in-active'}'`);
}
export async function initAppStateDetection() {
    if (isReloadedPage()) {
        return;
    }
    if (isApp()) {
        App.addListener('appStateChange', handleAppState);
    }
    else {
        document.addEventListener('visibilitychange', () => {
            const data = {
                isActive: document.hidden !== true,
            };
            handleAppState(data);
        }, false);
    }
}
//# sourceMappingURL=appstate.js.map