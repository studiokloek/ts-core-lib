import { round } from 'lodash-es';
const textEncoderSupported = typeof TextEncoder !== 'undefined';
export function stringSizeInKb(_value = '') {
    let size;
    if (textEncoderSupported) {
        size = new TextEncoder().encode(_value).length;
    }
    else {
        size = ~-encodeURI(_value).split(/%..|./).length;
    }
    return round(size * 0.001, 2);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValueFromJSON(source) {
    if (typeof source !== 'string') {
        return source;
    }
    try {
        const value = JSON.parse(source);
        if (value !== undefined) {
            return value;
        }
    }
    catch (error) { }
    return source;
}
//# sourceMappingURL=util.js.map