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

/** Geeft `true` terug als de browser momenteel is ingezoomd, door `window.devicePixelRatio` te vergelijken met de hardware-pixelverhouding die via media queries is vastgesteld. */
export const isZoomed = (): boolean => {
  return window.devicePixelRatio === undefined ? false : Number.parseFloat(`${window.devicePixelRatio}`) !== Number.parseFloat(`${maximumMatchingSize}`);
};

/** Geeft de werkelijke hardware-pixelverhouding van het scherm terug, bepaald bij opstarten via CSS media queries. Valt terug op `window.devicePixelRatio` als er geen media query overeenkomt. */
export const getPixelRatio = (): number => {
  return maximumMatchingSize || window.devicePixelRatio;
};
