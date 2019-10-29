import { get, memoize } from 'lodash-es';
import { isMobile } from '@studiokloek/kloek-ts-core';

export const getViewportSize = memoize(() => {
  let viewportSize = 0;
  // bepaal size op basis van hele scherm
  if (isMobile()) {
    viewportSize = Math.max(window.screen.availHeight, window.screen.availWidth);
  } else {
    const topWindow = get(global, 'window.top', window),
      width = Math.max(get(topWindow, 'document.documentElement.clientWidth', 0), topWindow.innerWidth || 0),
      height = Math.max(get(topWindow, 'document.documentElement.clientHeight', 0), topWindow.innerHeight || 0);
    viewportSize = Math.max(width, height);
  }
  return viewportSize;
});
