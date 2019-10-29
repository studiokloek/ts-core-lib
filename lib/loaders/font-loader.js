import FontFaceObserver from 'fontfaceobserver';
import { getLogger, squashForLog } from '@studiokloek/kloek-ts-core/logger';
const Logger = getLogger('loader > font');
export function isFontAsset(_info) {
    return _info.family !== undefined;
}
export class FontLoader {
    constructor(_options) {
        this.options = { ..._options };
        this.loader = new FontFaceObserver(this.options.fontFamilyName, this.options.variant);
        // this.loader.defaultQueryString = Settings.version ? Settings.version : '';
        this.isLoaded = false;
        this.isLoading = false;
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
        try {
            await this.loader.load();
        }
        catch (error) {
            Logger.error(`Error loading '${this.options.fontFamilyName}'`);
        }
        this._data = {
            family: this.options.fontFamilyName,
            variant: this.options.variant,
        };
        this.isLoading = false;
        Logger.info(`Loaded '${this.options.fontFamilyName}' variant '${squashForLog(this.options.variant)}'`);
        this.loadedResolver();
    }
    unload() {
        this.isLoaded = false;
        this.isLoading = false;
    }
    get data() {
        return this._data;
    }
    get type() {
        return 'font';
    }
}
export function createFontLoader(asset) {
    const loader = new FontLoader({
        fontFamilyName: asset.fontFamilyName,
        variant: asset.variant,
    });
    return loader;
}
//# sourceMappingURL=font-loader.js.map