import { createNoise2D } from "simplex-noise";
import { channel, mulberry32 } from "./prng";

export const TERRAIN_SIZE = 1400; // total world width/depth in units
export const CITY_RADIUS = 260; // flattened area the city sits on
export const SEA_LEVEL = -1.2;

export interface TerrainSampler {
  height: (x: number, z: number) => number;
  color: (x: number, z: number, h: number) => [number, number, number];
}

/**
 * Builds a deterministic terrain sampler for a given world seed.
 * Combines a few octaves of simplex noise (fbm) for rolling continental
 * terrain, then flattens a circular region at the origin so the
 * procedural city has buildable ground to sit on.
 */
export function createTerrainSampler(worldSeed: number): TerrainSampler {
  const rngA = mulberry32((worldSeed ^ 0x9e3779b9) >>> 0);
  const rngB = mulberry32((worldSeed ^ 0x85ebca6b) >>> 0);
  const rngC = mulberry32((worldSeed ^ 0xc2b2ae35) >>> 0);
  const noiseA = createNoise2D(rngA); // continental shape
  const noiseB = createNoise2D(rngB); // hills
  const noiseC = createNoise2D(rngC); // fine detail

  const height = (x: number, z: number): number => {
    const continental = noiseA(x * 0.0009, z * 0.0009) * 26;
    const hills = noiseB(x * 0.004, z * 0.004) * 6;
    const detail = noiseC(x * 0.02, z * 0.02) * 1.1;
    let h = continental + hills + detail;

    // Flatten toward the city center so buildings sit on level ground,
    // blending smoothly back into natural terrain at the edge.
    const dist = Math.sqrt(x * x + z * z);
    const flattenAmount = 1 - smoothstep(CITY_RADIUS * 0.65, CITY_RADIUS * 1.15, dist);
    h = h * (1 - flattenAmount) + 0.4 * flattenAmount;

    return h;
  };

  const color = (_x: number, _z: number, h: number): [number, number, number] => {
    const DEEP: [number, number, number] = [0.03, 0.14, 0.26];
    const SHALLOW: [number, number, number] = [0.06, 0.26, 0.38];
    const SAND: [number, number, number] = [0.68, 0.62, 0.42];
    const GRASS: [number, number, number] = [0.12, 0.36, 0.22];
    const SCRUB: [number, number, number] = [0.28, 0.34, 0.18];
    const ROCK: [number, number, number] = [0.44, 0.41, 0.4];
    const PEAK: [number, number, number] = [0.68, 0.68, 0.72];

    const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
    ];
    const band = (lo: number, hi: number) => Math.max(0, Math.min(1, (h - lo) / (hi - lo)));

    if (h < SEA_LEVEL - 4) return DEEP;
    if (h < SEA_LEVEL) return mix(DEEP, SHALLOW, band(SEA_LEVEL - 4, SEA_LEVEL));
    if (h < SEA_LEVEL + 0.6) return mix(SHALLOW, SAND, band(SEA_LEVEL, SEA_LEVEL + 0.6));
    if (h < 3) return mix(SAND, GRASS, band(SEA_LEVEL + 0.6, 3));
    if (h < 9) return mix(GRASS, SCRUB, band(3, 9));
    if (h < 16) return mix(SCRUB, ROCK, band(9, 16));
    return mix(ROCK, PEAK, band(16, 26));
  };

  return { height, color };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Deterministic vegetation scatter points within a radius, kept off roads/city core. */
export function generateVegetation(
  worldSeed: number,
  sampler: TerrainSampler,
  count: number
): { position: [number, number, number]; scale: number }[] {
  const rng = channel(worldSeed, "vegetation");
  const points: { position: [number, number, number]; scale: number }[] = [];
  let attempts = 0;
  while (points.length < count && attempts < count * 4) {
    attempts++;
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(CITY_RADIUS * 1.05, TERRAIN_SIZE * 0.48);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const h = sampler.height(x, z);
    if (h < SEA_LEVEL + 0.3) continue; // no trees underwater
    points.push({ position: [x, h, z], scale: rng.range(0.6, 1.6) });
  }
  return points;
}
