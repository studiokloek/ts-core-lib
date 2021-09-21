import { Capacitor } from '@capacitor/core';
import { getLogger } from '../logger';
import { StatusBar, Style } from '@capacitor/status-bar';


const Logger = getLogger('device > chrome');

export async function initDeviceChrome(): Promise<void> {
  if (Capacitor.isPluginAvailable('StatusBar')) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.hide();
      Logger.info('StatusBar hidden...');
    } catch (error) {
      Logger.error('Error setting StatusBar', error);
    }
  }
}
