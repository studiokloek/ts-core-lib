import { App, AppInfo } from '@capacitor/app';


let info: AppInfo
export async function initAppInfo(): Promise<AppInfo> {
  if (info) {
    return info;
  }

  info = await App.getInfo();

  return info;
}

export const getAppVersion = (): string => {
  if (info && info.version) {
    return info.version;
  } else if (window.APP) {
    return window.APP.version;
  } else {
    return 'unknown';
  }
};