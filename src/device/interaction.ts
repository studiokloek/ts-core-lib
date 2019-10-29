import { isMobile } from './browser';
import { memoize } from 'lodash-es';

export const supportsTouch = memoize((): boolean => {
  const isTouch =
    'ontouchstart' in window ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch);

  return isTouch;
});

export const supportsOnlyTouch = memoize((): boolean => {
  return isMobile() && supportsTouch();
});
