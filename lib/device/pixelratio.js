const mediaQuery = (v) => {
    return `(-webkit-min-device-pixel-ratio: ${v}),(min--moz-device-pixel-ratio: ${v}),(min-resolution: ${v}dppx)`;
};
let maximumMatchingSize = 0;
for (let i = 5 * 100; i >= 0.5 * 100; i -= 0.05 * 100) {
    if (window.matchMedia(mediaQuery(i / 100)).matches) {
        maximumMatchingSize = i / 100;
        break;
    }
}
export const isZoomed = () => {
    return window.devicePixelRatio === undefined ? false : parseFloat(`${window.devicePixelRatio}`) !== parseFloat(`${maximumMatchingSize}`);
};
export const getPixelRatio = () => {
    return maximumMatchingSize || window.devicePixelRatio;
};
//# sourceMappingURL=pixelratio.js.map