import { interaction } from 'pixi.js-legacy';
export declare const TouchEvent: {
    [key: string]: interaction.InteractionEventTypes;
};
export declare const AppEvent: {
    RESIZED: string;
    DEBUG_VALUE: string;
    READY: string;
    LOAD_COMPLETE: string;
    LOAD_PROGRESS: string;
    ENABLE_INTERACTION: string;
    DISABLE_INTERACTION: string;
    STATE_ACTIVE: string;
    STATE_INACTIVE: string;
    NETWORK_ONLINE: string;
    NETWORK_OFFLINE: string;
};
export declare const InfoOverlayEvent: {
    SHOW: string;
    SHOWN: string;
    HIDE: string;
    HIDDEN: string;
};
