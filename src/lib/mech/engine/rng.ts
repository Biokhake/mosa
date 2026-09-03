/**
 * Deterministic seeded RNG for the design engine. No Math.random, no Date.
 */

/** FNV-1a + avalanche — stable 32-bit hash of a string. */
export function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export interface Rng {
  /** [0,1) */
  next(): number;
  /** [min,max) */
  range(min: number, max: number): number;
  /** integer [0,n) */
  int(n: number): number;
  /** pick one */
  pick<T>(arr: readonly T[]): T;
  /** true with probability p */
  chance(p: number): boolean;
  /** a fresh stream forked by a label (decorrelated) */
  fork(label: string): Rng;
}

export function makeRng(seed: string | number): Rng {
  let a = (typeof seed === "number" ? seed : hash32(seed)) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)]!,
    chance: (p) => next() < p,
    fork: (label) => makeRng((hash32(label) ^ a) >>> 0),
  };
  return rng;
}

export const lerp = (x: number, y: number, t: number) => x + (y - x) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
