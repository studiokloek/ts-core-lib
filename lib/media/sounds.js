var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Howl } from 'howler';
import { Bind } from 'lodash-decorators';
import { filter, find, pull, round } from 'lodash-es';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { Random } from '@studiokloek/kloek-ts-core/random';
import { Stage } from '@studiokloek/kloek-ts-core/screen';
import { Delayed } from '@studiokloek/kloek-ts-core/ticker';
import { Linear, Tween } from '@studiokloek/kloek-ts-core/tween';
const Logger = getLogger('sounds');
export class SoundLibraryItem {
    constructor(_asset) {
        this.isLoaded = false;
        this.isLoading = false;
        this.zones = [];
        this.asset = _asset;
    }
    async load() {
        if (this.isLoaded || this.isLoading) {
            return;
        }
        this.isLoading = true;
        if (!this.player) {
            this.player = this.createPlayer();
        }
        // inladen
        return new Promise(resolve => {
            if (this.player) {
                this.player.once('load', () => {
                    this.isLoaded = true;
                    this.isLoading = false;
                    resolve();
                });
                this.player.load();
            }
        });
    }
    createPlayer() {
        const file = `./assets/sounds/${this.asset.id}`, source = [`${file}.mp3`]; //, `${file}.ogg`
        // opties
        const options = {
            // eslint-disable-next-line unicorn/prevent-abbreviations
            src: source,
            autoplay: false,
            preload: false,
            loop: false,
            volume: 0.5,
        };
        // maak nieuwe howl aan
        const player = new Howl(options);
        // bind methods for delays
        player.play = player.play.bind(player);
        player.stop = player.stop.bind(player);
        return player;
    }
    unload() {
        if (!this.player) {
            return;
        }
        this.isLoaded = false;
        // niet meer aan het spelen?
        if (!this.player.playing()) {
            this.dispose();
        }
        else {
            this.player.off('fade');
            this.player.fade(this.player.volume(), 0, 250);
            this.player.off('load');
            this.player.off('end');
            this.player.off('play');
            this.player.once('fade', () => {
                this.dispose();
            });
        }
    }
    dispose() {
        if (!this.player) {
            return;
        }
        this.player.off('load');
        this.player.off('end');
        this.player.off('play');
        this.player.off('fade');
        this.player.unload();
        this.player = undefined;
        this.isLoaded = false;
    }
    get id() {
        return this.asset.id;
    }
    getPlayer() {
        return this.player;
    }
    addToZone(_zone) {
        if (!this.zones.includes(_zone)) {
            this.zones.push(_zone);
        }
    }
    removeFromZone(_zone) {
        pull(this.zones, _zone);
    }
    isInZone(_zone) {
        return this.zones.includes(_zone);
    }
    hasZone() {
        return this.zones.length > 0;
    }
}
class ConcreteSoundsLibrary {
    constructor() {
        this.items = [];
    }
    async load(asset, zone = 'generic') {
        // bestaat deze al?
        let item = this.getItemByAsset(asset);
        if (!item) {
            // nog niet, aanmaken
            item = new SoundLibraryItem(asset);
            this.items.push(item);
        }
        item.addToZone(zone);
        await item.load();
        Logger.debug('Loaded', `${zone}/${asset.name}`);
        return item;
    }
    unload(asset, zone = 'generic') {
        const item = this.getItemByAsset(asset);
        if (!item) {
            return false;
        }
        item.removeFromZone(zone);
        if (!item.hasZone()) {
            item.unload();
            pull(this.items, item);
            Logger.debug('Un-loaded', `${zone}/${asset.name}`);
        }
        return true;
    }
    getItemByAsset(_asset) {
        return find(this.items, { id: _asset.id });
    }
    getZoneSounds(_zone) {
        return filter(this.items, item => item.isInZone(_zone));
    }
}
export const SoundLibrary = new ConcreteSoundsLibrary();
class ConcreteSoundsPlayer {
    constructor() {
        this.volumeFader = {
            value: 1,
        };
        this.playingSounds = {};
    }
    play(asset, volume = -1, delay = 0, options) {
        const item = SoundLibrary.getItemByAsset(asset);
        if (!item) {
            return;
        }
        const player = item.getPlayer();
        if (!player) {
            return;
        }
        const id = player.play();
        player.volume(0, id);
        player.once('play', () => this.registerPlayer(player, id), id);
        player.once('end', () => this.unregisterPlayer(player, id), id);
        player.once('stop', () => this.unregisterPlayer(player, id), id);
        if (options) {
            player.loop(options.loop || false, id);
            // snelheid meegegeven, of anders snelheid van de mainticker
            const rate = options.rate ? options.rate * Stage.timeScale : Stage.timeScale;
            player.rate(rate, id);
            if (options.randomStart === true) {
                const postition = round(Random.real(0, player.duration() * 0.9), 2);
                player.seek(postition, id);
            }
            if (options.position) {
                player.seek(options.position, id);
            }
        }
        else {
            // snelheid meegegeven
            player.rate(Stage.timeScale, id);
        }
        // fade?
        const targetVolume = volume === -1 ? 0.5 : volume;
        if (options && options.fade) {
            player.fade(0, targetVolume, options.fade * 1000, id);
        }
        else {
            player.volume(targetVolume, id);
        }
        // delay?
        // TODO fix/check delayed fade
        if (delay > 0) {
            player.pause();
            Delayed.call(player.play, delay, [id]);
        }
        return id;
    }
    registerPlayer(player, id) {
        this.playingSounds[id] = player;
    }
    unregisterPlayer(player, id) {
        delete this.playingSounds[id];
        player.off('play', undefined, id);
        player.off('end', undefined, id);
        player.off('stop', undefined, id);
    }
    stop(asset, options, id) {
        const item = SoundLibrary.getItemByAsset(asset);
        if (!item) {
            return;
        }
        const player = item.getPlayer();
        if (!player) {
            return;
        }
        // als er geen specifieke is meegegeven, stoppen we alle audio, dus dan ook alle delays
        if (!id) {
            Delayed.kill(player.play);
        }
        if (options && options.fade && options.fade > 0) {
            player.once('fade', () => {
                player.stop(id);
            }, id);
            player.fade(player.volume(), 0, options.fade * 1000, id);
        }
        else {
            player.stop(id);
        }
    }
    resumeAll() {
        for (const id in this.playingSounds) {
            const player = this.playingSounds[id];
            if (player.state() === 'loaded') {
                player.play(parseInt(id));
            }
            else {
                delete this.playingSounds[id];
            }
        }
    }
    pauseAll() {
        for (const id in this.playingSounds) {
            const player = this.playingSounds[id];
            if (player.state() === 'loaded') {
                player.pause(parseInt(id));
            }
            else {
                delete this.playingSounds[id];
            }
        }
    }
    fadeAllTo(target = 1, duration = 1) {
        Tween.killTweensOf(this.volumeFader);
        this.volumeFader.value = Howler.volume();
        Tween.to(this.volumeFader, duration, { value: target, ease: Linear.easeNone, onUpdate: this.fadeAllUpdater });
    }
    fadeAllUpdater() {
        Howler.volume(this.volumeFader.value);
    }
    setVolume(_value) {
        Howler.volume(_value);
    }
}
__decorate([
    Bind
], ConcreteSoundsPlayer.prototype, "fadeAllUpdater", null);
export const AudioFX = new ConcreteSoundsPlayer();
//# sourceMappingURL=sounds.js.map