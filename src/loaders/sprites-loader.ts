import { concat, last, merge, split } from 'lodash-es';
import { Loader, Texture, LoaderResource } from 'pixi.js-legacy';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { determineResolution } from '@studiokloek/kloek-ts-core/screen';
import { AssetLoaderInterface } from '.';

const Logger = getLogger('loader > sprite');

export function isSpriteAsset(_info: SpriteAsset): _info is SpriteAsset {
  return (_info as SpriteAsset).id !== undefined;
}

export interface SpriteAsset {
  id: string;
  width: number;
  height: number;
}

export interface SpriteAssetInfo {
  assets: object;
  fileName: string;
  numberOfParts: number;
  type: string;
}

interface SpriteLoaderOptions {
  assetName?: string;
  assetDirectory: string;
  numberOfParts: number;
}

const OptionDefaults: SpriteLoaderOptions = {
  assetDirectory: './assets/',
  numberOfParts: 1,
};

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
    this.options = { ...OptionDefaults, ..._options };

    this.loader = new Loader();
    this.loader.onError.add((loader: Loader, resource: LoaderResource) => {
      console.error('error loading', loader, resource);
    });

    // this.loader.defaultQueryString = Settings.version ? Settings.version : '';

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
    const { texture: textureResolution } = determineResolution();
    return textureResolution >= 2 ? '@2x' : '';
  }

  public prepareForLoad(): Promise<void> {
    return new Promise(resolve => {
      this.loadedResolver = resolve;
    });
  }

  public async load(): Promise<object | undefined> {
    if (this.isLoading) {
      Logger.error('Already loading...');
      return;
    }

    this.isLoaded = false;
    this.isLoading = true;

    // url bepalen we hier omdat de resolutie veranderd zou kunnen zijn
    const resolutionExtension = this.getTextureExtention();

    for (let i = 1; i <= this.options.numberOfParts; i++) {
      const url = `${this.baseUrl}-${String(i) + resolutionExtension}`;
      this.loadUrlIndex.push(url);
      this.loader.add(`${url}.json`);
    }

    return new Promise(resolve => {
      this.loader.load((_loader, _resources) => {
        this.loader.removeAllListeners();

        for (const loadUrl of this.loadUrlIndex) {
          const resource = _resources ? _resources[`${loadUrl}.json`] : null;

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

        Logger.info(`Loaded '${this.options.assetName}'`);

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
    assetDirectory: './assets/sprites/',
    numberOfParts: assetInfo.numberOfParts,
  });

  return loader;
}
