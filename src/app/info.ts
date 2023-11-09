import { App, AppInfo } from '@capacitor/app';
import { AppData } from '.';
import { isApp } from '../device';

let info: AppInfo;
export async function initAppInfo(): Promise<void> {
  if (!isApp()) {
    return;
  }

  if (info) {
    return;
  }

  info = await App.getInfo();
}

export const getAppVersion = (): string => {
  if (info && info.version) {
    return info.version;
  } else if (AppData) {
    const { info } = AppData;
    return info.version ? `${info.version}` : 'unknown';
  }

  return 'unknown';
};
