import { AppState, Plugins } from '@capacitor/core';
import { PubSub } from '@studiokloek/kloek-ts-core';
import { AppEvent } from '@studiokloek/kloek-ts-core';
import { getLogger } from '@studiokloek/kloek-ts-core';
import { isApp } from './device';
import { isReloadedPage } from '@studiokloek/kloek-ts-core';

const Logger = getLogger('core > app state');
const { App } = Plugins;

function handleAppState(state: AppState): void {
  if (!state) {
    return;
  }

  if (state.isActive) {
    PubSub.publishSync(AppEvent.STATE_ACTIVE);
  } else {
    PubSub.publishSync(AppEvent.STATE_INACTIVE);
  }

  Logger.info(`Changed to '${state.isActive ? 'active' : 'in-active'}'`);
}

export async function initAppStateDetection(): Promise<void> {
  if (isReloadedPage()) {
    return;
  }

  if (isApp()) {
    App.addListener('appStateChange', handleAppState);
  } else {
    document.addEventListener(
      'visibilitychange',
      () => {
        const data = {
          isActive: document.hidden !== true,
        };

        handleAppState(data);
      },
      false,
    );
  }
}
