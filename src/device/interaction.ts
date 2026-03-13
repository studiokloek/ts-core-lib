import { isMobile } from './browser';
import { memoize } from 'lodash';

/** Geeft `true` terug als het apparaat touch-events ondersteunt (`ontouchstart` in window of `DocumentTouch`). Resultaat wordt na de eerste aanroep opgeslagen via memoize. */
export const supportsTouch = memoize((): boolean => {
  const isTouch =
    'ontouchstart' in window ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);

  return isTouch;
});

/** Geeft `true` terug als het apparaat mobiel IS en touch ondersteunt, wat betekent dat touch de enige verwachte invoermethode is. Resultaat wordt na de eerste aanroep opgeslagen via memoize. */
export const supportsOnlyTouch = memoize((): boolean => {
  return isMobile() && supportsTouch();
});
