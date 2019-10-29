import { concat, last, merge, split } from 'lodash-es';
import { Loader, Texture } from 'pixi.js-legacy';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { determineResolution } from '@studiokloek/kloek-ts-core/screen';
const Logger = getLogger('loader > sprite');
export function isSpriteAsset(_info) {
    return _info.id !== undefined;
}
const OptionDefaults = {
    assetDirectory: './assets/',
    numberOfParts: 1,
};
export class SpriteLoader {
    constructor(_options) {
        this.options = { ...OptionDefaults, ..._options };
        this.loader = new Loader();
        this.loader.onError.add((loader, resource) => {
            console.error('error loading', loader, resource);
        });
        // this.loader.defaultQueryString = Settings.version ? Settings.version : '';
        this.isLoaded = false;
        this.isLoading = false;
        this.textures = {};
        this.textureIndex = [];
        this.loadUrlIndex = [];
        this.setBaseUrl();
    }
    setBaseUrl() {
        if (!this.options.assetName) {
            Logger.error('No asset name provided.', this.options);
            return;
        }
        const spriteName = last(split(this.options.assetName, '/'));
        this.baseUrl = `${this.options.assetDirectory}${this.options.assetName}/${spriteName}`;
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
        for (let i = 1; i <= this.options.numberOfParts; i++) {
            const url = `${this.baseUrl}-${String(i) + resolutionExtension}`;
            this.loadUrlIndex.push(url);
            this.loader.add(`${url}.json`);
        }
        return new Promise(resolve => {
            this.loader.load((_loader, _resources) => {
                this.loader.removeAllListeners();
                for (const loadUrl of this.loadUrlIndex) {
                    const resource = _resources ? _resources[`${loadUrl}.json`] : null;
                    if (!resource) {
                        Logger.error('Error accessing resource in loader...');
                        continue;
                    }
                    const textures = resource.textures || {}, frames = resource && resource.data ? resource.data.frames : {};
                    this.textures = merge(this.textures, textures);
                    this.textureIndex = concat(this.textureIndex, Object.keys(frames));
                }
                // reset loader
                this.loader.reset();
                // laat weten dat we klaar zijn
                this.isLoaded = true;
                this.isLoading = false;
                Logger.info(`Loaded '${this.options.assetName}'`);
                this.loadedResolver(this.textures);
                resolve(this.textures);
            });
        });
    }
    unload() {
        // reset loader
        this.loader.reset();
        for (const textureId of this.textureIndex) {
            this.removeTextureFromCache(textureId);
        }
        for (const loadUrl of this.loadUrlIndex) {
            this.removeTextureFromCache(`${loadUrl}.json_image`);
        }
        this.isLoaded = false;
        this.isLoading = false;
        this.textures = {};
        this.textureIndex = [];
        this.loadUrlIndex = [];
    }
    removeTextureFromCache(textureId) {
        const texture = Texture.removeFromCache(textureId);
        if (texture) {
            texture.destroy(true);
        }
    }
    // TODO implement assetyype
    get data() {
        return this.textures;
    }
    get type() {
        return 'sprites';
    }
}
export function createSpriteLoader(assetInfo) {
    const loader = new SpriteLoader({
        assetName: assetInfo.fileName,
        assetDirectory: './assets/sprites/',
        numberOfParts: assetInfo.numberOfParts,
    });
    return loader;
}
//# sourceMappingURL=sprites-loader.js.map