import { Capacitor, Plugins, StatusBarStyle } from '@capacitor/core';
import { getLogger } from '../logger';

const { StatusBar } = Plugins;

const Logger = getLogger('device > chrome');

export async function initDeviceChrome(): Promise<void> {
  if (Capacitor.isPluginAvailable('StatusBar')) {
    try {
      await StatusBar.setStyle({ style: StatusBarStyle.Light });
      await StatusBar.hide();
      Logger.info('StatusBar hidden...');
    } catch (error) {
      Logger.error('Error setting StatusBar', error);
    }
  }
}
