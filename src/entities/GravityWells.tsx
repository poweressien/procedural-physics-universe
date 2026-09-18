import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";

function WellMarker({ position }: { position: [number, number, number] }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ring.current) {
      ring.current.rotation.z = state.clock.elapsedTime * 0.6;
      const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;
      ring.current.scale.set(s, s, s);
    }
  });
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#57d9c4" emissive="#57d9c4" emissiveIntensity={1.4} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.05, 8, 32]} />
        <meshBasicMaterial color="#57d9c4" transparent opacity={0.6} />
      </mesh>
      <pointLight color="#57d9c4" intensity={2} distance={12} />
    </group>
  );
}

export function GravityWells() {
  const wells = useSimulationStore((s) => s.gravityWells);
  return (
    <group>
      {wells.map((w) => (
        <WellMarker key={w.id} position={w.position} />
      ))}
    </group>
  );
}
