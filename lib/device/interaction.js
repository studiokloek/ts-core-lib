import { memoize } from 'lodash-es';
import { isMobile } from '@studiokloek/kloek-ts-core/device';
export const supportsTouch = memoize(() => {
    const isTouch = 'ontouchstart' in window ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.DocumentTouch && document instanceof window.DocumentTouch);
    return isTouch;
});
export const supportsOnlyTouch = memoize(() => {
    return isMobile() && supportsTouch();
});
//# sourceMappingURL=interaction.js.map