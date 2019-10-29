import FontFaceObserver from 'fontfaceobserver';
import { AssetLoaderInterface } from '.';
export interface FontAsset {
    family: string;
    variant?: FontFaceObserver.FontVariant;
}
export declare function isFontAsset(_info: FontAsset): _info is FontAsset;
export interface FontAssetInfo {
    fontFamilyName: string;
    variant?: FontFaceObserver.FontVariant;
    type: string;
}
interface FontLoaderOptions {
    fontFamilyName: string;
    variant?: FontFaceObserver.FontVariant;
}
export declare class FontLoader implements AssetLoaderInterface {
    private _data?;
    private options;
    private loader;
    private isLoading;
    isLoaded: boolean;
    private loadedResolver;
    constructor(_options: FontLoaderOptions);
    prepareForLoad(): Promise<void>;
    load(): Promise<object | void>;
    unload(): void;
    readonly data: FontAsset | undefined;
    readonly type: string;
}
export declare function createFontLoader(asset: FontAssetInfo): FontLoader;
export {};
