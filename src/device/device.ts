import { Capacitor } from '@capacitor/core';
import { Device, DeviceId, DeviceInfo } from '@capacitor/device';

let info: DeviceInfo, id: DeviceId;

/**
 * Haalt de informatie en het unieke ID van het apparaat op.
 * Moet worden aangeroepen voordat `getDeviceInfo()` of `getDeviceId()` gebruikt worden.
 */
export async function initDeviceInfo(): Promise<void> {
  if (info) {
    return;
  }

  info = await Device.getInfo();
  id = await Device.getId();
}

/** Geeft `true` terug als de app is geïnstalleerd als native app (iOS of Android). */
export const isApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/** Geeft een unieke herkenningsstring voor dit apparaat terug, in de vorm `platform-identifier`. */
export const getDeviceId = (): string => {
  return `${info.platform}-${id.identifier}`;
};

/** Geeft de apparaatdetails terug (platform, OS-versie, model, enz.). */
export const getDeviceInfo = (): DeviceInfo => {
  return info;
};

/** Namen van ondersteunde platformen voor gebruik met `isPlatform()`: `IOS` en `ANDROID`. */
export const Platform = {
  IOS: 'ios',
  ANDROID: 'android',
};

const platform = Capacitor.getPlatform();
/**
 * Geeft `true` terug als het apparaat draait op het opgegeven platform (bijv. `'ios'` of `'android'`).
 */
export const isPlatform = (_name: string): boolean => {
  if (platform === 'web') {
    return info.operatingSystem === _name;
  }
  return platform === _name;
};
