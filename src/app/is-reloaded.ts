import { set, get } from 'lodash';

export function isReloadedPage(): boolean {
  return get(window, 'APP.inited', false);
}

window.addEventListener('beforeunload', () => {
  set(window, 'APP.inited', true);
});
