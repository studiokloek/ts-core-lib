import { last, split } from 'lodash-es';
import { Texture, Loader } from 'pixi.js-legacy';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { determineResolution } from '@studiokloek/kloek-ts-core/screen';
const Logger = getLogger('loader > spine');
export function isSpineAsset(_info) {
    return _info.skeleton !== undefined;
}
const OptionDefaults = {
    assetDirectory: './assets/',
    numberOfParts: 1,
};
export class SpineLoader {
    constructor(_options) {
        this.options = { ...OptionDefaults, ..._options };
        this.loader = new Loader();
        // this.loader.defaultQueryString = Settings.version ? Settings.version : '';
        this.isLoaded = false;
        this.isLoading = false;
        this.setBaseUrl();
    }
    setBaseUrl() {
        if (!this.options.assetName) {
            Logger.error('No asset name provided.', this.options);
            return;
        }
        const spineName = last(split(this.options.assetName, '/'));
        this.baseUrl = `${this.options.assetDirectory}${this.options.assetName}/${spineName}`;
    }
    getTextureExtention() {
        const { texture: textureResolution } = determineResolution();
        return textureResolution >= 2 ? '@2x' : '';
    }
    prepareForLoad() {
        return new Promise(resolve => {
            this.loadedResolver = resolve;
        });
    }
    async load() {
        if (this.isLoading) {
            Logger.error('Already loading...');
            return;
        }
        this.isLoaded = false;
        this.isLoading = true;
        // url bepalen we hier omdat de resolutie veranderd zou kunnen zijn
        const resolutionExtension = this.getTextureExtention();
        this.loadUrl = `${this.baseUrl}${resolutionExtension}`;
        this.loader.add(`${this.loadUrl}.json`);
        return new Promise(resolve => {
            this.loader.load((_loader, _resources) => {
                this.loader.removeAllListeners();
                const resource = _resources ? _resources[`${this.loadUrl}.json`] : null;
                if (!resource) {
                    Logger.error('Error accessing resource in loader...');
                    return resolve();
                }
                this._data = {
                    id: this.options.assetId || 'unknown',
                    skeleton: resource.spineData,
                };
                // reset loader
                this.loader.reset();
                // laat weten dat we klaar zijn
                this.isLoaded = true;
                this.isLoading = false;
                this.loadedResolver(this._data);
                resolve(this._data);
            });
        });
    }
    unload() {
        // reset loader
        this.loader.reset();
        this.removeTextureFromCache(`${this.loadUrl}.png`);
        this.isLoaded = false;
        this.isLoading = false;
        this._data = undefined;
    }
    removeTextureFromCache(textureId) {
        const texture = Texture.removeFromCache(textureId);
        Logger.debug(textureId, texture);
        if (texture) {
            texture.destroy(true);
        }
    }
    get data() {
        return this._data;
    }
    get type() {
        return 'spine';
    }
    get assetId() {
        return this.options.assetId;
    }
}
export function createSpineLoader(asset) {
    const loader = new SpineLoader({
        assetId: asset.id,
        assetName: asset.fileName,
        assetDirectory: './assets/spine/',
        numberOfParts: asset.numberOfParts,
    });
    return loader;
}
//# sourceMappingURL=spine-loader.js.map