/**
 * Generieke objectpool voor het hergebruiken van klasse-instanties om garbage collection-overhead te vermijden.
 * Haal objecten op met `getItem()`, verwarm de pool voor met `prepareItem()`, en geef
 * objecten terug met `releaseItem()`. De pool roept de statische `reset()`-methode aan op de
 * constructor (indien gedefinieerd via `ObjectPoolItem`) voordat een object naar de pool wordt teruggezet.
 */
export class ObjectPool<T> {
  private pool: T[];
  private target: ObjectPoolItem<T>;

  constructor(target: ObjectPoolItem<T>) {
    this.pool = [];
    this.target = target;
  }

  getItem(): T {
    if (this.pool.length > 0) {
      return this.pool.splice(0, 1)[0];
    }
    return new this.target();
  }

  prepareItem(): void {
    this.pool.push(new this.target());
  }

  releaseItem(instance: T): void {
    if (this.target.reset) {
      this.target.reset(instance);
    }
    this.pool.push(instance);
  }
}

/**
 * Interface voor constructortypes die beheerd kunnen worden door `ObjectPool`.
 * Definieer optioneel een statische `reset()`-methode om een instantie naar zijn beginwaarden te herstellen
 * voordat deze naar de pool wordt teruggezet.
 */
export interface ObjectPoolItem<T> {
  new (): T;
  reset?(object: T): void;
}
