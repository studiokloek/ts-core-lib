import { concat, last, merge, split } from 'lodash-es';
import { Loader, Texture } from 'pixi.js';
import { AssetLoaderInterface } from '.';
import { getLogger } from '../logger';
import { Stage } from '../screen';
import { CoreLibraryOptions, getAppVersion, isApp } from '..';

const Logger = getLogger('loader > sprite');

export interface SpriteAsset {
  id: string;
  width: number;
  height: number;
}

export interface SpriteAssetWithMeta extends SpriteAsset {
  x: number;
  y: number;
  zIndex: number;
  opacity: number;
}

export function isSpriteAsset(_info: SpriteAsset): _info is SpriteAsset {
  return _info && (_info as SpriteAsset).id !== undefined;
}

export function isSpriteAssetWithMeta(_info: SpriteAsset | SpriteAssetWithMeta): _info is SpriteAssetWithMeta {
  return isSpriteAsset(_info) && (_info as SpriteAssetWithMeta).zIndex !== undefined;
}

export interface SpriteAssetList {
  [key: string]: SpriteAsset | SpriteAssetList;
}

export interface SpriteAssetInfo {
  assets: SpriteAssetList;
  fileName: string;
  numberOfParts: number;
  type: string;
  resolution?: number;
}

interface SpriteLoaderOptions {
  assetName?: string;
  assetDirectory: string;
  numberOfParts: number;
  resolution?: number;
}

export class SpriteLoader implements AssetLoaderInterface {
  private options: SpriteLoaderOptions;

  private loader: Loader;

  private baseUrl!: string;
  private textures: { [key: string]: Texture };
  private textureIndex: string[];
  private loadUrlIndex: string[];

  private isLoading: boolean;
  public isLoaded: boolean;

  private loadedResolver!: (value: any | undefined) => void;

  public constructor(_options: SpriteLoaderOptions) {
    this.options = {
      ..._options,
    };

    this.loader = new Loader();
    this.loader.onError.add((loader, resource) => {
      Logger.error('error loading', loader, resource);
    });

    if (!isApp()) {
      this.loader.defaultQueryString = getAppVersion();
    }

    this.isLoaded = false;
    this.isLoading = false;

    this.textures = {};
    this.textureIndex = [];
    this.loadUrlIndex = [];

    this.setBaseUrl();
  }

  private setBaseUrl(): void {
    if (!this.options.assetName) {
      Logger.error('No asset name provided.', this.options);

      return;
    }

    const spriteName = last(split(this.options.assetName, '/'));
    this.baseUrl = `${this.options.assetDirectory}${this.options.assetName}/${spriteName}`;
  }

  private getTextureExtention(): string {
    let textureResolution = 1;

    textureResolution = typeof this.options.resolution === 'number' ? this.options.resolution : Stage.textureResolution;

    return textureResolution >= 2 ? '@2x' : '';
  }

  public prepareForLoad(): Promise<void> {
    return new Promise((resolve) => {
      this.loadedResolver = resolve;
    });
  }

  public async load(): Promise<{ [key: string]: Texture } | undefined> {
    if (this.isLoading) {
      Logger.error('Already loading...');
      return;
    }

    if (this.isLoaded) {
      Logger.debug('Already loaded...');
      this.loadedResolver(this.textures);
      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    // url bepalen we hier omdat de resolutie veranderd zou kunnen zijn
    const resolutionExtension = this.getTextureExtention();

    const numberOfParts = this.options.numberOfParts;
    for (let index = 1; index <= numberOfParts; index++) {
      const url = `${this.baseUrl}-${String(index) + resolutionExtension}`;
      this.loadUrlIndex.push(url);
      this.loader.add(`${url}.json`);
    }

    return new Promise((resolve) => {
      this.loader.load((_loader, _resources) => {
        //this.loader.removeAllListeners();

        for (const loadUrl of this.loadUrlIndex) {
          const resource = _resources ? _resources[`${loadUrl}.json`] : undefined;

          if (!resource) {
            Logger.error('Error accessing resource in loader...');
            continue;
          }

          const textures = resource.textures || {},
            frames = resource && resource.data ? resource.data.frames : {};

          this.textures = merge(this.textures, textures);
          this.textureIndex = concat(this.textureIndex, Object.keys(frames));
        }

        // reset loader
        this.loader.reset();

        // laat weten dat we klaar zijn
        this.isLoaded = true;
        this.isLoading = false;

        Logger.debug(`Loaded textures for '${this.options.assetName}'`);

        this.loadedResolver(this.textures);

        resolve(this.textures);
      });
    });
  }

  public unload(): void {
    // reset loader
    this.loader.reset();

    for (const textureId of this.textureIndex) {
      this.removeTextureFromCache(textureId);
    }

    for (const loadUrl of this.loadUrlIndex) {
      this.removeTextureFromCache(`${loadUrl}.json_image`);
    }

    this.isLoaded = false;
    this.isLoading = false;

    this.textures = {};
    this.textureIndex = [];
    this.loadUrlIndex = [];

    Logger.debug(`Un-loaded texture from '${this.options.assetName}'`);
  }

  private removeTextureFromCache(textureId: string): void {
    const texture = Texture.removeFromCache(textureId);

    if (texture) {
      texture.destroy(true);
    }
  }

  // TODO implement assetyype
  public get data(): { [key: string]: Texture } {
    return this.textures;
  }

  public get type(): string {
    return 'sprites';
  }
}

export function createSpriteLoader(assetInfo: SpriteAssetInfo): SpriteLoader {
  const loader = new SpriteLoader({
    assetName: assetInfo.fileName,
    assetDirectory: `${CoreLibraryOptions.ASSET_BASE_PATH}sprites/`,
    numberOfParts: assetInfo.numberOfParts,
    resolution: assetInfo.resolution,
  });

  return loader;
}
