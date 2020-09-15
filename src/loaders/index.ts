import { filter, find, isNil, round } from 'lodash-es';
import { Texture } from 'pixi.js-legacy';
import { SyncEvent } from 'ts-events';
import { getLogger } from '../logger';
import { SoundLibraryItem } from '../media';
import { createFontLoader, FontAsset, FontAssetInfo } from './font-loader';
import { createSoundsLoader, SoundsAssetInfo } from './sounds-loader';
import { createSpineLoader, SpineAsset, SpineAssetInfo } from './spine-loader';
import { createSpriteLoader, SpriteAssetInfo } from './sprites-loader';

const Logger = getLogger('loader');

type AssetData = { [key: string]: Texture } | SoundLibraryItem[] | SpineAsset | FontAsset | undefined;

export interface AssetLoaderInterface {
  load(): Promise<unknown | void>;
  unload(): void;
  prepareForLoad(): Promise<void>;
  data: AssetData;
  isLoaded: boolean;
}

export const LoaderAssetTypes = {
  SPRITES: 'sprites',
  FONT: 'font',
  SOUNDS: 'sounds',
  SPINE: 'spine',
};

export type AssetLoaderInfo = SpriteAssetInfo | SoundsAssetInfo | SpineAssetInfo | FontAssetInfo;

export interface LoaderAssets {
  [key: string]: AssetLoaderInfo[];
}

const DefaultLoaderAssets: LoaderAssets = {
  sprites: [],
  fonts: [],
  sounds: [],
  spine: [],
};

export interface LoaderOptions {
  maxConcurrent?: number;
  id?: string;
}

const DefaultLoaderOptions: LoaderOptions = {
  maxConcurrent: 10,
  id: 'default',
};

export * from './font-loader';
export * from './sounds-loader';
export * from './spine-loader';
export * from './sprites-loader';

export class AssetLoader {
  protected assets: LoaderAssets;
  private numberLoaded = 0;
  private isLoading = false;
  private _isLoaded = false;
  private options: LoaderOptions;
  private assetsInited = false;
  private loaders: AssetLoaderInterface[] = [];
  private queue: AssetLoaderInterface[] = [];

  public progressed: SyncEvent<number> = new SyncEvent();
  public loaded: SyncEvent<void> = new SyncEvent();

  public constructor(assets?: LoaderAssets, options?: LoaderOptions) {
    this.assets = { ...DefaultLoaderAssets, ...assets };
    this.options = { ...DefaultLoaderOptions, ...options };
  }

  private initAssets(): void {
    if (this.assetsInited === true) {
      return;
    }

    this.addAsset(this.assets.fonts);
    this.addAsset(this.assets.spine);
    this.addAsset(this.assets.sounds);
    this.addAsset(this.assets.sprites);

    this.assetsInited = true;
  }

  public addAsset(asset: AssetLoaderInfo[] | AssetLoaderInfo | undefined): void {
    if (Array.isArray(asset)) {
      asset.map((_asset) => this.addAsset(_asset));

      return;
    }

    if (isNil(asset)) {
      return;
    }

    let loader: AssetLoaderInterface | undefined;

    Logger.debug(`Adding asset of type '${asset.type}'...`);

    switch (asset.type) {
      case LoaderAssetTypes.SPRITES:
        loader = createSpriteLoader(asset as SpriteAssetInfo);
        break;
      case LoaderAssetTypes.FONT:
        loader = createFontLoader(asset as FontAssetInfo);
        break;
      case LoaderAssetTypes.SPINE:
        loader = createSpineLoader(asset as SpineAssetInfo);
        break;
      case LoaderAssetTypes.SOUNDS:
        loader = createSoundsLoader(asset as SoundsAssetInfo);
        break;
    }

    if (loader) {
      this.loaders.push(loader);
    }
  }

  public async load(): Promise<void> {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this._isLoaded = false;
    this.isLoading = true;
    this.numberLoaded = 0;

    this.initAssets();

    // iets gevonden om te laden?
    if (this.loaders.length === 0) {
      return;
    }

    // maak copy van loaders die we gaan inladen
    this.queue = [...this.loaders];

    const concurrent = this.options.maxConcurrent || 1,
      allLoadedPromises = this.loaders.map((loader) => loader.prepareForLoad());

    for (let i = 0; i < concurrent; i++) {
      this.loadNext();
    }

    await Promise.all(allLoadedPromises);

    // done loading
    this.loaded.post();
    this.isLoading = false;
    this._isLoaded = true;
  }

  private async loadNext(): Promise<void> {
    const loader = this.queue.pop();

    if (loader) {
      await loader.load();
      this.checkReady();
    }
  }

  private checkReady(): void {
    this.numberLoaded++;

    // progress event
    const progress = 100 * round(this.numberLoaded / this.loaders.length, 2);
    this.progressed.post(progress);

    for (const loader of this.loaders) {
      if (!loader.isLoaded) {
        this.loadNext();
        return;
      }
    }
  }

  public unload(): void {
    for (const loader of this.loaders) {
      loader.unload();
    }
    this.isLoading = false;
    this._isLoaded = false;
  }

  public get id(): string | undefined {
    return this.options.id;
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  protected getLoaderData(_type: string, _pattern: Record<string, unknown>): AssetData {
    // haal alle loaders op van dit type
    const typeLoaders = filter(this.loaders, { type: _type });

    // zoek degene die voldoet
    const loader = find(typeLoaders, { ..._pattern }) as AssetLoaderInterface;

    return loader ? loader.data : undefined;
  }
}
