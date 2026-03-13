import { Capacitor } from '@capacitor/core';
import { getLogger } from '../logger';
import { StatusBar, Style } from '@capacitor/status-bar';

const Logger = getLogger('device > chrome');

/**
 * Stelt de statusbalk van het apparaat in (lichte stijl, verborgen) voor native iOS/Android-apps.
 * Heeft geen effect in een webbrowser.
 */
export async function initDeviceChrome(): Promise<void> {
  if (Capacitor.isPluginAvailable('StatusBar')) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.hide();
      Logger.debug('StatusBar hidden...');
    } catch (error) {
      Logger.error('Error setting StatusBar', error);
    }
  }
}
