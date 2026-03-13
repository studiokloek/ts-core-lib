import { isMobile } from '../device/browser';
import { get, memoize } from 'lodash';

/** Geeft de grootste afmeting (breedte of hoogte) van de bruikbare viewport terug. Op mobiel wordt `screen.avail*` gebruikt; op desktop de clientafmetingen van het bovenste venster. Resultaat wordt opgeslagen via memoize. */
export const getViewportSize = memoize(() => {
  let viewportSize = 0;
  // bepaal size op basis van hele scherm
  if (isMobile()) {
    viewportSize = Math.max(window.screen.availHeight, window.screen.availWidth);
  } else {
    const topWindow = get(window, 'top', window),
      width = Math.max(get(topWindow, 'document.documentElement.clientWidth', 0), topWindow?.innerWidth || 0),
      height = Math.max(get(topWindow, 'document.documentElement.clientHeight', 0), topWindow?.innerHeight || 0);
    viewportSize = Math.max(width, height);
  }
  return viewportSize;
});

/** Geeft de grootste waarde van de beschikbare schermhoogte of -breedte terug (fysieke schermgrootte). Wordt gebruikt om de basisgrootte voor resolutieberekeningen te bepalen. Resultaat wordt opgeslagen via memoize. */
export const getScreenSize = memoize(() => {
  return Math.max(window.screen.availHeight, window.screen.availWidth);
});
