import { set, get } from 'lodash';

/**
 * Geeft `true` terug als de pagina opnieuw geladen is (dus al eerder in dezelfde sessie geopend was).
 */
export function isReloadedPage(): boolean {
  return get(window, 'APP.inited', false);
}

window.addEventListener('beforeunload', () => {
  set(window, 'APP.inited', true);
});
