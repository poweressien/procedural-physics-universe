import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { generateBuilding } from "../generation/buildingGenerator";
import { channel } from "../world/prng";
import type { BuildingData, CreatureData, PropKind, SelectableKind } from "../types";

let userCounter = 0;

export function handleEntityClick(kind: SelectableKind, id: string) {
  const store = useSimulationStore.getState();
  store.select({ kind, id });

  if (kind !== "building") return;

  if (store.activeTool === "destroy") {
    store.destroyBuilding(id);
  } else if (store.activeTool === "fire") {
    store.igniteBuilding(id);
  }
}

export function handleEntityDoubleClick(position: [number, number, number], distance = 22) {
  useSimulationStore.getState().flyTo(position, distance);
}

export function handleGroundClick(point: THREE.Vector3) {
  const store = useSimulationStore.getState();
  const tool = store.activeTool;

  if (tool === "gravity") {
    store.addGravityWell([point.x, Math.max(point.y, 0.5), point.z]);
    return;
  }

  if (tool === "water") {
    store.addProp("water", [point.x, point.y + 6, point.z]);
    return;
  }

  if (tool === "fire") {
    store.addProp("fire", [point.x, point.y + 0.1, point.z]);
    return;
  }

  if (tool === "sand") {
    store.addProp("sand", [point.x, point.y + 2, point.z]);
    return;
  }

  if (tool === "create") {
    spawnCreateItem(point);
    return;
  }
}

function spawnCreateItem(point: THREE.Vector3) {
  const store = useSimulationStore.getState();
  const item = store.createItem;
  if (!item) return;

  switch (item) {
    case "box":
      store.addProp("box", [point.x, point.y + 3, point.z]);
      break;
    case "sphere":
      store.addProp("sphere", [point.x, point.y + 3, point.z]);
      break;
    case "boulder":
      store.addProp("rock", [point.x, point.y + 3, point.z]);
      break;
    case "sedan":
    case "truck":
      store.addProp("vehicle", [point.x, point.y + 2, point.z]);
      break;
    case "critter":
      spawnCreature(point);
      break;
    case "tree":
      store.addProp("rock", [point.x, point.y, point.z]); // simplified: decorative static feature
      break;
    case "hill":
      store.addProp("rock", [point.x, point.y, point.z]);
      break;
    case "house":
    case "tower":
    case "factory":
      spawnUserBuilding(point, item);
      break;
  }
}

function spawnCreature(point: THREE.Vector3) {
  const id = `user-creature-${userCounter++}`;
  const creature: CreatureData = {
    id,
    position: [point.x, point.y + 0.3, point.z],
    velocity: [0, 0, 0],
    age: 0.1,
    energy: 80,
    hunger: 10,
    state: "wandering",
    species: "User-Released Critter",
  };
  useSimulationStore.setState((s) => ({ creatures: { ...s.creatures, [id]: creature } }));
}

function spawnUserBuilding(point: THREE.Vector3, kind: "house" | "tower" | "factory") {
  const store = useSimulationStore.getState();
  const id = `user-bld-${userCounter++}`;
  const rng = channel(Date.now() + userCounter, `user-building:${id}`);
  const plotSize = kind === "tower" ? 20 : kind === "factory" ? 26 : 14;
  const building: BuildingData = generateBuilding(rng, id, [point.x, point.y, point.z], plotSize, store.simYear);
  building.userPlaced = true;
  if (kind === "tower") {
    building.floors = rng.int(20, 45);
    building.size = [building.size[0], building.floors * 3.1, building.size[2]];
    building.position = [point.x, building.size[1] / 2, point.z];
    building.usage = { kind: "office", label: "User-built tower" };
  } else if (kind === "factory") {
    building.usage = { kind: "factory", label: "User-built factory" };
  } else {
    building.usage = { kind: "residential", label: "User-built house" };
  }
  useSimulationStore.setState((s) => ({ buildings: { ...s.buildings, [id]: building } }));
}

export type { PropKind };
