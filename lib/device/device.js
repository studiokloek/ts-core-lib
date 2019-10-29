import { Plugins } from '@capacitor/core';
const { Device } = Plugins;
let deviceInfo;
export async function getDeviceInfo() {
    if (deviceInfo) {
        return deviceInfo;
    }
    deviceInfo = await Device.getInfo();
    return deviceInfo;
}
export const isApp = () => {
    return deviceInfo.platform === 'ios' || deviceInfo.platform === 'android';
};
export const Platform = {
    IOS: 'ios',
    ANDROID: 'android',
};
export const isPlatform = (_name) => {
    return deviceInfo.platform === _name;
};
export const getAppVersion = () => {
    if (isApp()) {
        return deviceInfo.appVersion;
    }
    else if (window.APP) {
        return window.APP.version;
    }
    else {
        return 'unknown';
    }
};
//# sourceMappingURL=device.js.map