import { create } from "zustand";
import { randomSeed } from "../world/prng";
import { buildWorld, type WorldState } from "../world/worldFactory";
import { FLAMMABLE_MATERIALS } from "../generation/buildingGenerator";
import type {
  BuildingData,
  CreateCategory,
  CreateItem,
  CreatureData,
  PropData,
  PropKind,
  ScaleLevel,
  Selection,
  ToolId,
  WeatherType,
} from "../types";
import {
  decodeShareURL,
  encodeShareURL,
  type SerializableWorld,
} from "../storage/worldStorage";

export interface GravityWell {
  id: string;
  position: [number, number, number];
  strength: number;
}

export const LOADING_STEPS = [
  "Generating planetary system...",
  "Generating terrain...",
  "Generating continents...",
  "Generating cities...",
  "Generating infrastructure...",
  "Generating buildings...",
  "Generating life...",
  "Generating weather...",
  "Generating history...",
  "SIMULATION READY.",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ExperimentSettings {
  gravity: number;
  wind: number;
  temperature: number;
  timeScale: number;
  water: boolean;
  fire: boolean;
}

interface SimulationState extends WorldState {
  // world lifecycle
  isGenerating: boolean;
  loadingSteps: string[];

  // tools
  activeTool: ToolId;
  createCategory: CreateCategory;
  createItem: CreateItem | null;

  // gravity
  gravityMagnitude: number; // in G, 1.0 = 9.81 m/s^2
  gravityDirection: 1 | -1;
  gravityWells: GravityWell[];

  // time
  paused: boolean;
  timeScale: number;
  simYear: number;

  // weather
  weatherType: WeatherType;
  wind: number;
  temperature: number;

  // camera / navigation
  scaleLevel: ScaleLevel;
  firstPerson: boolean;
  cameraPos: [number, number, number];
  flyTarget: { position: [number, number, number]; target: [number, number, number] } | null;
  flyToken: number;

  // selection
  selection: Selection | null;

  // user-spawned free objects
  props: PropData[];

  // experiment mode
  experimentOpen: boolean;
  experiment: ExperimentSettings;
  worldPanelOpen: boolean;

  // actions
  newUniverse: (seed?: number) => void;
  startNewUniverse: (seed?: number) => Promise<void>;
  playIntroLoading: () => Promise<void>;
  setActiveTool: (tool: ToolId) => void;
  setCreateCategory: (cat: CreateCategory) => void;
  setCreateItem: (item: CreateItem | null) => void;

  setGravityMagnitude: (v: number) => void;
  reverseGravity: () => void;
  addGravityWell: (position: [number, number, number]) => void;
  clearGravityWells: () => void;

  setPaused: (p: boolean) => void;
  togglePause: () => void;
  setTimeScale: (n: number) => void;
  advanceSimYear: (deltaYears: number) => void;

  setWeather: (t: WeatherType) => void;
  setWind: (v: number) => void;
  setTemperature: (v: number) => void;

  setScaleLevel: (level: ScaleLevel) => void;
  toggleFirstPerson: (on?: boolean) => void;
  setCameraPos: (pos: [number, number, number]) => void;
  flyTo: (target: [number, number, number], distance?: number) => void;

  select: (sel: Selection | null) => void;

  addProp: (kind: PropKind, position: [number, number, number]) => string;
  removeProp: (id: string) => void;
  clearProps: () => void;

  updateBuilding: (id: string, partial: Partial<BuildingData>) => void;
  destroyBuilding: (id: string) => void;
  igniteBuilding: (id: string) => void;

  updateCreature: (id: string, partial: Partial<CreatureData>) => void;
  addCreature: (creature: CreatureData) => void;
  removeCreature: (id: string) => void;

  setExperimentOpen: (open: boolean) => void;
  setExperiment: (partial: Partial<ExperimentSettings>) => void;
  runExperiment: () => void;
  setWorldPanelOpen: (open: boolean) => void;

  getSerializableState: () => SerializableWorld;
  loadSerializableState: (data: SerializableWorld) => void;
}

let propCounter = 0;

const shared = decodeShareURL();
const initialSeed = shared?.seed ?? randomSeed();
const initialWorld = buildWorld(initialSeed);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  ...initialWorld,
  isGenerating: false,
  loadingSteps: [],

  activeTool: "select",
  createCategory: "objects",
  createItem: null,

  gravityMagnitude: shared?.gravityMagnitude ?? 1,
  gravityDirection: shared?.gravityDirection ?? 1,
  gravityWells: [],

  paused: false,
  timeScale: 1,
  simYear: initialWorld.meta.year,

  weatherType: shared?.weatherType ?? "clear",
  wind: 8,
  temperature: 22,

  scaleLevel: "city",
  firstPerson: false,
  cameraPos: [0, 220, 260],
  flyTarget: null,
  flyToken: 0,

  selection: null,
  props: [],

  experimentOpen: false,
  experiment: { gravity: 1, wind: 8, temperature: 22, timeScale: 1, water: false, fire: false },
  worldPanelOpen: false,

  newUniverse: (seed) => {
    const nextSeed = seed ?? randomSeed();
    const world = buildWorld(nextSeed);
    set({
      ...world,
      simYear: world.meta.year,
      selection: null,
      props: [],
      gravityWells: [],
      gravityMagnitude: 1,
      gravityDirection: 1,
      paused: false,
      timeScale: 1,
    });
  },

  startNewUniverse: async (seed) => {
    set({ isGenerating: true, loadingSteps: [] });
    for (const step of LOADING_STEPS) {
      await delay(130);
      set((s) => ({ loadingSteps: [...s.loadingSteps, step] }));
    }
    await delay(250);
    get().newUniverse(seed);
    await delay(450);
    set({ isGenerating: false });
  },

  playIntroLoading: async () => {
    set({ isGenerating: true, loadingSteps: [] });
    for (const step of LOADING_STEPS) {
      await delay(110);
      set((s) => ({ loadingSteps: [...s.loadingSteps, step] }));
    }
    await delay(400);
    set({ isGenerating: false });
  },

  setActiveTool: (tool) => set({ activeTool: tool, selection: tool === "select" ? get().selection : null }),
  setCreateCategory: (cat) => set({ createCategory: cat, createItem: null }),
  setCreateItem: (item) => set({ createItem: item }),

  setGravityMagnitude: (v) => set({ gravityMagnitude: Math.max(0, Math.min(20, v)) }),
  reverseGravity: () => set((s) => ({ gravityDirection: s.gravityDirection === 1 ? -1 : 1 })),
  addGravityWell: (position) =>
    set((s) => ({
      gravityWells: [...s.gravityWells, { id: `well-${s.gravityWells.length}-${Date.now()}`, position, strength: 40 }],
    })),
  clearGravityWells: () => set({ gravityWells: [] }),

  setPaused: (p) => set({ paused: p }),
  togglePause: () => set((s) => ({ paused: !s.paused })),
  setTimeScale: (n) => set({ timeScale: n }),
  advanceSimYear: (deltaYears) => set((s) => ({ simYear: s.simYear + deltaYears })),

  setWeather: (t) => set({ weatherType: t }),
  setWind: (v) => set({ wind: v }),
  setTemperature: (v) => set({ temperature: v }),

  setScaleLevel: (level) => set({ scaleLevel: level }),
  toggleFirstPerson: (on) => set((s) => ({ firstPerson: on ?? !s.firstPerson })),
  setCameraPos: (pos) => set({ cameraPos: pos }),
  flyTo: (target, distance = 22) => {
    const s = get();
    const cam = s.cameraPos;
    const dx = cam[0] - target[0];
    const dz = cam[2] - target[2];
    const horizLen = Math.hypot(dx, dz) || 1;
    const nx = dx / horizLen;
    const nz = dz / horizLen;
    const position: [number, number, number] = [
      target[0] + nx * distance,
      target[1] + distance * 0.55,
      target[2] + nz * distance,
    ];
    set((state) => ({
      flyTarget: { position, target },
      flyToken: state.flyToken + 1,
      scaleLevel: distance <= 30 ? "building" : "street",
      firstPerson: false,
    }));
  },

  select: (sel) => set({ selection: sel }),

  addProp: (kind, position) => {
    const id = `prop-${kind}-${propCounter++}-${Date.now()}`;
    const prop: PropData = {
      id,
      kind,
      position,
      createdAt: get().simYear,
      flammable: kind === "sand" ? false : undefined,
    };
    set((s) => ({ props: [...s.props, prop] }));
    return id;
  },
  removeProp: (id) => set((s) => ({ props: s.props.filter((p) => p.id !== id) })),
  clearProps: () => set({ props: [] }),

  updateBuilding: (id, partial) =>
    set((s) => {
      const existing = s.buildings[id];
      if (!existing) return {};
      return { buildings: { ...s.buildings, [id]: { ...existing, ...partial } } };
    }),
  destroyBuilding: (id) =>
    set((s) => {
      const existing = s.buildings[id];
      if (!existing) return {};
      return {
        buildings: {
          ...s.buildings,
          [id]: { ...existing, structuralHealth: 0, collapsed: true, burning: false },
        },
      };
    }),
  igniteBuilding: (id) =>
    set((s) => {
      const existing = s.buildings[id];
      if (!existing || existing.collapsed) return {};
      return { buildings: { ...s.buildings, [id]: { ...existing, burning: true } } };
    }),

  updateCreature: (id, partial) =>
    set((s) => {
      const existing = s.creatures[id];
      if (!existing) return {};
      return { creatures: { ...s.creatures, [id]: { ...existing, ...partial } } };
    }),

  addCreature: (creature) => set((s) => ({ creatures: { ...s.creatures, [creature.id]: creature } })),
  removeCreature: (id) =>
    set((s) => {
      const next = { ...s.creatures };
      delete next[id];
      return { creatures: next };
    }),

  setExperimentOpen: (open) => set({ experimentOpen: open }),
  setExperiment: (partial) => set((s) => ({ experiment: { ...s.experiment, ...partial } })),
  setWorldPanelOpen: (open) => set({ worldPanelOpen: open }),
  runExperiment: () => {
    const e = get().experiment;
    set({
      gravityMagnitude: Math.abs(e.gravity),
      gravityDirection: e.gravity < 0 ? -1 : 1,
      wind: e.wind,
      temperature: e.temperature,
      timeScale: e.timeScale,
      paused: false,
      weatherType: e.wind > 40 ? "storm" : get().weatherType,
    });
    if (e.water) get().addProp("water", [0, 30, 0]);
    if (e.fire) get().addProp("fire", [4, 0.5, 0]);
  },

  getSerializableState: () => {
    const s = get();
    const buildingDeltas: SerializableWorld["buildingDeltas"] = {};
    for (const id in s.buildings) {
      const b = s.buildings[id];
      if (b.structuralHealth !== 100 || b.burning || b.collapsed) {
        buildingDeltas[id] = { structuralHealth: b.structuralHealth, burning: b.burning, collapsed: b.collapsed };
      }
    }
    return {
      seed: s.seed,
      gravityMagnitude: s.gravityMagnitude,
      gravityDirection: s.gravityDirection,
      timeScale: s.timeScale,
      simYear: s.simYear,
      weatherType: s.weatherType,
      wind: s.wind,
      temperature: s.temperature,
      buildingDeltas,
      props: s.props,
      savedAt: Date.now(),
    };
  },

  loadSerializableState: (data) => {
    const world = buildWorld(data.seed);
    const buildings = { ...world.buildings };
    for (const id in data.buildingDeltas) {
      if (buildings[id]) buildings[id] = { ...buildings[id], ...data.buildingDeltas[id] };
    }
    set({
      ...world,
      buildings,
      props: data.props ?? [],
      gravityMagnitude: data.gravityMagnitude,
      gravityDirection: data.gravityDirection,
      timeScale: data.timeScale,
      simYear: data.simYear,
      weatherType: data.weatherType,
      wind: data.wind,
      temperature: data.temperature,
      selection: null,
    });
  },
}));

export function getShareURL(): string {
  const s = useSimulationStore.getState();
  return encodeShareURL({
    seed: s.seed,
    gravityMagnitude: s.gravityMagnitude,
    gravityDirection: s.gravityDirection,
    weatherType: s.weatherType,
  });
}

export function isFlammable(material: BuildingData["material"]): boolean {
  return FLAMMABLE_MATERIALS.includes(material);
}
