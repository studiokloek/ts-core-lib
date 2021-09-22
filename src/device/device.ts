import { Capacitor } from '@capacitor/core';
import { Device, DeviceId, DeviceInfo } from '@capacitor/device';

let info: DeviceInfo, id: DeviceId;

export async function initDeviceInfo(): Promise<void> {
  if (info) {
    return;
  }

  info = await Device.getInfo();
  id = await Device.getId();
}

export const isApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getDeviceId = (): string => {
  return `${info.platform}-${id.uuid}`;
};

export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
};

const platform = Capacitor.getPlatform();
export const isPlatform = (_name: string): boolean => {
  if (platform === 'web') {
    return info.operatingSystem === _name;
  }
  return platform === _name;
};
