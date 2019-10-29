import { SoundLibraryItem } from '@studiokloek/kloek-ts-core/media/sounds';
import { AssetLoaderInterface } from '.';
export interface SoundAsset {
    id: string;
    duration: number;
    name: string;
}
export interface SoundAssetList {
    [key: string]: SoundAsset | {
        [key: string]: SoundAssetList;
    };
}
export declare function isSoundAsset(_info: SoundAsset): _info is SoundAsset;
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
export declare class SoundsLoader implements AssetLoaderInterface {
    private options;
    private soundsToLoad;
    private numberDoneLoading;
    private numberToLoad;
    private isLoading;
    isLoaded: boolean;
    private loadedResolver;
    constructor(_options: SoundsLoaderOptions);
    prepareForLoad(): Promise<void>;
    load(): Promise<object | void>;
    private preloadNextSoundAsset;
    private getSoundsToLoad;
    unload(): void;
    readonly data: SoundLibraryItem[];
    readonly type: string;
}
export declare function createSoundsLoader(assetInfo: SoundsAssetInfo): SoundsLoader;
export {};
