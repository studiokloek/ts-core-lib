import { getLogger } from 'logger';
import { Capacitor, Plugins, StatusBarStyle } from '@capacitor/core';

const { StatusBar } = Plugins;

const Logger = getLogger('core > chrome');

export async function initDeviceChrome(): Promise<void> {
  if (Capacitor.isPluginAvailable('StatusBar')) {
    try {
      await StatusBar.setStyle({ style: StatusBarStyle.Light });
      await StatusBar.hide();
    } catch (error) {
      Logger.error('Error setting StatusBar', error);
    }
  }
}
