import { memoize } from 'lodash-es';

export const isInFrame = memoize(() => {
  let inFrame = false;

  try {
    inFrame = window.frameElement !== undefined || window.self !== window.top;
  } catch (error) {
    return true;
  }

  return inFrame;
});
