import { Howl, Howler } from 'howler';
import { Bind } from 'lodash-decorators-esm';
import { round } from 'lodash';
import { Delayed } from '../../delay';
import { SoundAsset } from '../../loaders';
import { Stage } from '../../screen';
import { Easing, Tween } from '../../tween';
import { KloekRandom } from '../../util';
import { SoundLibrary } from './library';

// we regelen zelf suspend
Howler.autoSuspend = false;

export interface AudioFXOptions {
  loop?: boolean;
  rate?: number;
  ignoreTimeScale?: boolean;
  fade?: number;
  randomStart?: boolean;
  position?: number;
}

class ConcreteSoundsPlayer {
  private volumeFader = {
    value: 1,
  };

  private playingSounds: { [key: number]: Howl } = {};
  private delayedCalls: Map<SoundAsset, Record<number, gsap.core.Tween | undefined>> = new Map();

  play(asset: SoundAsset, volume = -1, delay = 0, options?: AudioFXOptions): number | undefined {
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
      // delayed call
      const delayedCall = Delayed.call(this.doPlay, delay, [player, id, volume, options]);

      // haal bestaande op in lijst
      const list = this.delayedCalls.get(asset) ?? {};
      list[id] = delayedCall;

      // bewaar
      this.delayedCalls.set(asset, list);
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
      // of juist starten op random positie
      const position = round(KloekRandom.real(0, player.duration() * 0.9), 2);
      player.seek(position, id);
    }

    // snelheid meegegeven, of anders snelheid van de main ticker
    const timeScale = options?.ignoreTimeScale ? 1 : Stage.timeScale;
    if (options?.rate) {
      player.rate(options.rate * timeScale, id);
    } else {
      player.rate(timeScale, id);
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

  stop(asset: SoundAsset, optionsOrId?: AudioFXOptions | number, id?: number): void {
    const item = SoundLibrary.getItemByAsset(asset);

    if (!item) {
      return;
    }

    const player = item.getPlayer();

    if (!player) {
      return;
    }

    let options;
    if (typeof optionsOrId === 'number') {
      id = options;
    } else {
      options = optionsOrId;
    }

    // kill juiste delayed calls
    const delayedCallList = this.delayedCalls.get(asset) ?? {};

    // als er een specifieke is meegegeven, stoppen we alleen die audio
    if (id) {
      delayedCallList[id]?.kill();
    } else {
      // anders alle andere en dus ook die delays
      for (const delayedCall of Object.values(delayedCallList)) {
        delayedCall?.kill();
      }
    }

    if (options && options.fade && options.fade > 0) {
      player.once('fade', (id) => player.stop(id));
      const volume = id ? (player.volume(id) as number) : player.volume();
      player.fade(volume, 0, options.fade * 1000, id);
    } else {
      player.stop(id);
    }
  }

  pause(asset: SoundAsset, options?: AudioFXOptions, id?: number): void {
    const item = SoundLibrary.getItemByAsset(asset);

    if (!item) {
      return;
    }

    const player = item.getPlayer();

    if (!player) {
      return;
    }

    // kill juiste delayed calls
    const delayedCallList = this.delayedCalls.get(asset) ?? {};

    // als er een specifieke is meegegeven, stoppen we alleen die audio
    if (id) {
      delayedCallList[id]?.kill();
    } else {
      // anders alle andere en dus ook die delays
      for (const delayedCall of Object.values(delayedCallList)) {
        delayedCall?.kill();
      }
    }

    const volume = id ? (player.volume(id) as number) : player.volume();
    if (options && options.fade && options.fade > 0) {
      player.once('fade', (id) => {
        // pause
        player.pause(id);

        // reset volume zodat we die bij resume weer kunnen opvragen
        player.volume(volume, id);
      });
      player.fade(volume, 0, options.fade * 1000, id);
    } else {
      player.pause(id);
    }
  }

  resume(asset: SoundAsset, id: number, options?: AudioFXOptions): void {
    const item = SoundLibrary.getItemByAsset(asset);

    if (!item) {
      return;
    }

    const player = item.getPlayer();

    if (!player) {
      return;
    }

    if (options && options.fade && options.fade > 0) {
      const volume = player.volume(id) as number;
      player.volume(0, id);
      player.fade(volume, 0, options.fade * 1000, id);
    }

    player.play(id);
  }

  resumeAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.play(Number.parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  pauseAll(): void {
    for (const id in this.playingSounds) {
      const player = this.playingSounds[id];
      if (player.state() === 'loaded') {
        player.pause(Number.parseInt(id));
      } else {
        delete this.playingSounds[id];
      }
    }
  }

  fadeTo(value = 1, duration = 1, asset?: SoundAsset, id?: number): void {
    if (asset) {
      const item = SoundLibrary.getItemByAsset(asset);

      if (!item) {
        return;
      }

      const player = item.getPlayer();

      if (!player) {
        return;
      }

      let volume: number;

      if (typeof id === 'number') {
        volume = player.volume(id) as number;
        player.volume(0, id);
      } else {
        volume = player.volume();
        player.volume(0);
      }

      player.fade(volume, value, duration * 1000, id);
    } else {
      Tween.killTweensOf(this.volumeFader);
      this.volumeFader.value = Howler.volume();
      Tween.to(this.volumeFader, duration, { value, ease: Easing.Linear.easeNone, onUpdate: this.fadeAllUpdater });
    }
  }

  @Bind
  private fadeAllUpdater(): void {
    Howler.volume(this.volumeFader.value);
  }

  setVolume(_value: number): void {
    Howler.volume(_value);
  }

  // before webview pause，suspend the AudioContext
  async suspendContext(): Promise<void> {
    const { ctx } = Howler;
    if (ctx && ctx.state === 'running') {
      try {
        await ctx.suspend();
      } catch { }
    }

    this.pauseAll();
    this.setVolume(0);
  }

  // after webview resumes，manually resume the AudioContext
  async resumeContext(): Promise<void> {
    const { ctx } = Howler;
    if (ctx && ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch { }
    }
    this.fadeTo(1, 0.3);
    this.resumeAll();
  }
}

export const AudioFX = new ConcreteSoundsPlayer();
