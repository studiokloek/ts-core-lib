import { App, AppInfo } from '@capacitor/app';
import { AppData } from '.';
import { isApp } from '../device';

let info: AppInfo;
/**
 * Leest de app-informatie (versie, build, enz.) uit voor native apps.
 * Heeft geen effect in een webbrowser.
 */
export async function initAppInfo(): Promise<void> {
  if (!isApp()) {
    return;
  }

  if (info) {
    return;
  }

  info = await App.getInfo();
}

/**
 * Geeft de huidige app-versiestring terug.
 * Voor native apps wordt de ingebouwde versie gebruikt; anders wordt de versie uit `window.APP` gelezen.
 * Geeft `'unknown'` terug als er geen versie beschikbaar is.
 */
export const getAppVersion = (): string => {
  if (info && info.version) {
    return info.version;
  } else if (AppData) {
    const { info } = AppData;
    return info.version ? `${info.version}` : 'unknown';
  }

  return 'unknown';
};
