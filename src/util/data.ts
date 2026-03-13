import { isArray, mergeWith, toArray } from 'lodash';

/**
 * Voert een diepe samenvoeging uit van de opgegeven bronobjecten, maar behoudt arrays uit bronobjecten
 * in plaats van ze element voor element samen te voegen zoals lodash `defaultsDeep` zou doen.
 * Latere bronnen hebben een lagere prioriteit (eerdere bronnen winnen), overeenkomstig de semantiek van lodash `defaultsDeep`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaultsDeepPreserveArrays(...sources: any[]): any {
  const output = {};
  for (const item of toArray(sources).reverse()) {
    mergeWith(output, item, (_objectValue, sourceValue) => {
      return isArray(sourceValue) ? sourceValue : undefined;
    });
  }
  return output;
}
