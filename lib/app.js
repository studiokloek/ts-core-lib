import { set, get } from 'lodash-es';
export function isReloadedPage() {
    return get(window, 'APP.inited', false);
}
window.addEventListener('beforeunload', () => {
    set(window, 'APP.inited', true);
});
//# sourceMappingURL=app.js.map