import { merge } from 'lodash-es';
import { isObject } from 'util';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { SoundLibrary } from '@studiokloek/kloek-ts-core/media/sounds';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
const Logger = getLogger('loader > sounds ');
export function isSoundAsset(_info) {
    return _info.duration !== undefined && _info.id !== undefined;
}
export class SoundsLoader {
    constructor(_options) {
        this.soundsToLoad = [];
        this.options = { ..._options };
        this.numberDoneLoading = 0;
        this.numberToLoad = 0;
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
    async preloadNextSoundAsset() {
        if (this.soundsToLoad.length === 0) {
            return;
        }
        const asset = this.soundsToLoad.pop();
        await SoundLibrary.load(asset, this.options.assetName);
        this.numberDoneLoading++;
        if (this.numberDoneLoading < this.numberToLoad) {
            this.preloadNextSoundAsset();
        }
        else {
            Logger.debug(`Done loading '${this.options.assetName}'`);
            this.loadedResolver(this.data);
        }
    }
    getSoundsToLoad(_data) {
        const sounds = [];
        for (const index in _data) {
            const value = _data[index];
            if (!isObject(value)) {
                continue;
            }
            if (isSoundAsset(value)) {
                sounds.push(value);
            }
            else {
                merge(sounds, this.getSoundsToLoad(value));
            }
        }
        return sounds;
    }
    unload() {
        const sounds = this.getSoundsToLoad(this.options.assets);
        for (const item of sounds) {
            SoundLibrary.unload(item, this.options.assetName);
        }
        this.isLoaded = false;
        this.isLoading = false;
    }
    get data() {
        return SoundLibrary.getZoneSounds(this.options.assetName);
    }
    get type() {
        return 'sounds';
    }
}
export function createSoundsLoader(assetInfo) {
    const loader = new SoundsLoader({
        assets: assetInfo.assets,
        assetName: assetInfo.assetName,
        numberOfSounds: assetInfo.numberOfSounds,
    });
    return loader;
}
//# sourceMappingURL=sounds-loader.js.map