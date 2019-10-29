import { merge } from 'lodash-es';
import { isObject } from 'util';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { SoundLibrary, SoundLibraryItem } from '@studiokloek/kloek-ts-core/media/sounds';
import { AssetLoaderInterface } from '.';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';

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
  return (_info as SoundAsset).duration !== undefined && (_info as SoundAsset).id !== undefined;
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

  private loadedResolver!: (value?: any) => void;

  public constructor(_options: SoundsLoaderOptions) {
    this.options = { ..._options };

    this.numberDoneLoading = 0;
    this.numberToLoad = 0;

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

    // geluid uit?
    if (CoreDebug.disableSounds()) {
      this.loadedResolver(this.data);
      return;
    }

    // zijn er uberhaupt assets om in te laden?
    if (!this.options.assets) {
      this.loadedResolver(this.data);
      return;
    }

    this.isLoaded = false;
    this.isLoading = false;

    this.numberDoneLoading = 0;
    this.soundsToLoad = this.getSoundsToLoad(this.options.assets);
    this.numberToLoad = this.soundsToLoad.length;

    this.isLoaded = false;
    this.isLoading = true;

    Logger.debug(`Start loading '${this.numberToLoad}' sounds for '${this.options.assetName}'`);

    // max 4 tegelijkertijd inladen?
    for (let i = 0; i < 4; i++) {
      this.preloadNextSoundAsset();
    }
  }

  private async preloadNextSoundAsset(): Promise<void> {
    if (this.soundsToLoad.length === 0) {
      return;
    }

    const asset = this.soundsToLoad.pop() as SoundAsset;

    await SoundLibrary.load(asset, this.options.assetName);

    this.numberDoneLoading++;

    if (this.numberDoneLoading < this.numberToLoad) {
      this.preloadNextSoundAsset();
    } else {
      Logger.debug(`Done loading '${this.options.assetName}'`);
      this.loadedResolver(this.data);
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

    for (const item of sounds) {
      SoundLibrary.unload(item, this.options.assetName);
    }

    this.isLoaded = false;
    this.isLoading = false;
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
