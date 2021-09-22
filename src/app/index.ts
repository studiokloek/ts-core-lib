interface AppSettings {
  inited: boolean;

  info: {
    id: string;
    version: number;
    client: string;
    year: number;
  };

  meta: {
    title: string;
    description: string;
    apptitle: string;
  };

  options: {
    backgroundColor: string;
    orientation: string;
    fullscreen: string;
  };
}

declare global {
  interface Window {
    APP?: AppSettings;
  }
}

export const AppData = global.window.APP as AppSettings;

export * from './info';
export * from './is-reloaded';
