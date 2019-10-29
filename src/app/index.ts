interface AppSettings {
  inited: boolean;
  version: string;
  title: string;
}

declare global {
  interface Window {
    APP?: AppSettings;
  }
}

export * from './is-reloaded';
