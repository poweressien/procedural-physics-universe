import { channel } from "../world/prng";
import type { CreatureData, RoadSegment, VehicleData } from "../types";
import type { TerrainSampler } from "../world/terrain";
import { CITY_BLOCK_RADIUS } from "./cityGenerator";

const VEHICLE_COLORS = ["#c9d3dc", "#57d9c4", "#e8a33d", "#3d4652", "#8b98aa", "#e8573d"];
const OWNER_FIRST = ["Ada", "Bassey", "Chidi", "Efe", "Grace", "Ime", "Kanyin", "Uduak", "Nsikak", "Ubong"];

export function generateVehicles(
  worldSeed: number,
  roads: RoadSegment[],
  count: number
): VehicleData[] {
  if (roads.length === 0) return [];
  const rng = channel(worldSeed, "entities:vehicles");
  const vehicles: VehicleData[] = [];
  for (let i = 0; i < count; i++) {
    const road = rng.pick(roads);
    vehicles.push({
      id: `veh-${i}`,
      kind: rng.bool(0.75) ? "sedan" : "truck",
      roadId: road.id,
      t: rng.next(),
      direction: rng.bool() ? 1 : -1,
      speed: rng.range(22, 56),
      mass: rng.bool(0.75) ? rng.range(1200, 1700) : rng.range(2200, 4200),
      fuel: rng.range(20, 100),
      owner: `${rng.pick(OWNER_FIRST)} — Citizen #${rng.int(10000, 99999)}`,
      color: rng.pick(VEHICLE_COLORS),
    });
  }
  return vehicles;
}

const SPECIES = ["Plains Skitter", "Marsh Wader", "Ridge Hopper", "Grove Forager"];

export function generateCreatures(
  worldSeed: number,
  sampler: TerrainSampler,
  count: number
): CreatureData[] {
  const rng = channel(worldSeed, "entities:creatures");
  const creatures: CreatureData[] = [];
  let attempts = 0;
  while (creatures.length < count && attempts < count * 5) {
    attempts++;
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(CITY_BLOCK_RADIUS * 1.1, CITY_BLOCK_RADIUS * 2.2);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const h = sampler.height(x, z);
    if (h < -0.6) continue;
    creatures.push({
      id: `creature-${creatures.length}`,
      position: [x, h + 0.3, z],
      velocity: [0, 0, 0],
      age: rng.range(0.1, 8),
      energy: rng.range(40, 100),
      hunger: rng.range(0, 60),
      state: "wandering",
      species: rng.pick(SPECIES),
    });
  }
  return creatures;
}
