import { memoize, isNil } from 'lodash-es';

export const isInFrame = memoize(() => {
  let inFrame = false;

  try {
    inFrame = isNil(window.frameElement) === false || window.self !== window.top;
  } catch {
    return true;
  }

  return inFrame;
});
