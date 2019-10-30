import { AppState, Plugins } from '@capacitor/core';
import { isReloadedPage } from '../app';
import { AppEvent, PubSub } from '../events';
import { getLogger } from '../logger';
import { isApp } from './device';

const Logger = getLogger('device > app state');
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
