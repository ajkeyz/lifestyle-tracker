/**
 * Deterministic pseudo-random number generator using xorshift128+.
 *
 * Every test run seeded with the same value produces identical sequences,
 * making failures reproducible across environments and CI reruns.
 */
export class SeededRandom {
  private s: [number, number];

  constructor(seed: number) {
    this.s = [seed, seed ^ 0x6d2b79f5];
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let [s0, s1] = this.s;
    const result = (s0 + s1) | 0;
    s1 ^= s0;
    this.s[0] = ((s0 << 55) | (s0 >>> 9)) ^ s1 ^ (s1 << 14);
    this.s[1] = (s1 << 36) | (s1 >>> 28);
    return (result >>> 0) / 0xffffffff;
  }

  /** Returns a random integer in [min, max] (inclusive on both ends). */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Returns true with the given probability (0-1). */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Picks a single random element from a non-empty array. */
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** Returns a new array with elements in a deterministic random order. */
  shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
