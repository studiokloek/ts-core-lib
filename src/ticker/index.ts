import { ConcreteTicker } from './ticker';
import { values } from 'lodash';

const table: { [key: string]: ConcreteTicker } = {};

let globalTimeScale = 1;

/**
 * Geeft de benoemde `ConcreteTicker` terug en maakt deze aan als hij nog niet bestaat. Door
 * `autoSleep = true` mee te geven slaapt de ticker automatisch wanneer er geen callbacks
 * geregistreerd zijn en wordt hij weer wakker zodra er een wordt toegevoegd. De globale tijdschaal
 * wordt direct toegepast op de teruggegeven ticker.
 */
export function getTicker(name = 'default', autoSleep = false): ConcreteTicker {
  let ticker = table[name] as ConcreteTicker;

  if (!ticker) {
    ticker = table[name] = new ConcreteTicker(name, autoSleep);
  }

  ticker.globalTimeScale = globalTimeScale;

  return ticker;
}

/**
 * Stelt de globale tijdschaalfactor in die op alle geregistreerde tickers wordt toegepast. Een waarde van `1` is
 * normale snelheid; `0.5` is halve snelheid; `2` is dubbele snelheid. Dit beïnvloedt elke ticker in
 * de applicatie tegelijkertijd.
 */
export function setTickerGlobalTimeScale(_value: number): void {
  globalTimeScale = _value;

  const tickers = values(table);
  for (const ticker of tickers) {
    ticker.globalTimeScale = _value;
  }
}

/**
 * Slaat de huidige tijdtoestand op van alle tickers voordat de applicatie in slaap gaat
 * (bijv. wanneer het browsertabblad verborgen wordt). Roep dit aan in je `visibilitychange`- of
 * Page Lifecycle-handler vóór het pauzeren. Gebruik samen met `restoreTickerTimeAfterSleep`.
 */
export function storeTickerTimeBeforeSleep(): void {
  const tickers = values(table);

  for (const ticker of tickers) {
    ticker.storeTimeBeforeSleep();
  }
}

/**
 * Herstelt de tijdtoestand van alle tickers nadat de applicatie uit slaap ontwaakt,
 * waarbij de verstreken slaaptijd wordt gecompenseerd zodat animaties correct worden hervat.
 * Gebruik samen met `storeTickerTimeBeforeSleep`.
 */
export function restoreTickerTimeAfterSleep(): void {
  const tickers = values(table);

  for (const ticker of tickers) {
    ticker.restoreTimeAfterSleep();
  }
}

/**
 * De standaard applicatie-ticker-instantie (naam: `'default'`). Gebruik deze voor algemene
 * per-frame updates. Voor geïsoleerde subsystemen die een onafhankelijke tijdschaal nodig hebben,
 * maak een aparte ticker aan via `getTicker('myName')`.
 */
export const Ticker = getTicker();

export * from './mixin';
