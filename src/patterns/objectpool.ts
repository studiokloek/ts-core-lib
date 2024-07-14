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

export interface ObjectPoolItem<T> {
  new (): T;
  reset?(object: T): void;
}
