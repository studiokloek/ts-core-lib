import { interaction } from 'pixi.js-legacy';
import { fixEventNames } from './events';

// TOUCH EVENTS
export const TouchEvent: { [key: string]: interaction.InteractionEventTypes } = {
  TAP: 'pointertap',
  START: 'pointerdown',
  END: 'pointerup',
  END_OUTSIDE: 'pointerupoutside',
  MOVE: 'pointermove',
  OVER: 'pointerover',
  OUT: 'pointerout',
};

// APP EVENTS
export const AppEvent = {
  RESIZED: 'resized',
  DEBUG_VALUE: 'debug_value',
  READY: 'ready',
  LOAD_COMPLETE: 'load_complete',
  LOAD_PROGRESS: 'loaded_progress',
  ENABLE_INTERACTION: 'enable_interaction',
  DISABLE_INTERACTION: 'disable_interaction',
  STATE_ACTIVE: 'state_active',
  STATE_INACTIVE: 'state_inactive',
  NETWORK_ONLINE: 'network_online',
  NETWORK_OFFLINE: 'network_offline',
};
fixEventNames(AppEvent, 'app');

// INFO OVERLAY EVENTS
export const InfoOverlayEvent = {
  SHOW: 'show',
  SHOWN: 'shown',
  HIDE: 'hide',
  HIDDEN: 'hidden',
};
fixEventNames(AppEvent, 'info-overlay');
