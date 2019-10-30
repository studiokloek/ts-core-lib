export interface PrepareCleanupInterface {
  prepareAfterLoad(): void;
  cleanupBeforeUnload(): void;
}

export function isPrepareCleanup(instance: any): instance is PrepareCleanupInterface {
  return typeof instance.cleanupBeforeUnload === 'function';
}
