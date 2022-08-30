const mediaQuery = (v: number): string => {
  return `(-webkit-min-device-pixel-ratio: ${v}),(min--moz-device-pixel-ratio: ${v}),(min-resolution: ${v}dppx)`;
};

let maximumMatchingSize = 0;
for (let index = 5 * 100; index >= 0.5 * 100; index -= 0.05 * 100) {
  if (window.matchMedia(mediaQuery(index / 100)).matches) {
    maximumMatchingSize = index / 100;
    break;
  }
}

export const isZoomed = (): boolean => {
  return window.devicePixelRatio === undefined ? false : Number.parseFloat(`${window.devicePixelRatio}`) !== Number.parseFloat(`${maximumMatchingSize}`);
};

export const getPixelRatio = (): number => {
  return maximumMatchingSize || window.devicePixelRatio;
};
