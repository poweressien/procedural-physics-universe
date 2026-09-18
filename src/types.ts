export type Vec3 = [number, number, number];

export type ScaleLevel = "planet" | "city" | "street" | "building";

export type ToolId =
  | "select"
  | "create"
  | "destroy"
  | "gravity"
  | "water"
  | "fire"
  | "sand"
  | "weather"
  | "time";

export type CreateCategory =
  | "objects"
  | "buildings"
  | "vehicles"
  | "creatures"
  | "terrain";

export type CreateItem =
  | "box"
  | "sphere"
  | "boulder"
  | "house"
  | "tower"
  | "factory"
  | "sedan"
  | "truck"
  | "critter"
  | "tree"
  | "hill";

export type WeatherType =
  | "clear"
  | "clouds"
  | "rain"
  | "storm"
  | "fog"
  | "snow";

export type BuildingMaterial = "concrete" | "wood" | "metal" | "glass" | "stone";

export interface HistoryEvent {
  year: number;
  text: string;
}

export interface BuildingUsage {
  kind: "residential" | "office" | "factory" | "shop" | "civic";
  label: string;
}

export interface BuildingData {
  id: string;
  position: Vec3;
  size: Vec3; // width, height, depth
  material: BuildingMaterial;
  usage: BuildingUsage;
  builtYear: number;
  floors: number;
  occupants: number;
  structuralHealth: number; // 0-100
  burning: boolean;
  collapsed: boolean;
  colorSeed: number; // 0-1, used to jitter the base material color per building
  history: HistoryEvent[];
  userPlaced?: boolean;
}

export interface RoadSegment {
  id: string;
  start: [number, number];
  end: [number, number];
  width: number;
}

export interface VehicleData {
  id: string;
  kind: "sedan" | "truck";
  roadId: string;
  t: number; // 0-1 progress along its road segment
  direction: 1 | -1;
  speed: number; // km/h (display)
  mass: number;
  fuel: number;
  owner: string;
  color: string;
}

export interface CreatureData {
  id: string;
  position: Vec3;
  velocity: Vec3;
  age: number;
  energy: number;
  hunger: number;
  state: "wandering" | "seeking food" | "resting";
  species: string;
}

export type PropKind = "box" | "sphere" | "water" | "fire" | "sand" | "vehicle" | "rock";

export interface PropData {
  id: string;
  kind: PropKind;
  position: Vec3;
  createdAt: number;
  flammable?: boolean;
}

export interface CityBlock {
  id: string;
  x: number;
  z: number;
  buildingId: string | null;
  isPark: boolean;
}

export interface WorldMeta {
  seed: number;
  name: string;
  foundedYear: number;
  year: number;
  population: number;
  events: HistoryEvent[];
}

export type SelectableKind = "building" | "vehicle" | "creature" | "prop";

export interface Selection {
  kind: SelectableKind;
  id: string;
}
