/**
 * Het globale `window.APP`-instellingenobject dat in de HTML-pagina staat.
 * Bevat de naam, versie en weergaveopties van de app.
 */
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

/** De globale app-instellingen uit `window.APP`: versie, id en weergaveopties. */
export const AppData = window.APP as AppSettings;

export * from './info';
export * from './is-reloaded';
