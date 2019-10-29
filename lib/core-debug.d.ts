export interface CoreDebugSettings {
    minLogLevel: string;
    globalTimescale: number;
    showStats: boolean;
    forceLowResolution: boolean;
    disableSounds: boolean;
    skipMediaTrigger: boolean;
}
export declare function setCoreDebugSettings(_settings: CoreDebugSettings): void;
export declare const CoreDebug: {
    isEnabled(): boolean;
    skipMediaTrigger(): boolean;
    disableSounds(): boolean;
    forceLowResolution(): boolean;
    getLogLevel(): number;
    getGlobalTimescale(): number;
    showStats(): boolean;
};
