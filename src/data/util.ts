import { differenceWith, fromPairs, isEqual, round, toPairs } from 'lodash';

const textEncoderSupported = typeof TextEncoder !== 'undefined';

/** Geeft de grootte van een tekst terug in kilobytes. */
export function stringSizeInKb(_value = ''): number {
  let size;

  if (textEncoderSupported) {
    size = new TextEncoder().encode(_value).length;
  } else {
    size = ~-encodeURI(_value).split(/%..|./).length;
  }

  return round(size * 0.001, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Probeert de tekst als JSON te lezen. Geeft het resultaat terug bij succes, anders de originele tekst. */
export function getValueFromJSON(source: string): unknown {
  if (typeof source !== 'string') {
    return source;
  }

  try {
    const value = JSON.parse(source);

    if (value !== undefined) {
      return value;
    }
  } catch { }

  return source;
}

/** Geeft een nieuw object terug met alleen de sleutel-waarde-paren uit `a` die afwijken van (of ontbreken in) `b`. */
export function objectDifferences<T>(a: Record<string | number, T>, b: Record<string | number, T>): Record<string | number, T> {
  return fromPairs(differenceWith(toPairs(a), toPairs(b), isEqual));
}
