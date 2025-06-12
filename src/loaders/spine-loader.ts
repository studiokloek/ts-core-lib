import { last, split } from 'lodash';
import { Loader, Texture } from 'pixi.js';
import { AssetLoaderInterface } from '.';
import { CoreLibraryOptions, getAppVersion, isApp } from '../';
import { getLogger } from '../logger';
import { determineResolution } from '../screen';
import { SkeletonData } from 'pixi-spine';

const Logger = getLogger('loader > spine');

export interface SpineAsset {
  id: string;
  skeleton: SkeletonData;
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
  assetDirectory?: string;
  numberOfParts?: number;
}

export class SpineLoader implements AssetLoaderInterface {
  private options: SpineLoaderOptions;
  private loader: Loader;
  private baseUrl!: string;

  private _data?: SpineAsset;
  private loadUrl!: string;

  private isLoading: boolean;

  isLoaded: boolean;
  private loadedResolver!: (value: any | undefined) => void;

  constructor(_options: SpineLoaderOptions) {
    this.options = {
      assetDirectory: `${CoreLibraryOptions.ASSET_BASE_PATH}`,
      numberOfParts: 1,
      ..._options,
    };

    this.loader = new Loader();

    if (!isApp()) {
      this.loader.defaultQueryString = getAppVersion();
    }

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

  private getTextureExtension(): string {
    const { texture: textureResolution } = determineResolution();
    return textureResolution >= 2 ? '@2x' : '';
  }

  prepareForLoad(): Promise<void> {
    return new Promise((resolve) => {
      this.loadedResolver = resolve;
    });
  }

  async load(): Promise<SpineAsset | void> {
    if (this.isLoading) {
      Logger.error('Already loading...');

      return;
    }

    if (this.isLoaded) {
      Logger.debug('Already loaded...');
      this.loadedResolver(this._data);

      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    // url bepalen we hier omdat de resolutie veranderd zou kunnen zijn
    const resolutionExtension = this.getTextureExtension();

    this.loadUrl = `${this.baseUrl}${resolutionExtension}`;
    this.loader.add(`${this.loadUrl}.json`);

    return new Promise((resolve) => {
      this.loader.load((_loader: Loader, _resources: any) => {
        // this.loader.removeAllListeners();

        const resource = _resources ? _resources[`${this.loadUrl}.json`] : undefined;

        if (!resource) {
          Logger.error(`Error accessing resource in loader... url[${this.loadUrl}]`);
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

  unload(): void {
    // reset loader
    this.loader.reset();

    this.removeTextureFromCache(`${this.loadUrl}.png`);

    this.isLoaded = false;
    this.isLoading = false;

    this._data = undefined;
  }

  private removeTextureFromCache(textureId: string): void {
    const texture = Texture.removeFromCache(textureId);

    if (texture) {
      texture.destroy(true);
    }
  }

  get data(): SpineAsset | undefined {
    return this._data;
  }

  get type(): string {
    return 'spine';
  }

  get assetId(): string | undefined {
    return this.options.assetId;
  }
}

export function createSpineLoader(asset: SpineAssetInfo): SpineLoader {
  const loader = new SpineLoader({
    assetId: asset.id,
    assetName: asset.fileName,
    assetDirectory: `${CoreLibraryOptions.ASSET_BASE_PATH}spine/`,
    numberOfParts: asset.numberOfParts,
  });

  return loader;
}
