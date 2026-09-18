import { useMemo } from "react";
import { useSimulationStore } from "../simulation/useSimulationStore";
import type { RoadSegment } from "../types";

function RoadMesh({ road }: { road: RoadSegment }) {
  const [x1, z1] = road.start;
  const [x2, z2] = road.end;
  const length = Math.hypot(x2 - x1, z2 - z1);
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const angle = Math.atan2(z2 - z1, x2 - x1);

  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, road.width]} />
        <meshStandardMaterial color="#1b1f27" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.16]} />
        <meshStandardMaterial color="#41505f" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Roads() {
  const roads = useSimulationStore((s) => s.roads);
  const items = useMemo(() => roads, [roads]);
  return (
    <group>
      {items.map((r) => (
        <RoadMesh key={r.id} road={r} />
      ))}
    </group>
  );
}
