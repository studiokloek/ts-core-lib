import { last, split } from 'lodash-es';
import { Loader, spine, Texture } from 'pixi.js-legacy';
import { AssetLoaderInterface } from '.';
import { getLogger } from '../logger';
import { determineResolution } from '../screen';

const Logger = getLogger('loader > spine');

export interface SpineAsset {
  id: string;
  skeleton: spine.core.SkeletonData;
}

export interface SpineAssetInfo {
  id: string;
  fileName: string;
  type: string;
  numberOfParts: number;
}

export function isSpineAsset(_info: SpineAsset): _info is SpineAsset {
  return _info && (_info as SpineAsset).skeleton !== undefined;
}

export interface SpineLoaderOptions {
  assetId?: string;
  assetName?: string;
  assetDirectory: string;
  numberOfParts: number;
}

const OptionDefaults: SpineLoaderOptions = {
  assetDirectory: './assets/',
  numberOfParts: 1,
};

export class SpineLoader implements AssetLoaderInterface {
  private options: SpineLoaderOptions;
  private loader: Loader;
  private baseUrl!: string;

  private _data?: SpineAsset;
  private loadUrl!: string;

  private isLoading: boolean;

  public isLoaded: boolean;
  private loadedResolver!: (value: any | undefined) => void;

  public constructor(_options: SpineLoaderOptions) {
    this.options = { ...OptionDefaults, ..._options };

    this.loader = new Loader();
    // this.loader.defaultQueryString = Settings.version ? Settings.version : '';

    this.isLoaded = false;
    this.isLoading = false;

    this.setBaseUrl();
  }

  private setBaseUrl(): void {
    if (!this.options.assetName) {
      Logger.error('No asset name provided.', this.options);

      return;
    }

    const spineName = last(split(this.options.assetName, '/'));
    this.baseUrl = `${this.options.assetDirectory}${this.options.assetName}/${spineName}`;
  }

  private getTextureExtention(): string {
    const { texture: textureResolution } = determineResolution();
    return textureResolution >= 2 ? '@2x' : '';
  }

  public prepareForLoad(): Promise<void> {
    return new Promise((resolve) => {
      this.loadedResolver = resolve;
    });
  }

  public async load(): Promise<SpineAsset | undefined> {
    if (this.isLoading) {
      Logger.error('Already loading...');

      return;
    }

    if (this.isLoaded) {
      Logger.info('Already loaded...');
      this.loadedResolver(this._data);

      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    // url bepalen we hier omdat de resolutie veranderd zou kunnen zijn
    const resolutionExtension = this.getTextureExtention();

    this.loadUrl = `${this.baseUrl}${resolutionExtension}`;
    this.loader.add(`${this.loadUrl}.json`);

    return new Promise((resolve) => {
      this.loader.load((_loader: Loader, _resources: any) => {
        // this.loader.removeAllListeners();

        const resource = _resources ? _resources[`${this.loadUrl}.json`] : undefined;

        if (!resource) {
          Logger.error('Error accessing resource in loader...');
          return resolve();
        }

        this._data = {
          id: this.options.assetId || 'unknown',
          skeleton: resource.spineData,
        };
        // reset loader
        this.loader.reset();

        // laat weten dat we klaar zijn
        this.isLoaded = true;
        this.isLoading = false;

        this.loadedResolver(this._data);

        resolve(this._data);
      });
    });
  }

  public unload(): void {
    // reset loader
    this.loader.reset();

    this.removeTextureFromCache(`${this.loadUrl}.png`);

    this.isLoaded = false;
    this.isLoading = false;

    this._data = undefined;
  }

  private removeTextureFromCache(textureId: string): void {
    const texture = Texture.removeFromCache(textureId);

    Logger.debug(textureId, texture);

    if (texture) {
      texture.destroy(true);
    }
  }

  public get data(): SpineAsset | undefined {
    return this._data;
  }

  public get type(): string {
    return 'spine';
  }

  public get assetId(): string | undefined {
    return this.options.assetId;
  }
}

export function createSpineLoader(asset: SpineAssetInfo): SpineLoader {
  const loader = new SpineLoader({
    assetId: asset.id,
    assetName: asset.fileName,
    assetDirectory: './assets/spine/',
    numberOfParts: asset.numberOfParts,
  });

  return loader;
}
