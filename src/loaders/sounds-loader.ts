import { SoundLibrary, SoundLibraryItem } from '../media';

SoundLibraryItem;

import { merge, isObject } from 'lodash-es';
import { AssetLoaderInterface } from '.';
import { getLogger } from '../logger';
import { CoreDebug } from '../debug';

const Logger = getLogger('loader > sounds ');

export interface SoundAsset {
  id: string;
  duration: number;
  name: string;
}

export interface SoundAssetList {
  [key: string]: SoundAsset | { [key: string]: SoundAssetList };
}

export function isSoundAsset(_info: SoundAsset): _info is SoundAsset {
  return _info && (_info as SoundAsset).duration !== undefined && (_info as SoundAsset).id !== undefined;
}

export interface SoundsAssetInfo {
  assets: SoundAssetList;
  assetName: string;
  numberOfSounds: number;
  type: string;
}

interface SoundsLoaderOptions {
  assets: SoundAssetList;
  assetName: string;
  numberOfSounds: number;
}

export class SoundsLoader implements AssetLoaderInterface {
  private options: SoundsLoaderOptions;

  private soundsToLoad: SoundAsset[] = [];
  private numberDoneLoading: number;
  private numberToLoad: number;

  private isLoading: boolean;
  public isLoaded: boolean;

  private _loadedResolver!: (value?: any) => void;

  public constructor(_options: SoundsLoaderOptions) {
    this.options = { ..._options };

    this.numberDoneLoading = 0;
    this.numberToLoad = 0;

    this.isLoaded = false;
    this.isLoading = false;
  }

  public prepareForLoad(): Promise<void> {
    return new Promise((resolve) => {
      this._loadedResolver = resolve;
    });
  }

  public async load(): Promise<void> {
    if (this.isLoading) {
      Logger.error('Already loading...');
      return;
    }

    if (this.isLoaded) {
      Logger.info('Already loaded...');
      this.resolveLoaded();
      return;
    }

    // geluid uit?
    if (CoreDebug.disableSounds()) {
      this.resolveLoaded();
      return;
    }

    // zijn er uberhaupt assets om in te laden?
    if (!this.options.assets) {
      this.resolveLoaded();
      return;
    }

    this.numberDoneLoading = 0;
    this.soundsToLoad = this.getSoundsToLoad(this.options.assets);
    this.numberToLoad = this.soundsToLoad.length;

    this.isLoaded = false;
    this.isLoading = true;

    Logger.debug(`Start loading #${this.numberToLoad} sounds for '${this.options.assetName}'`);

    // max 8 tegelijkertijd inladen?
    for (let i = 0; i < 8; i++) {
      this.preloadNextSoundAsset();
    }

    if (!this._loadedResolver) {
      return this.prepareForLoad();
    }
  }

  private async preloadNextSoundAsset(): Promise<void> {
    if (!this.isLoading || this.soundsToLoad.length === 0) {
      this.resolveLoaded();
      return;
    }

    const asset = this.soundsToLoad.pop() as SoundAsset;

    await SoundLibrary.load(asset, this.options.assetName);

    this.numberDoneLoading++;

    if (this.numberDoneLoading < this.numberToLoad) {
      this.preloadNextSoundAsset();
    } else {
      Logger.info(`Loaded '${this.options.assetName}' sounds`);
      this.isLoaded = true;
      this.resolveLoaded();
    }
  }

  private getSoundsToLoad(_data: SoundAssetList): SoundAsset[] {
    const sounds: SoundAsset[] = [];

    for (const index in _data) {
      const value = _data[index];

      if (!isObject(value)) {
        continue;
      }

      if (isSoundAsset(value as SoundAsset)) {
        sounds.push(value as SoundAsset);
      } else {
        merge(sounds, this.getSoundsToLoad(value as SoundAssetList));
      }
    }

    return sounds;
  }

  public unload(): void {
    const sounds = this.getSoundsToLoad(this.options.assets);

    Logger.debug(`Un-loading #${sounds.length} sounds for '${this.options.assetName}'`);

    for (const item of sounds) {
      SoundLibrary.unload(item, this.options.assetName);
    }

    Logger.info(`Un-loaded '${this.options.assetName}'`);

    this.soundsToLoad.length = 0;
    this.isLoaded = false;
    this.isLoading = false;
  }

  private resolveLoaded(): void {
    if (this._loadedResolver) {
      this._loadedResolver(this.data);
    }
  }

  public get data(): SoundLibraryItem[] {
    return SoundLibrary.getZoneSounds(this.options.assetName);
  }

  public get type(): string {
    return 'sounds';
  }
}

export function createSoundsLoader(assetInfo: SoundsAssetInfo): SoundsLoader {
  const loader = new SoundsLoader({
    assets: assetInfo.assets,
    assetName: assetInfo.assetName,
    numberOfSounds: assetInfo.numberOfSounds,
  });

  return loader;
}
