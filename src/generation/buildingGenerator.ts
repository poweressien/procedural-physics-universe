import type { RNG } from "../world/prng";
import type { BuildingData, BuildingMaterial, BuildingUsage, Vec3 } from "../types";
import { generateBuildingHistory } from "./historyGenerator";

const MATERIALS: BuildingMaterial[] = ["concrete", "wood", "metal", "glass", "stone"];

const USAGES: BuildingUsage[] = [
  { kind: "residential", label: "Apartment block" },
  { kind: "residential", label: "Townhouse" },
  { kind: "office", label: "Office building" },
  { kind: "shop", label: "Retail block" },
  { kind: "factory", label: "Factory" },
  { kind: "civic", label: "Civic building" },
];

export function generateBuilding(
  rng: RNG,
  id: string,
  position: Vec3,
  plotSize: number,
  currentYear: number
): BuildingData {
  const usage = rng.pick(USAGES);
  const material: BuildingMaterial =
    usage.kind === "factory"
      ? rng.pick<BuildingMaterial>(["metal", "concrete"])
      : usage.kind === "office"
      ? rng.pick<BuildingMaterial>(["glass", "concrete"])
      : rng.pick(MATERIALS);

  const floors =
    usage.kind === "office"
      ? rng.int(6, 28)
      : usage.kind === "residential"
      ? rng.int(2, 12)
      : usage.kind === "factory"
      ? rng.int(1, 3)
      : rng.int(1, 5);

  const floorHeight = 3.1;
  const height = floors * floorHeight;
  const footprint = plotSize * rng.range(0.55, 0.85);

  const builtYear = currentYear - rng.int(3, 130);
  const occupants =
    usage.kind === "residential"
      ? floors * rng.int(2, 6)
      : usage.kind === "office"
      ? floors * rng.int(8, 20)
      : rng.int(2, 40);

  const structuralHealth = Math.max(35, 100 - rng.int(0, 40));
  const colorSeed = rng.next();

  return {
    id,
    position: [position[0], height / 2, position[2]],
    size: [footprint, height, footprint],
    material,
    usage,
    builtYear,
    floors,
    occupants,
    structuralHealth,
    burning: false,
    collapsed: false,
    colorSeed,
    history: generateBuildingHistory(rng, builtYear, currentYear, usage),
  };
}

export const FLAMMABLE_MATERIALS: BuildingMaterial[] = ["wood"];
