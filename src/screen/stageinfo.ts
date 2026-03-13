/** Payload gepubliceerd met `AppEvent.RESIZED`, beschrijft de huidige stage-positie, schaal en grootte na een resize. */
export interface StageInfo {
  position: { x: number; y: number };
  scale: { x: number; y: number };
  size: { width: number; height: number };
}
