import { memoize, isNil } from 'lodash';

export const isInFrame = memoize(() => {
  let inFrame = false;

  try {
    inFrame = isNil(window.frameElement) === false || window.self !== window.top;
  } catch {
    return true;
  }

  return inFrame;
});

export const isLocalhost = memoize(() => {
  const hostname = window.location.hostname;

  return Boolean(
    hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      /^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d{1,2})){3}$/.test(hostname),
  );
});
