
import { DeviceInfo, Plugins } from '@capacitor/core';

const { Device } = Plugins;

let deviceInfo: DeviceInfo;
export async function getDeviceInfo(): Promise<DeviceInfo> {
  if (deviceInfo) {
    return deviceInfo;
  }

  deviceInfo = await Device.getInfo();

  return deviceInfo;
}

export const isApp = (): boolean => {
  return deviceInfo.platform === 'ios' || deviceInfo.platform === 'android';
};

export const getDeviceId = (): string => {
  return `${deviceInfo.platform}-${deviceInfo.uuid}`;
};

export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
};

export const isPlatform = (_name: string): boolean => {
  if (deviceInfo.platform === 'web') {
    return deviceInfo.operatingSystem === _name;
  }
  return deviceInfo.platform === _name;
};

export const getAppVersion = (): string => {
  if (isApp()) {
    return deviceInfo.appVersion;
  } else if (window.APP) {
    return window.APP.version;
  } else {
    return 'unknown';
  }
};
