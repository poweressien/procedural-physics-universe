import type { ScaleLevel } from "../types";
import { PLANET_CENTER, PLANET_RADIUS } from "../world/planetConfig";

export interface ScalePreset {
  position: [number, number, number];
  target: [number, number, number];
}

const PLANET_TARGET: [number, number, number] = [
  PLANET_CENTER[0],
  PLANET_CENTER[1] + PLANET_RADIUS * 0.55,
  PLANET_CENTER[2],
];

export const SCALE_PRESETS: Record<ScaleLevel, ScalePreset> = {
  planet: {
    position: [PLANET_CENTER[0] + 1043, PLANET_CENTER[1] + 1424, PLANET_CENTER[2] + 1138],
    target: PLANET_TARGET,
  },
  city: { position: [0, 220, 260], target: [0, 0, 0] },
  street: { position: [46, 13, 46], target: [20, 2, 20] },
  building: { position: [10, 6, 14], target: [0, 9, 0] },
};

export const SCALE_ORDER: ScaleLevel[] = ["planet", "city", "street", "building"];
