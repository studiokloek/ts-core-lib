import { spine } from 'pixi.js-legacy';
import { AssetLoaderInterface } from '.';
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
export declare function isSpineAsset(_info: SpineAsset): _info is SpineAsset;
export interface SpineLoaderOptions {
    assetId?: string;
    assetName?: string;
    assetDirectory: string;
    numberOfParts: number;
}
export declare class SpineLoader implements AssetLoaderInterface {
    private options;
    private loader;
    private baseUrl;
    private _data?;
    private loadUrl;
    private isLoading;
    isLoaded: boolean;
    private loadedResolver;
    constructor(_options: SpineLoaderOptions);
    private setBaseUrl;
    private getTextureExtention;
    prepareForLoad(): Promise<void>;
    load(): Promise<object | undefined>;
    unload(): void;
    private removeTextureFromCache;
    readonly data: SpineAsset | undefined;
    readonly type: string;
    readonly assetId: string | undefined;
}
export declare function createSpineLoader(asset: SpineAssetInfo): SpineLoader;
