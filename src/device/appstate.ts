import { App, AppState } from '@capacitor/app';
import { isReloadedPage } from '../app';
import { AppEvent, PubSub } from '../events';
import { getLogger } from '../logger';
import { isApp } from './device';

const Logger = getLogger('device > app state');

let appStateActive = false;
function handleAppState(_active: boolean): void {
  if (appStateActive === _active) {
    return;
  }

  appStateActive = _active;

  if (appStateActive) {
    PubSub.publishSync(AppEvent.STATE_ACTIVE);
  } else {
    PubSub.publishSync(AppEvent.STATE_INACTIVE);
  }

  Logger.debug(`Changed state to '${appStateActive ? 'active' : 'in-active'}'`);
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

  // als app focus krijgt, dan is deze ook actief
  handleAppState(true);
}

export async function initAppStateDetection(): Promise<void> {
  if (isReloadedPage()) {
    return;
  }

  if (isApp()) {
    App.addListener('appStateChange', (_state: AppState) => {
      handleAppState(_state.isActive);
    });
  } else {
    document.addEventListener(
      'visibilitychange',
      () => {
        handleAppState(document.hidden !== true);
      },
      false,
    );

    window.addEventListener(
      'pageshow',
      () => {
        handleAppState(true);
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
