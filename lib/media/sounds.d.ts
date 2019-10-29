/// <reference types="howler" />
import { SoundAsset } from '@studiokloek/kloek-ts-core/loaders/sounds-loader';
export declare class SoundLibraryItem {
    private asset;
    private isLoaded;
    private isLoading;
    private player?;
    zones: string[];
    constructor(_asset: SoundAsset);
    load(): Promise<void>;
    private createPlayer;
    unload(): void;
    private dispose;
    readonly id: string;
    getPlayer(): Howl | undefined;
    addToZone(_zone: string): void;
    removeFromZone(_zone: string): void;
    isInZone(_zone: string): boolean;
    hasZone(): boolean;
}
declare class ConcreteSoundsLibrary {
    private items;
    load(asset: SoundAsset, zone?: string): Promise<SoundLibraryItem>;
    unload(asset: SoundAsset, zone?: string): boolean;
    getItemByAsset(_asset: SoundAsset): SoundLibraryItem;
    getZoneSounds(_zone: string): SoundLibraryItem[];
}
export declare const SoundLibrary: ConcreteSoundsLibrary;
export interface AudioFXOptions {
    loop?: boolean;
    rate?: number;
    fade?: number;
    randomStart?: boolean;
    position?: number;
}
declare class ConcreteSoundsPlayer {
    private volumeFader;
    private playingSounds;
    play(asset: SoundAsset, volume?: number, delay?: number, options?: AudioFXOptions): number | undefined;
    private registerPlayer;
    private unregisterPlayer;
    stop(asset: SoundAsset, options?: AudioFXOptions, id?: number): void;
    resumeAll(): void;
    pauseAll(): void;
    fadeAllTo(target?: number, duration?: number): void;
    private fadeAllUpdater;
    setVolume(_value: number): void;
}
export declare const AudioFX: ConcreteSoundsPlayer;
export {};
