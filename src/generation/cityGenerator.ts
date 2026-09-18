import { channel } from "../world/prng";
import type { BuildingData, CityBlock, RoadSegment, WorldMeta } from "../types";
import { generateBuilding } from "./buildingGenerator";
import { generateCityHistory } from "./historyGenerator";

export const BLOCK_SIZE = 26;
export const STREET_WIDTH = 6;
export const PLOT_SIZE = BLOCK_SIZE - STREET_WIDTH;
export const CITY_BLOCK_RADIUS = 210;

const CITY_NAME_PREFIX = [
  "New", "Port", "North", "South", "East", "West", "Fort", "Lake", "Old", "Upper",
];
const CITY_NAME_ROOT = [
  "haven", "bridge", "field", "wick", "mere", "stead", "gate", "cross", "vale", "burg",
];

export interface CityData {
  blocks: CityBlock[];
  buildings: BuildingData[];
  roads: RoadSegment[];
  meta: WorldMeta;
}

export function generateCity(worldSeed: number, currentYear: number): CityData {
  const metaRng = channel(worldSeed, "city:meta");

  const gridSpan = Math.ceil(CITY_BLOCK_RADIUS / BLOCK_SIZE);
  const blocks: CityBlock[] = [];
  const buildings: BuildingData[] = [];

  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    for (let gz = -gridSpan; gz <= gridSpan; gz++) {
      const cx = gx * BLOCK_SIZE;
      const cz = gz * BLOCK_SIZE;
      const dist = Math.sqrt(cx * cx + cz * cz);
      if (dist > CITY_BLOCK_RADIUS) continue;

      const blockId = `block-${gx}-${gz}`;
      const blockRng = channel(worldSeed, `city:block:${gx}:${gz}`);

      // Central plaza stays open; scattered parks elsewhere.
      const isPark = dist < BLOCK_SIZE * 0.9 || blockRng.bool(0.12);

      let buildingId: string | null = null;
      if (!isPark) {
        buildingId = `bld-${gx}-${gz}`;
        buildings.push(
          generateBuilding(blockRng, buildingId, [cx, 0, cz], PLOT_SIZE, currentYear)
        );
      }

      blocks.push({ id: blockId, x: gx, z: gz, buildingId, isPark });
    }
  }

  // Grid roads: one line per occupied grid row/column, clipped to the city extent.
  const roads: RoadSegment[] = [];
  const half = gridSpan * BLOCK_SIZE;
  for (let gx = -gridSpan; gx <= gridSpan; gx++) {
    const x = gx * BLOCK_SIZE;
    if (Math.abs(x) > CITY_BLOCK_RADIUS + BLOCK_SIZE) continue;
    roads.push({
      id: `road-v-${gx}`,
      start: [x, -half],
      end: [x, half],
      width: STREET_WIDTH,
    });
  }
  for (let gz = -gridSpan; gz <= gridSpan; gz++) {
    const z = gz * BLOCK_SIZE;
    if (Math.abs(z) > CITY_BLOCK_RADIUS + BLOCK_SIZE) continue;
    roads.push({
      id: `road-h-${gz}`,
      start: [-half, z],
      end: [half, z],
      width: STREET_WIDTH,
    });
  }

  const foundedYear = currentYear - metaRng.int(60, 190);
  const name = `${metaRng.pick(CITY_NAME_PREFIX)}${metaRng.pick(CITY_NAME_ROOT)}`;
  const population = buildings.reduce((sum, b) => sum + b.occupants, 0);

  const meta: WorldMeta = {
    seed: worldSeed,
    name,
    foundedYear,
    year: currentYear,
    population,
    events: generateCityHistory(metaRng, foundedYear, currentYear),
  };

  return { blocks, buildings, roads, meta };
}
