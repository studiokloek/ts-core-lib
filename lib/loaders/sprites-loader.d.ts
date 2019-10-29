import { Texture } from 'pixi.js-legacy';
import { AssetLoaderInterface } from '.';
export declare function isSpriteAsset(_info: SpriteAsset): _info is SpriteAsset;
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
export declare class SpriteLoader implements AssetLoaderInterface {
    private options;
    private loader;
    private baseUrl;
    private textures;
    private textureIndex;
    private loadUrlIndex;
    private isLoading;
    isLoaded: boolean;
    private loadedResolver;
    constructor(_options: SpriteLoaderOptions);
    private setBaseUrl;
    private getTextureExtention;
    prepareForLoad(): Promise<void>;
    load(): Promise<object | undefined>;
    unload(): void;
    private removeTextureFromCache;
    readonly data: {
        [key: string]: Texture;
    };
    readonly type: string;
}
export declare function createSpriteLoader(assetInfo: SpriteAssetInfo): SpriteLoader;
export {};
