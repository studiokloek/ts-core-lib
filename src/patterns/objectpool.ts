export class ObjectPool<T> {
  private pool: T[];
  private target: ObjectPoolItem<T>;

  public constructor(target: ObjectPoolItem<T>) {
    this.pool = [];
    this.target = target;
  }

  public getItem(): T {
    if (this.pool.length > 0) {
      return this.pool.splice(0, 1)[0];
    }
    return new this.target();
  }

  public prepareItem(): void {
    this.pool.push(new this.target());
  }

  public releaseItem(instance: T): void {
    if (this.target.reset) {
      this.target.reset(instance);
    }
    this.pool.push(instance);
  }
}

export interface ObjectPoolItem<T extends Record<string, any>> {
  new (): T;
  reset?(obj: T): void;
}
