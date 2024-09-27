import { App, AppState } from '@capacitor/app';
import { isReloadedPage } from '../app';
import { AppEvent, PubSub } from '../events';
import { getLogger } from '../logger';
import { isApp } from './device';

const Logger = getLogger('device > app state');

function handleAppState(state: AppState): void {
  if (!state) {
    return;
  }

  if (state.isActive) {
    PubSub.publishSync(AppEvent.STATE_ACTIVE);
  } else {
    PubSub.publishSync(AppEvent.STATE_INACTIVE);
  }

  Logger.debug(`Changed state to '${state.isActive ? 'active' : 'in-active'}'`);
}

let appHasFocus = false;
function handleWindowBlur(): void {
  if (appHasFocus === false) {
    return;
  }
  Logger.debug(`Changed state to 'blurred'`);
  appHasFocus = false;
  PubSub.publishSync(AppEvent.STATE_BLURRED);
}

function handleWindowFocus(): void {
  if (appHasFocus === true) {
    return;
  }
  Logger.debug(`Changed state to 'focussed'`);
  appHasFocus = true;
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
        handleAppState({
          isActive: document.hidden !== true,
        });
      },
      false,
    );

    window.addEventListener(
      'pageshow',
      () => {
        handleAppState({
          isActive: true,
        });
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
