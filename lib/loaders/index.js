import { filter, find, isNil, round } from 'lodash-es';
import { SyncEvent } from 'ts-events';
import { createSpineLoader } from '@studiokloek/kloek-ts-core/loaders/spine-loader';
import { createSpriteLoader } from '@studiokloek/kloek-ts-core/loaders/sprites-loader';
import { createSoundsLoader } from '@studiokloek/kloek-ts-core/loaders/sounds-loader';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { createFontLoader } from './font-loader';
const Logger = getLogger('loader');
export const LoaderAssetTypes = {
    SPRITES: 'sprites',
    FONT: 'font',
    SOUNDS: 'sounds',
    SPINE: 'spine',
};
const DefaultLoaderAssets = {
    sprites: [],
    fonts: [],
    sounds: [],
    spine: [],
};
const DefaultLoaderOptions = {
    maxConcurrent: 10,
    id: 'default',
};
export class AssetLoader {
    constructor(assets, options) {
        this.numberLoaded = 0;
        this.isLoading = false;
        this.assetsInited = false;
        this.loaders = [];
        this.queue = [];
        this.progressed = new SyncEvent();
        this.loaded = new SyncEvent();
        this.assets = { ...DefaultLoaderAssets, ...assets };
        this.options = { ...DefaultLoaderOptions, ...options };
    }
    initAssets() {
        if (this.assetsInited === true) {
            return;
        }
        this.addAsset(this.assets.fonts);
        this.addAsset(this.assets.spine);
        this.addAsset(this.assets.sounds);
        this.addAsset(this.assets.sprites);
        this.assetsInited = true;
    }
    addAsset(asset) {
        if (Array.isArray(asset)) {
            asset.map(_asset => this.addAsset(_asset));
            return;
        }
        if (isNil(asset)) {
            return;
        }
        let loader = undefined;
        Logger.debug(`Adding asset of type '${asset.type}'...`);
        switch (asset.type) {
            case LoaderAssetTypes.SPRITES:
                loader = createSpriteLoader(asset);
                break;
            case LoaderAssetTypes.FONT:
                loader = createFontLoader(asset);
                break;
            case LoaderAssetTypes.SPINE:
                loader = createSpineLoader(asset);
                break;
            case LoaderAssetTypes.SOUNDS:
                loader = createSoundsLoader(asset);
                break;
        }
        if (loader) {
            this.loaders.push(loader);
        }
    }
    async load() {
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;
        this.numberLoaded = 0;
        this.initAssets();
        // iets gevonden om te laden?
        if (this.loaders.length === 0) {
            return;
        }
        // maak copy van loaders die we gaan inladen
        this.queue = [...this.loaders];
        const concurrent = this.options.maxConcurrent || 1, allLoadedPromises = this.loaders.map(loader => loader.prepareForLoad());
        for (let i = 0; i < concurrent; i++) {
            this.loadNext();
        }
        await Promise.all(allLoadedPromises);
        // done loading
        this.loaded.post();
        this.isLoading = false;
    }
    async loadNext() {
        const loader = this.queue.pop();
        if (loader) {
            await loader.load();
            this.checkReady();
        }
    }
    checkReady() {
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
    unload() {
        for (const loader of this.loaders) {
            loader.unload();
        }
        this.isLoading = false;
    }
    get id() {
        return this.options.id;
    }
    getLoaderData(_type, _pattern) {
        // haal alle loaders op van dit type
        const typeLoaders = filter(this.loaders, { type: _type });
        // zoek degene die voldoet
        const loader = find(typeLoaders, { ..._pattern });
        return loader ? loader.data : undefined;
    }
}
//# sourceMappingURL=index.js.map