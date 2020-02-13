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

  Logger.info(`Changed state to '${state.isActive ? 'active' : 'in-active'}'`);
}

function handleWindowBlur(): void {
  Logger.info(`Changed state to 'blurred'`);
  PubSub.publishSync(AppEvent.STATE_BLURRED);
}

function handleWindowFocus(): void {
  Logger.info(`Changed state to 'focussed'`);
  PubSub.publishSync(AppEvent.STATE_FOCUSSED);
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

  // luister of focus veranderd
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  
  // als app klaar is, een keer goede focus geven
  PubSub.subscribeOnce(AppEvent.READY, () => {
    window.focus();
  });
}
