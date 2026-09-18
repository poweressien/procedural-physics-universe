/**
 * Deterministic random generation.
 *
 * Every generator in this project derives its randomness from the world
 * seed plus a string "channel" (e.g. "terrain", "city:block:12:4"). That
 * means the same world seed always reproduces the same terrain, city
 * layout, buildings, vehicles and history — the whole point of a seeded
 * universe — while still giving each subsystem its own independent
 * random stream so tweaking one doesn't ripple into another.
 */

// Simple, fast string hash (djb2 variant) -> 32-bit unsigned int.
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

// Mulberry32 — small, fast, decent-quality seeded PRNG.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RNG {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, maxInclusive: number): number;
  pick<T>(arr: readonly T[]): T;
  bool(chance?: number): boolean;
  sign(): 1 | -1;
}

/** Create an independent, deterministic RNG channel from a world seed + label. */
export function channel(worldSeed: number, label: string): RNG {
  const combined = (worldSeed ^ hashString(label)) >>> 0;
  const next = mulberry32(combined);
  return {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, maxInclusive) => Math.floor(min + next() * (maxInclusive - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (chance = 0.5) => next() < chance,
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

/** Turn any string into a numeric world seed (for seed phrases / shared URLs). */
export function seedFromString(str: string): number {
  const n = hashString(str);
  return n === 0 ? 1 : n;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}
