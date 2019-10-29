import { Delayed, getLogger, Linear, Random, SoundAsset, Stage, Tween } from '@studiokloek/ts-core-lib';
import { Howl } from 'howler';
import { Bind } from 'lodash-decorators';
import { filter, find, pull, round } from 'lodash-es';

const Logger = getLogger('sounds');

export class SoundLibraryItem {
  private asset: SoundAsset;
  private isLoaded = false;
  private isLoading = false;
  private player?: Howl;
  public zones: string[] = [];

  public constructor(_asset: SoundAsset) {
    this.asset = _asset;
  }

  public async load(): Promise<void> {
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

  private createPlayer(): Howl {
    const file = `./assets/sounds/${this.asset.id}`,
      source = [`${file}.mp3`]; //, `${file}.ogg`

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

  public unload(): void {
    if (!this.player) {
      return;
    }

    this.isLoaded = false;

    // niet meer aan het spelen?
    if (!this.player.playing()) {
      this.dispose();
    } else {
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

  private dispose(): void {
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

  public get id(): string {
    return this.asset.id;
  }

  public getPlayer(): Howl | undefined {
    return this.player;
  }

  public addToZone(_zone: string): void {
    if (!this.zones.includes(_zone)) {
      this.zones.push(_zone);
    }
  }

  public removeFromZone(_zone: string): void {
    pull(this.zones, _zone);
  }

  public isInZone(_zone: string): boolean {
    return this.zones.includes(_zone);
  }

  public hasZone(): boolean {
    return this.zones.length > 0;
  }
}

class ConcreteSoundsLibrary {
  private items: SoundLibraryItem[] = [];

  public async load(asset: SoundAsset, zone = 'generic'): Promise<SoundLibraryItem> {
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

  public unload(asset: SoundAsset, zone = 'generic'): boolean {
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

  public getItemByAsset(_asset: SoundAsset): SoundLibraryItem {
    return find(this.items, { id: _asset.id }) as SoundLibraryItem;
  }

  public getZoneSounds(_zone: string): SoundLibraryItem[] {
    return filter(this.items, item => item.isInZone(_zone));
  }
}

export const SoundLibrary = new ConcreteSoundsLibrary();

export interface AudioFXOptions {
  loop?: boolean;
  rate?: number;
  fade?: number;
  randomStart?: boolean;
  position?: number;
}

class ConcreteSoundsPlayer {
  private volumeFader = {
    value: 1,
  };

  private playingSounds: { [key: number]: Howl } = {};

  public play(asset: SoundAsset, volume = -1, delay = 0, options?: AudioFXOptions): number | undefined {
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
    } else {
      // snelheid meegegeven
      player.rate(Stage.timeScale, id);
    }

    // fade?
    const targetVolume = volume === -1 ? 0.5 : volume;
    if (options && options.fade) {
      player.fade(0, targetVolume, options.fade * 1000, id);
    } else {
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

  private registerPlayer(player: Howl, id: number): void {
    this.playingSounds[id] = player;
  }

  private unregisterPlayer(player: Howl, id: number): void {
    delete this.playingSounds[id];
    player.off('play', undefined, id);
    player.off('end', undefined, id);
    player.off('stop', undefined, id);
  }

  public stop(asset: SoundAsset, options?: AudioFXOptions, id?: number): void {
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
      player.once(
        'fade',
        () => {
          player.stop(id);
        },
        id,
      );
      player.fade(player.volume(), 0, options.fade * 1000, id);
    } else {
      player.stop(id);
    }
  }

  public resumeAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.play(parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  public pauseAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.pause(parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  public fadeAllTo(target = 1, duration = 1): void {
    Tween.killTweensOf(this.volumeFader);
    this.volumeFader.value = Howler.volume();
    Tween.to(this.volumeFader, duration, { value: target, ease: Linear.easeNone, onUpdate: this.fadeAllUpdater });
  }

  @Bind
  private fadeAllUpdater(): void {
    Howler.volume(this.volumeFader.value);
  }

  public setVolume(_value: number): void {
    Howler.volume(_value);
  }
}

export const AudioFX = new ConcreteSoundsPlayer();
