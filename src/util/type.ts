/**
 * Alias voor `Function`, gebruikt als basiswaarde voor de `Type<T>` constructor interface.
 */
export const Type = Function;

/**
 * Type guard die controleert of een waarde een constructorfunctie is (d.w.z. een klasse of aanroepbare functie met `new`).
 */
export function isType(v: any): v is Type<any> {
  return typeof v === 'function';
}

/**
 * Vertegenwoordigt een constructortype voor klasse `T`. Gebruik dit als parametertype wanneer een functie
 * een klasse (geen instantie) accepteert als argument.
 */
export interface Type<T> extends Function {
  new (...arguments_: any[]): T;
}
