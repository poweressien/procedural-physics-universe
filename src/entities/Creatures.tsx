import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { handleEntityClick, handleEntityDoubleClick } from "../tools/toolActions";
import { createTerrainSampler } from "../world/terrain";
import type { CreatureData } from "../types";

interface Runtime {
  target: THREE.Vector2;
  syncTimer: number;
  deathTimer: number;
  reproCooldown: number;
}

let spawnCounter = 0;

function CreatureMesh({
  setRef,
  onClick,
  onDoubleClick,
}: {
  setRef: (n: THREE.Group | null) => void;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <group ref={setRef} onClick={onClick} onDoubleClick={onDoubleClick}>
      <mesh castShadow position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.28, 10, 10]} />
        <meshStandardMaterial color="#e8a33d" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.22, 0.28]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#e8a33d" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Creatures() {
  const creatures = useSimulationStore((s) => s.creatures);
  const seed = useSimulationStore((s) => s.seed);
  const list = useMemo(() => Object.values(creatures), [creatures]);
  const sampler = useMemo(() => createTerrainSampler(seed), [seed]);

  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const runtime = useRef<Map<string, Runtime>>(new Map());

  useFrame((_, delta) => {
    const store = useSimulationStore.getState();
    if (store.paused) return;
    const dt = Math.min(delta, 0.1) * store.timeScale;

    for (const c of list) {
      const group = groupRefs.current.get(c.id);
      if (!group) continue;
      let rt = runtime.current.get(c.id);
      if (!rt) {
        rt = {
          target: new THREE.Vector2(c.position[0], c.position[2]),
          syncTimer: Math.random() * 1,
          deathTimer: 0,
          reproCooldown: 20 + Math.random() * 30,
        };
        runtime.current.set(c.id, rt);
        group.position.set(c.position[0], c.position[1], c.position[2]);
      }

      const resting = c.state === "resting";
      const pos2 = new THREE.Vector2(group.position.x, group.position.z);

      if (!resting) {
        if (pos2.distanceTo(rt.target) < 1.2) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 6 + Math.random() * 14;
          rt.target = pos2.clone().add(new THREE.Vector2(Math.cos(angle) * dist, Math.sin(angle) * dist));
        }
        const dir = rt.target.clone().sub(pos2).normalize();
        const speed = 1.4 * dt;
        pos2.addScaledVector(dir, speed);
        const h = sampler.height(pos2.x, pos2.y);
        group.position.set(pos2.x, Math.max(h + 0.15, -0.5), pos2.y);
        const angleY = Math.atan2(dir.x, dir.y);
        group.rotation.y = angleY;
      }

      // Throttled behavioural sync back to the store (for the inspector),
      // not every frame — keeps this a cheap, mostly-imperative simulation.
      rt.syncTimer -= dt;
      if (rt.syncTimer <= 0) {
        rt.syncTimer = 1.2;
        const hunger = Math.min(100, c.hunger + dt * 0.6);
        const energy = Math.max(0, c.energy - (resting ? -dt * 4 : dt * 1.1));
        const age = c.age + dt * 0.02;
        let state: CreatureData["state"] = c.state;
        if (energy < 20) state = "resting";
        else if (hunger > 55) state = "seeking food";
        else if (state !== "wandering") state = energy > 60 ? "wandering" : state;

        if (hunger >= 100) {
          rt.deathTimer += 1.2;
          if (rt.deathTimer > 6) {
            store.removeCreature(c.id);
            continue;
          }
        } else {
          rt.deathTimer = 0;
        }

        rt.reproCooldown -= 1.2;
        if (rt.reproCooldown <= 0 && energy > 75 && hunger < 25 && Object.keys(store.creatures).length < 40) {
          rt.reproCooldown = 40 + Math.random() * 40;
          const id = `creature-spawn-${spawnCounter++}-${Date.now()}`;
          store.addCreature({
            id,
            position: [group.position.x + (Math.random() - 0.5) * 3, group.position.y, group.position.z + (Math.random() - 0.5) * 3],
            velocity: [0, 0, 0],
            age: 0,
            energy: 70,
            hunger: 20,
            state: "wandering",
            species: c.species,
          });
        }

        store.updateCreature(c.id, {
          hunger,
          energy,
          age,
          state,
          position: [group.position.x, group.position.y, group.position.z],
        });
      }
    }
  });

  return (
    <group>
      {list.map((c) => (
        <CreatureMesh
          key={c.id}
          setRef={(node) => {
            if (node) groupRefs.current.set(c.id, node);
            else groupRefs.current.delete(c.id);
          }}
          onClick={() => handleEntityClick("creature", c.id)}
          onDoubleClick={() => {
            const g = groupRefs.current.get(c.id);
            const pos: [number, number, number] = g
              ? [g.position.x, g.position.y, g.position.z]
              : c.position;
            handleEntityDoubleClick(pos, 10);
          }}
        />
      ))}
    </group>
  );
}
