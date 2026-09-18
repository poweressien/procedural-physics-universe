import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { useSimulationStore, isFlammable } from "../simulation/useSimulationStore";

const TICK_INTERVAL = 0.5; // seconds of real time between fire/damage ticks
const YEAR_SYNC_INTERVAL = 0.25;
const SIM_SECONDS_PER_REAL_SECOND_AT_1X = 240; // a full day takes ~6 real minutes at x1

export function SimulationLoop() {
  const { world } = useRapier();
  const tickAcc = useRef(0);
  const yearAcc = useRef(0);
  const pendingYears = useRef(0);

  useFrame((_, rawDelta) => {
    const store = useSimulationStore.getState();
    const delta = Math.min(rawDelta, 0.1);
    if (store.paused) return;

    // --- Gravity wells: pull nearby dynamic bodies toward each well ---
    if (store.gravityWells.length > 0) {
      world.bodies.forEach((body) => {
        if (!body.isDynamic()) return;
        const t = body.translation();
        for (const well of store.gravityWells) {
          const dx = well.position[0] - t.x;
          const dy = well.position[1] - t.y;
          const dz = well.position[2] - t.z;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq > 60 * 60 || distSq < 1) continue;
          const dist = Math.sqrt(distSq);
          const forceMag = (well.strength / distSq) * body.mass() * delta;
          body.applyImpulse(
            { x: (dx / dist) * forceMag, y: (dy / dist) * forceMag, z: (dz / dist) * forceMag },
            true
          );
        }
      });
    }

    // --- Time advancement ---
    const simSeconds = SIM_SECONDS_PER_REAL_SECOND_AT_1X * store.timeScale * delta;
    pendingYears.current += simSeconds / (365 * 24 * 3600);
    yearAcc.current += delta;
    if (yearAcc.current >= YEAR_SYNC_INTERVAL) {
      yearAcc.current = 0;
      if (pendingYears.current > 0) {
        store.advanceSimYear(pendingYears.current);
        pendingYears.current = 0;
      }
    }

    // --- Fire spread + structural damage (throttled tick) ---
    tickAcc.current += delta * Math.min(store.timeScale, 200); // cap so extreme speeds don't explode the sim
    if (tickAcc.current >= TICK_INTERVAL) {
      tickAcc.current = 0;
      runFireTick(store);
    }
  });

  return null;
}

function runFireTick(store: ReturnType<typeof useSimulationStore.getState>) {
  const buildings = store.buildings;
  const burning = Object.values(buildings).filter((b) => b.burning && !b.collapsed);
  const freeFires = store.props.filter((p) => p.kind === "fire");

  for (const b of burning) {
    const decay = isFlammable(b.material) ? 9 : 3.5;
    const nextHealth = Math.max(0, b.structuralHealth - decay);
    if (nextHealth <= 0) {
      store.destroyBuilding(b.id);
      continue;
    }
    store.updateBuilding(b.id, { structuralHealth: nextHealth });

    // Spread to nearby flammable, non-burning buildings.
    for (const other of Object.values(buildings)) {
      if (other.id === b.id || other.burning || other.collapsed || !isFlammable(other.material)) continue;
      const dx = other.position[0] - b.position[0];
      const dz = other.position[2] - b.position[2];
      const distSq = dx * dx + dz * dz;
      if (distSq < 22 * 22 && Math.random() < 0.18) {
        store.igniteBuilding(other.id);
      }
    }
  }

  // Standalone fire props can ignite nearby flammable buildings too.
  for (const fire of freeFires) {
    for (const other of Object.values(buildings)) {
      if (other.burning || other.collapsed || !isFlammable(other.material)) continue;
      const dx = other.position[0] - fire.position[0];
      const dz = other.position[2] - fire.position[2];
      if (dx * dx + dz * dz < 10 * 10 && Math.random() < 0.12) {
        store.igniteBuilding(other.id);
      }
    }
  }
}
