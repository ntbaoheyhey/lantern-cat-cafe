/** Fixed-size pool: objects are made on demand up to `cap`, then reused; it never grows past it. */
export class Pool<T> {
  private readonly free: T[] = [];
  private readonly used: T[] = [];
  private created = 0;

  constructor(
    readonly cap: number,
    private readonly make: () => T,
    /** Called when an object leaves the pool's active set (hide it, clear state). */
    private readonly reset: (item: T) => void = () => {},
    /** When full, true takes over the oldest active object, false refuses (returns null). */
    private readonly recycleOldest = false,
  ) {}

  get active(): readonly T[] {
    return this.used;
  }

  /** Objects created so far; never above `cap`. */
  get size(): number {
    return this.created;
  }

  acquire(): T | null {
    let item = this.free.pop();
    if (item === undefined && this.created < this.cap) {
      item = this.make();
      this.created++;
    }
    if (item === undefined && this.recycleOldest) {
      item = this.used.shift();
      if (item !== undefined) this.reset(item);
    }
    if (item === undefined) return null;
    this.used.push(item);
    return item;
  }

  release(item: T): void {
    const i = this.used.indexOf(item);
    if (i < 0) return;
    this.used.splice(i, 1);
    this.reset(item);
    this.free.push(item);
  }

  releaseAll(): void {
    for (const item of this.used.splice(0)) {
      this.reset(item);
      this.free.push(item);
    }
  }

  /** All objects ever created (active and free), for destroying them. */
  all(): T[] {
    return [...this.used, ...this.free];
  }
}
