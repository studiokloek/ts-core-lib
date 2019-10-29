import { Texture } from 'pixi.js-legacy';
import { SyncEvent } from 'ts-events';
import { SpineAsset, SpineAssetInfo } from '@studiokloek/kloek-ts-core/loaders/spine-loader';
import { SpriteAssetInfo } from '@studiokloek/kloek-ts-core/loaders/sprites-loader';
import { SoundsAssetInfo } from '@studiokloek/kloek-ts-core/loaders/sounds-loader';
import { FontAsset, FontAssetInfo } from './font-loader';
import { SoundLibraryItem } from '@studiokloek/kloek-ts-core/media/sounds';
declare type AssetData = {
    [key: string]: Texture;
} | SoundLibraryItem[] | SpineAsset | FontAsset | undefined;
export interface AssetLoaderInterface {
    load(): Promise<object | void>;
    unload(): void;
    prepareForLoad(): Promise<void>;
    data: AssetData;
    isLoaded: boolean;
}
export declare const LoaderAssetTypes: {
    SPRITES: string;
    FONT: string;
    SOUNDS: string;
    SPINE: string;
};
declare type AssetLoaderInfo = SpriteAssetInfo | SoundsAssetInfo | SpineAssetInfo | FontAssetInfo;
export interface LoaderAssets {
    [key: string]: AssetLoaderInfo[];
}
export interface LoaderOptions {
    maxConcurrent?: number;
    id?: string;
}
export declare class AssetLoader {
    protected assets: LoaderAssets;
    private numberLoaded;
    private isLoading;
    private options;
    private assetsInited;
    private loaders;
    private queue;
    progressed: SyncEvent<number>;
    loaded: SyncEvent<void>;
    constructor(assets?: LoaderAssets, options?: LoaderOptions);
    private initAssets;
    addAsset(asset: AssetLoaderInfo[] | AssetLoaderInfo | undefined): void;
    load(): Promise<void>;
    private loadNext;
    private checkReady;
    unload(): void;
    readonly id: string | undefined;
    protected getLoaderData(_type: string, _pattern: object): AssetData;
}
export {};
