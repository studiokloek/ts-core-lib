import { filter, find, isNil, remove, round } from 'lodash-es';
import { Texture } from 'pixi.js';
import { SyncEvent } from 'ts-events';
import { getLogger } from '../logger';
import { SoundLibraryItem } from '../media';
import type { FontAsset, FontAssetInfo } from './font-loader';
import { createFontLoader } from './font-loader';
import type { SoundsAssetInfo } from './sounds-loader';
import { createSoundsLoader } from './sounds-loader';
import type { SpineAsset, SpineAssetInfo } from './spine-loader';
import { createSpineLoader } from './spine-loader';
import type { SpriteAssetInfo } from './sprites-loader';
import { createSpriteLoader } from './sprites-loader';

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
  sprites?: SpriteAssetInfo[] | (() => SpriteAssetInfo[]);
  fonts?: FontAssetInfo[] | (() => FontAssetInfo[]);
  sounds?: SoundsAssetInfo[] | (() => SoundsAssetInfo[]);
  spine?: SpineAssetInfo[] | (() => SpineAssetInfo[]);
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
  private allLoadedPromises: Promise<void>[] = [];
  private dynamicLoaders: AssetLoaderInterface[] = [];
  private dynamicAssets: (() => AssetLoaderInfo[])[] = [];
  private loaders: AssetLoaderInterface[] = [];
  private queue: AssetLoaderInterface[] = [];

  progressed: SyncEvent<number> = new SyncEvent();
  loaded: SyncEvent<void> = new SyncEvent();

  constructor(assets?: LoaderAssets, options?: LoaderOptions) {
    this.assets = { ...DefaultLoaderAssets, ...assets };
    this.options = { ...DefaultLoaderOptions, ...options };
  }

  private initAssets(): void {
    // already init-ed?
    if (this.assetsInited === true) {
      // add dynamic assets again
      for (const asset of this.dynamicAssets) this.addAsset(asset);
      return;
    }

    this.addAsset(this.assets.fonts);
    this.addAsset(this.assets.spine);
    this.addAsset(this.assets.sounds);
    this.addAsset(this.assets.sprites);

    this.assetsInited = true;
  }

  addAsset(asset: AssetLoaderInfo[] | (() => AssetLoaderInfo[]) | AssetLoaderInfo | undefined, isDynamic = false): void {
    if (typeof asset === 'function') {
      // save dynamic asset callbacks for next time
      if (this.assetsInited !== true) {
        this.dynamicAssets.push(asset);
      }

      // call & add assets
      for (const _asset of asset() as AssetLoaderInfo[]) this.addAsset(_asset, true);

      return;
    }

    if (Array.isArray(asset)) {
      for (const _asset of asset) this.addAsset(_asset);

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

      if (isDynamic) {
        this.dynamicLoaders.push(loader);
      }
    }
  }

  async load(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.isLoading) {
      await this.checkLoadDone();
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

    const concurrent = this.options.maxConcurrent || 1;

    this.allLoadedPromises = this.loaders.map((loader) => loader.prepareForLoad());

    for (let index = 0; index < concurrent; index++) {
      this.loadNext();
    }

    await this.checkLoadDone();
  }

  private async checkLoadDone(): Promise<void> {
    await Promise.all(this.allLoadedPromises);

    if (!this.isLoading) {
      return;
    }

    // done loading
    if (!this._isLoaded) {
      this.loaded.post();
    }

    this._isLoaded = true;
    this.isLoading = false;
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

  unload(): void {
    this.isLoading = false;
    this._isLoaded = false;
    this.allLoadedPromises.length = 0;

    for (const loader of this.loaders) {
      loader.unload();
    }

    // remove dynamic ones from list
    remove(this.loaders, (loader) => this.dynamicLoaders.includes(loader));
    this.dynamicLoaders.length = 0;
  }

  get id(): string | undefined {
    return this.options.id;
  }

  get isLoaded(): boolean {
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
