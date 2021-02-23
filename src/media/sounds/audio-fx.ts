import { Bind } from 'lodash-decorators';
import { round } from 'lodash-es';
import { Delayed } from '../../delay';
import { SoundAsset } from '../../loaders';
import { Stage } from '../../screen';
import { Tween, Easing } from '../../tween';
import { KloekRandom } from '../../util';
import { SoundLibrary } from './library';
import { Howler, Howl } from 'howler';

// we regelen zelf suspend
Howler.autoSuspend = false;

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

    // spelen de main sprite af
    const id = player.play('main');

    player.volume(0, id);

    player.once('play', () => this.registerPlayer(player, id), id);
    player.once('end', () => this.unregisterPlayer(player, id), id);
    player.once('stop', () => this.unregisterPlayer(player, id), id);

    player.pause(id);

    // delay?
    if (delay > 0) {
      Delayed.call(this.doPlay, delay, [player, id, volume, options]);
    } else {
      this.doPlay(player, id, volume, options);
    }

    return id;
  }

  @Bind
  private doPlay(player: Howl, id: number, volume = -1, options?: AudioFXOptions): void {
    // in loop afspelen?
    player.loop(options?.loop ?? false, id);

    // op positie starten??
    if (options?.position) {
      player.seek(options.position, id);
    } else if (options?.randomStart === true) {
      // of juisxt starten op random positie
      const postition = round(KloekRandom.real(0, player.duration() * 0.9), 2);
      player.seek(postition, id);
    }

    // snelheid meegegeven, of anders snelheid van de mainticker
    if (options?.rate) {
      player.rate(options.rate * Stage.timeScale, id);
    } else {
      player.rate(Stage.timeScale, id);
    }

    // infaden van volume?
    const targetVolume = volume === -1 ? 0.5 : volume;
    if (options?.fade) {
      player.once('fade', (id) => player.volume(targetVolume, id));
      player.fade(0, targetVolume, options.fade * 1000, id);
    } else {
      player.volume(targetVolume, id);
    }

    player.play(id);
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
      Delayed.kill(this.doPlay);
    }

    if (options && options.fade && options.fade > 0) {
      player.once('fade', (id) => player.stop(id));
      const volume = id ? (player.volume(id) as number) : player.volume();
      player.fade(volume, 0, options.fade * 1000, id);
    } else {
      player.stop(id);
    }
  }

  public resumeAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.play(Number.parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  public pauseAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.pause(Number.parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  public fadeAllTo(target = 1, duration = 1): void {
    Tween.killTweensOf(this.volumeFader);
    this.volumeFader.value = Howler.volume();
    Tween.to(this.volumeFader, duration, { value: target, ease: Easing.Linear.easeNone, onUpdate: this.fadeAllUpdater });
  }

  @Bind
  private fadeAllUpdater(): void {
    Howler.volume(this.volumeFader.value);
  }

  public setVolume(_value: number): void {
    Howler.volume(_value);
  }

  // before webview pause，suspend the AudioContext
  public async suspendContext(): Promise<void> {
    const { ctx } = Howler;
    if (ctx && ctx.state === 'running') {
      try {
        await ctx.suspend();
      } catch {}
    }

    this.pauseAll();
    this.setVolume(0);
  }

  // after webview resumes，manually resume the AudioContext
  public async resumeContext(): Promise<void> {
    const { ctx } = Howler;
    if (ctx && ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch {}
    }
    this.fadeAllTo(1, 0.3);
    this.resumeAll();
  }
}

export const AudioFX = new ConcreteSoundsPlayer();
