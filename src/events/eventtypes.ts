import { fixEventNames } from './util';

// TOUCH EVENTS
type TouchEventTypes = 'TAP' | 'START' | 'END' | 'END_OUTSIDE' | 'CANCEL' | 'MOVE' | 'OVER' | 'OUT';
type InteractionPointerEvents =
  | 'pointerdown'
  | 'pointercancel'
  | 'pointerup'
  | 'pointertap'
  | 'pointerupoutside'
  | 'pointermove'
  | 'pointerover'
  | 'pointerout';

export const TouchEvent: { [key in TouchEventTypes]: InteractionPointerEvents } = {
  TAP: 'pointertap',
  START: 'pointerdown',
  END: 'pointerup',
  END_OUTSIDE: 'pointerupoutside',
  CANCEL: 'pointercancel',
  MOVE: 'pointermove',
  OVER: 'pointerover',
  OUT: 'pointerout',
};

// APP EVENTS
export const AppEvent = {
  RESIZED: 'resized',
  DEBUG_VALUE: 'debug_value',
  DATA_READY: 'data_ready',
  STAGE_READY: 'stage_ready',
  MEDIATRIGGER_READY: 'mediatrigger_ready',
  READY: 'ready',
  LOAD_COMPLETE: 'load_complete',
  LOAD_PROGRESS: 'loaded_progress',
  LOAD_TEXT: 'loaded_text',
  ENABLE_INTERACTION: 'enable_interaction',
  DISABLE_INTERACTION: 'disable_interaction',
  STATE_ACTIVE: 'state_active',
  STATE_INACTIVE: 'state_inactive',
  STATE_FOCUSSED: 'state_focus',
  STATE_BLURRED: 'state_blur',
  NETWORK_ONLINE: 'network_online',
  NETWORK_OFFLINE: 'network_offline',
};

fixEventNames(AppEvent, 'app');
