/** Enum die renderresolutieniveaus vertegenwoordigt. `RETINA` (2) schakelt high-DPI-rendering in; `NORMAL` (1) gebruikt standaardresolutie. */
export enum ResolutionMode {
  RETINA = 2,
  NORMAL = 1,
}

/** Definieert de minimale viewport-grootte (in pixels) waarbij retina/high-DPI-rendering wordt ingeschakeld, opgesplitst per platform. */
export interface ResolutionBreakpoint {
  ios: number;
  android: number;
  desktop: number;
}

/** Oriëntatiemodus-constanten. Gebruik `LANDSCAPE`, `PORTRAIT` of `NONE` (lege string) om de schermoriëntatie op te geven of te vergelijken. */
export const OrientationMode = {
  NONE: '',
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
};
