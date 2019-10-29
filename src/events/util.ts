import { forIn } from 'lodash-es';

// prefix achter event names (handig voor logging)
export function fixEventNames(eventObject: { [key: string]: string }, suffix: string): void {
  forIn(eventObject, (value: string, key: string): void => {
    eventObject[key] = `${suffix}_${value}`.toUpperCase();
  });
}
