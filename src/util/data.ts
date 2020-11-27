import { isArray, mergeWith, toArray } from 'lodash-es';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defaultsDeepPreserveArrays(...sources: any[]): any {
  const output = {};
  toArray(sources)
    .reverse()
    .forEach((item) => {
      mergeWith(output, item, (_objectValue, sourceValue) => {
        return isArray(sourceValue) ? sourceValue : undefined;
      });
    });
  return output;
}
