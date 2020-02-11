export interface PrepareCleanupInterface {
  prepareAfterLoad(): void;
  cleanupBeforeUnload(): void;
}

export function isPrepareCleanup(instance: any): instance is PrepareCleanupInterface {
  return instance && typeof instance.cleanupBeforeUnload === 'function';
}
