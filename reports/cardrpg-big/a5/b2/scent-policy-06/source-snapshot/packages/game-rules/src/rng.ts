/** Deterministic PRNG (mulberry32). Seeds are uint32. */
export type Seed = number;

/** Mix a seed with a salt (splitmix32 style) to derive an independent stream. */
export function deriveSeed(seed: Seed, salt: number): Seed {
  let z = (seed + Math.imul(salt | 0, 0x9e3779b9) + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}

export class Rng {
  private s: number;
  constructor(seed: Seed) {
    this.s = seed >>> 0;
  }
  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
  /** Pick a key by relative weights. */
  weighted<K extends string>(weights: Record<K, number>, order: readonly K[]): K {
    let total = 0;
    for (const k of order) total += weights[k];
    let r = this.next() * total;
    for (const k of order) {
      r -= weights[k];
      if (r < 0) return k;
    }
    return order[order.length - 1] as K;
  }
}
