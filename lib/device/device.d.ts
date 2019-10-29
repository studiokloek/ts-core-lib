import { DeviceInfo } from '@capacitor/core';
export declare function getDeviceInfo(): Promise<DeviceInfo>;
export declare const isApp: () => boolean;
export declare const Platform: {
    IOS: string;
    ANDROID: string;
};
export declare const isPlatform: (_name: string) => boolean;
export declare const getAppVersion: () => string;
