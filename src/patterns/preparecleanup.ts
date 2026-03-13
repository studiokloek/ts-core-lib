/**
 * Minimale lifecycle-interface voor objecten die na het laden van assets voorbereid moeten worden
 * en vóór het verwijderen van assets opgeruimd moeten worden. Implementeer deze interface op elk
 * display-object of component dat deelneemt aan de prepare/cleanup-lifecycle.
 */
export interface PrepareCleanupInterface {
  prepareAfterLoad(): void;
  cleanupBeforeUnload(): void;
}

/**
 * Type guard die controleert of een object `PrepareCleanupInterface` implementeert.
 * Geeft `true` terug als de instantie een `cleanupBeforeUnload`-methode heeft, en versmalt het type dienovereenkomstig.
 */
export function isPrepareCleanup(instance: any): instance is PrepareCleanupInterface {
  return instance && typeof instance.cleanupBeforeUnload === 'function';
}
