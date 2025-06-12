import { isArray, mergeWith, toArray } from 'lodash';

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
