import { set, get } from 'lodash-es';

interface AppSettings {
  title: string;
  version: string;
  inited: boolean;
}

declare global {
  interface Window {
    APP?: AppSettings;
  }
}

export function isReloadedPage(): boolean {
  return get(window, 'APP.inited', false);
}

window.addEventListener('beforeunload', () => {
  set(window, 'APP.inited', true);
});
