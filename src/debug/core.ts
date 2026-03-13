import { LogLevels } from '../logger/levels';
import { assign } from 'lodash';

// als er een get parameter ?debug aanwezig is, zetten we debug aan
const parameters = new URLSearchParams(location.search);

/**
 * Instellingen voor het debug-systeem. Debug-modus wordt automatisch ingeschakeld als `?debug` in de URL staat.
 * Gebruik `setCoreDebugSettings()` om instellingen aan te passen.
 */
export interface CoreDebugSettings {
  isEnabled?: boolean;
  minLogLevel: number;
  globalTimescale: number;
  forceLowResolution: boolean;
  disableSounds: boolean;
  skipMediaTrigger: boolean;
}

const values = {
  isEnabled: parameters.has('debug'),
  minLogLevel: LogLevels.WARN,
  globalTimescale: 1,
  disableSounds: false,
  forceLowResolution: false,
  skipMediaTrigger: false,
};

/**
 * Past de debug-instellingen aan. Roep dit vroeg aan bij het starten van de app
 * om standaarden zoals het logniveau of de resolutie te wijzigen.
 */
export function setCoreDebugSettings(_settings: CoreDebugSettings): void {
  assign(values, _settings);
}

/**
 * Geeft toegang tot de huidige debug-instellingen tijdens het uitvoeren van de app.
 * Alle methoden zijn veilig te gebruiken in productie — ze geven standaardwaarden terug als debug-modus uit staat.
 * Debug-modus wordt automatisch ingeschakeld als `?debug` in de URL staat.
 */
export const CoreDebug = {
  isEnabled(): boolean {
    return values.isEnabled;
  },
  skipMediaTrigger(): boolean {
    return values.isEnabled && values.skipMediaTrigger;
  },
  disableSounds(): boolean {
    return values.isEnabled && values.disableSounds;
  },
  forceLowResolution(): boolean {
    return values.isEnabled && values.forceLowResolution;
  },
  getLogLevel(): number {
    return values.minLogLevel;
  },
  getGlobalTimescale(): number {
    if (values.isEnabled) {
      return values.globalTimescale;
    }
    return 1;
  },
};
