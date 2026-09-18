import type { BuildingData, CityBlock, CreatureData, RoadSegment, VehicleData, WorldMeta } from "../types";
import { createTerrainSampler } from "./terrain";
import { generateVegetation } from "./terrain";
import { generateCity } from "../generation/cityGenerator";
import { generateCreatures, generateVehicles } from "../generation/entityGenerator";

export interface VegetationPoint {
  position: [number, number, number];
  scale: number;
}

export interface WorldState {
  seed: number;
  meta: WorldMeta;
  blocks: CityBlock[];
  buildings: Record<string, BuildingData>;
  roads: RoadSegment[];
  vehicles: VehicleData[];
  creatures: Record<string, CreatureData>;
  vegetation: VegetationPoint[];
}

export const CURRENT_YEAR = 2026;

/** Deterministically builds an entire world (terrain, city, entities, history) from a seed. */
export function buildWorld(seed: number): WorldState {
  const sampler = createTerrainSampler(seed);
  const city = generateCity(seed, CURRENT_YEAR);
  const vehicles = generateVehicles(seed, city.roads, Math.min(48, Math.max(12, Math.floor(city.roads.length * 1.1))));
  const creatureList = generateCreatures(seed, sampler, 22);
  const vegetation = generateVegetation(seed, sampler, 260);

  const buildings: Record<string, BuildingData> = {};
  for (const b of city.buildings) buildings[b.id] = b;

  const creatures: Record<string, CreatureData> = {};
  for (const c of creatureList) creatures[c.id] = c;

  return {
    seed,
    meta: city.meta,
    blocks: city.blocks,
    buildings,
    roads: city.roads,
    vehicles,
    creatures,
    vegetation,
  };
}
