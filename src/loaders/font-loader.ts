import FontFaceObserver from 'fontfaceobserver';
import { getLogger, squashForLog } from '@studiokloek/kloek-ts-core';
import { AssetLoaderInterface } from '.';

const Logger = getLogger('loader > font');

export interface FontAsset {
  family: string;
  variant?: FontFaceObserver.FontVariant;
}

export function isFontAsset(_info: FontAsset): _info is FontAsset {
  return (_info as FontAsset).family !== undefined;
}

export interface FontAssetInfo {
  fontFamilyName: string;
  variant?: FontFaceObserver.FontVariant;
  type: string;
}

interface FontLoaderOptions {
  fontFamilyName: string;
  variant?: FontFaceObserver.FontVariant;
}

export class FontLoader implements AssetLoaderInterface {
  private _data?: FontAsset;
  private options: FontLoaderOptions;
  private loader: FontFaceObserver;
  private isLoading: boolean;
  public isLoaded: boolean;

  private loadedResolver!: (value?: any) => void;

  public constructor(_options: FontLoaderOptions) {
    this.options = { ..._options };

    this.loader = new FontFaceObserver(this.options.fontFamilyName, this.options.variant);
    // this.loader.defaultQueryString = Settings.version ? Settings.version : '';

    this.isLoaded = false;
    this.isLoading = false;
  }

  public prepareForLoad(): Promise<void> {
    return new Promise(resolve => {
      this.loadedResolver = resolve;
    });
  }

  public async load(): Promise<object | void> {
    if (this.isLoading) {
      Logger.error('Already loading...');

      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    try {
      await this.loader.load();
    } catch (error) {
      Logger.error(`Error loading '${this.options.fontFamilyName}'`);
    }

    this._data = {
      family: this.options.fontFamilyName,
      variant: this.options.variant,
    };

    this.isLoading = false;
    Logger.info(`Loaded '${this.options.fontFamilyName}' variant '${squashForLog(this.options.variant)}'`);

    this.loadedResolver();
  }

  public unload(): void {
    this.isLoaded = false;
    this.isLoading = false;
  }

  public get data(): FontAsset | undefined {
    return this._data;
  }

  public get type(): string {
    return 'font';
  }
}

export function createFontLoader(asset: FontAssetInfo): FontLoader {
  const loader = new FontLoader({
    fontFamilyName: asset.fontFamilyName,
    variant: asset.variant,
  });

  return loader;
}
