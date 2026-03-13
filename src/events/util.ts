import { forIn } from 'lodash';

// prefix achter event names (handig voor logging)
/**
 * Past alle waarden in `eventObject` aan door `suffix` als voorvoegsel toe te voegen in hoofdletters.
 * Voorbeeld: `{ READY: 'ready' }` + suffix `'app'` → `{ READY: 'APP_READY' }`.
 */
export function fixEventNames(eventObject: { [key: string]: string }, suffix: string): void {
  forIn(eventObject, (value: string, key: string): void => {
    eventObject[key] = `${suffix}_${value}`.toUpperCase();
  });
}
