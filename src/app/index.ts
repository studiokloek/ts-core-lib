interface AppSettings {
  inited: boolean;

  info: {
    id: string;
    page?: string;
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

export const AppData = window.APP as AppSettings;

export * from './info';
export * from './is-reloaded';
