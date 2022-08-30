export enum ResolutionMode {
  RETINA = 2,
  NORMAL = 1,
}

export interface ResolutionBreakpoint {
  ios: number;
  android: number;
  desktop: number;
}

export const OrientationMode = {
  NONE: '',
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
};
