import FontFaceObserver from 'fontfaceobserver';
import { AssetLoaderInterface } from '.';
import { getLogger, squashForLog } from '../logger';

const Logger = getLogger('loader > font');

/** Vertegenwoordigt een succesvol geladen font, met de font-familienaam en een optionele variant. */
export interface FontAsset {
  family: string;
  variant?: FontFaceObserver.FontVariant;
}

/** Controlefunctie: geeft `true` terug als `_info` een `FontAsset` is. */
export function isFontAsset(_info: FontAsset): _info is FontAsset {
  return _info && (_info as FontAsset).family !== undefined;
}

/** Asset-descriptor voor een webfont. Wordt doorgegeven aan `createFontLoader()` of opgenomen in `LoaderAssets.fonts`. */
export interface FontAssetInfo {
  fontFamilyName: string;
  variant?: FontFaceObserver.FontVariant;
  type: string;
}

interface FontLoaderOptions {
  fontFamilyName: string;
  variant?: FontFaceObserver.FontVariant;
}

/**
 * Laadt een webfont en wacht tot het beschikbaar is in de browser.
 * Maak aan via `createFontLoader()`.
 */
export class FontLoader implements AssetLoaderInterface {
  private _data?: FontAsset;
  private options: FontLoaderOptions;
  private loader: FontFaceObserver;
  private isLoading: boolean;
  isLoaded: boolean;

  private loadedResolver!: (value?: any) => void;

  constructor(_options: FontLoaderOptions) {
    this.options = { ..._options };

    this.loader = new FontFaceObserver(this.options.fontFamilyName, this.options.variant);

    this.isLoaded = false;
    this.isLoading = false;
  }

  prepareForLoad(): Promise<void> {
    return new Promise((resolve) => {
      this.loadedResolver = resolve;
    });
  }

  async load(): Promise<void> {
    if (this.isLoading || this.isLoaded) {
      Logger.error('Already loading...');
      return;
    }

    if (this.isLoaded) {
      Logger.debug('Already loaded...');
      this.loadedResolver();
      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    try {
      await this.loader.load();
    } catch {
      Logger.error(`Error loading '${this.options.fontFamilyName}'`);
    }

    this._data = {
      family: this.options.fontFamilyName,
      variant: this.options.variant,
    };

    this.isLoading = false;
    Logger.debug(`Loaded '${this.options.fontFamilyName}' variant '${squashForLog(this.options.variant)}'`);

    this.loadedResolver();
  }

  unload(): void {
    this.isLoaded = false;
    this.isLoading = false;
  }

  get data(): FontAsset | undefined {
    return this._data;
  }

  get type(): string {
    return 'font';
  }
}

/** Maakt een `FontLoader` aan voor het opgegeven font. */
export function createFontLoader(asset: FontAssetInfo): FontLoader {
  const loader = new FontLoader({
    fontFamilyName: asset.fontFamilyName,
    variant: asset.variant,
  });

  return loader;
}
