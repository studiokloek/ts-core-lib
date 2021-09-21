
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


export * from './info';
export * from './is-reloaded';
