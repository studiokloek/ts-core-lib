import { Howl } from 'howler';
import type { HowlOptions } from 'howler';
import { pull } from 'lodash';
import { isApp } from '../../device';
import { SoundAsset } from '../../loaders';
import { CoreLibraryOptions } from '../../';

// const Logger = getLogger('core > sounds > library > item');
export interface SoundLibraryItemOptions {
  buffer: boolean;
}

export class SoundLibraryItem {
  private asset: SoundAsset;
  private options?: SoundLibraryItemOptions;
  private isLoaded = false;
  private isLoading = false;
  private player?: Howl;
  zones: string[] = [];

  constructor(_asset: SoundAsset, _options: SoundLibraryItemOptions) {
    this.asset = _asset;
    this.options = _options;
  }

  async load(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (!this.player) {
      this.player = this.createPlayer();
    }

    // inladen
    return new Promise((resolve) => {
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
    const file = `${CoreLibraryOptions.ASSET_BASE_PATH}sounds/${this.asset.id}`,
      source = isApp() ? [`${file}.m4a`] : [`${file}.m4a`, `${file}.ogg`, `${file}.mp3`]; // app gebruikt alleen m4a

    // opties
    const options: HowlOptions = {
      // eslint-disable-next-line unicorn/prevent-abbreviations
      src: source,
      autoplay: false,
      preload: false,
      loop: false,
      html5: this.options?.buffer ?? false,
      volume: 0.5,

      // we maken een main sprite aan, zodat we goed kunnen loopen
      // zie ook https://github.com/goldfire/howler.js/issues/360
      sprite: {
        main: [0, Math.round(this.asset.duration * 1000)],
      },
    };

    // maak nieuwe howl aan
    const player = new Howl(options);

    // bind methods for delays
    player.play = player.play.bind(player);
    player.stop = player.stop.bind(player);

    return player;
  }

  unload(): void {
    if (!this.player) {
      return;
    }

    this.isLoaded = false;

    // niet meer aan het spelen?
    if (this.player.playing()) {
      this.player.off('fade');

      this.player.fade(this.player.volume(), 0, 250);

      this.player.off('load');
      this.player.off('end');
      this.player.off('play');

      this.player.once('fade', () => {
        this.dispose();
      });
    } else {
      this.dispose();
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

  get id(): string {
    return this.asset.id;
  }

  get isBuffered(): boolean {
    return this.options?.buffer === true;
  }

  getPlayer(): Howl | undefined {
    return this.player;
  }

  addToZone(_zone: string): void {
    if (!this.zones.includes(_zone)) {
      this.zones.push(_zone);
    }
  }

  removeFromZone(_zone: string): void {
    pull(this.zones, _zone);
  }

  isInZone(_zone: string): boolean {
    return this.zones.includes(_zone);
  }

  hasZone(): boolean {
    return this.zones.length > 0;
  }
}
