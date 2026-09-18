import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { handleEntityClick, handleEntityDoubleClick } from "../tools/toolActions";
import type { VehicleData } from "../types";

interface RoadLine {
  start: THREE.Vector2;
  end: THREE.Vector2;
  length: number;
}

const LOOKAHEAD = 7;
const OBSTACLE_RADIUS = 2.6;

function VehicleMesh({
  vehicle,
  setGroupRef,
  setBrakeRef,
  onClick,
  onDoubleClick,
}: {
  vehicle: VehicleData;
  setGroupRef: (node: THREE.Group | null) => void;
  setBrakeRef: (node: THREE.Mesh | null) => void;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const isTruck = vehicle.kind === "truck";
  return (
    <group ref={setGroupRef} onClick={onClick} onDoubleClick={onDoubleClick}>
      <mesh castShadow receiveShadow position={[0, isTruck ? 0.55 : 0.35, 0]}>
        <boxGeometry args={isTruck ? [2.1, 1.1, 5.2] : [1.8, 0.7, 3.4]} />
        <meshStandardMaterial color={vehicle.color} roughness={0.4} metalness={0.35} />
      </mesh>
      {!isTruck && (
        <mesh castShadow position={[0, 0.75, -0.3]}>
          <boxGeometry args={[1.5, 0.5, 1.6]} />
          <meshStandardMaterial color="#20242c" roughness={0.2} metalness={0.1} />
        </mesh>
      )}
      <mesh ref={setBrakeRef} position={[0, isTruck ? 0.55 : 0.35, isTruck ? 2.6 : 1.7]} visible={false}>
        <boxGeometry args={[isTruck ? 2.1 : 1.8, 0.15, 0.05]} />
        <meshStandardMaterial color="#e8573d" emissive="#e8573d" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

export function Vehicles() {
  const vehicles = useSimulationStore((s) => s.vehicles);
  const roads = useSimulationStore((s) => s.roads);

  const roadLines = useMemo(() => {
    const map = new Map<string, RoadLine>();
    for (const r of roads) {
      const start = new THREE.Vector2(r.start[0], r.start[1]);
      const end = new THREE.Vector2(r.end[0], r.end[1]);
      map.set(r.id, { start, end, length: start.distanceTo(end) });
    }
    return map;
  }, [roads]);

  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const brakeRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const runtime = useRef<Map<string, { t: number; dir: 1 | -1; speedFactor: number }>>(new Map());

  useMemo(() => {
    runtime.current = new Map(vehicles.map((v) => [v.id, { t: v.t, dir: v.direction, speedFactor: 1 }]));
  }, [vehicles]);

  useFrame((_, delta) => {
    const store = useSimulationStore.getState();
    if (store.paused) return;
    const dt = Math.min(delta, 0.1) * store.timeScale;
    const props = store.props;

    for (const v of vehicles) {
      const line = roadLines.get(v.roadId);
      const group = groupRefs.current.get(v.id);
      const rt = runtime.current.get(v.id);
      if (!line || !group || !rt) continue;

      const dirVec = new THREE.Vector2().subVectors(line.end, line.start).normalize();
      const pos2 = new THREE.Vector2().lerpVectors(line.start, line.end, rt.t);
      const ahead = pos2.clone().addScaledVector(dirVec, LOOKAHEAD * rt.dir);

      let blocked = false;
      for (const p of props) {
        if (p.kind !== "box" && p.kind !== "sphere" && p.kind !== "rock" && p.kind !== "vehicle") continue;
        const dx = p.position[0] - ahead.x;
        const dz = p.position[2] - ahead.y;
        if (dx * dx + dz * dz < OBSTACLE_RADIUS * OBSTACLE_RADIUS) {
          blocked = true;
          break;
        }
      }

      const target = blocked ? 0 : 1;
      rt.speedFactor += (target - rt.speedFactor) * Math.min(1, dt * 3);

      const speedMS = (v.speed / 3.6) * rt.speedFactor;
      const dt_t = (speedMS / Math.max(1, line.length)) * rt.dir * dt;
      rt.t += dt_t;
      if (rt.t >= 1) {
        rt.t = 1;
        rt.dir = -1;
      } else if (rt.t <= 0) {
        rt.t = 0;
        rt.dir = 1;
      }

      const finalPos = new THREE.Vector2().lerpVectors(line.start, line.end, rt.t);
      group.position.set(finalPos.x, 0.05, finalPos.y);
      const angle = Math.atan2(dirVec.y * rt.dir, dirVec.x * rt.dir);
      group.rotation.y = -angle + Math.PI / 2;

      const brake = brakeRefs.current.get(v.id);
      if (brake) brake.visible = rt.speedFactor < 0.35;
    }
  });

  return (
    <group>
      {vehicles.map((v) => (
        <VehicleMesh
          key={v.id}
          vehicle={v}
          setGroupRef={(node) => {
            if (node) groupRefs.current.set(v.id, node);
            else groupRefs.current.delete(v.id);
          }}
          setBrakeRef={(node) => {
            if (node) brakeRefs.current.set(v.id, node);
            else brakeRefs.current.delete(v.id);
          }}
          onClick={() => handleEntityClick("vehicle", v.id)}
          onDoubleClick={() => {
            const g = groupRefs.current.get(v.id);
            const pos: [number, number, number] = g
              ? [g.position.x, g.position.y, g.position.z]
              : [0, 0, 0];
            handleEntityDoubleClick(pos, 16);
          }}
        />
      ))}
    </group>
  );
}
