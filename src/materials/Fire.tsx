import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Vec3 } from "../types";

interface FireProps {
  position: Vec3;
  scale?: number;
  ambient?: boolean;
}

export function Fire({ position, scale = 1, ambient = false }: FireProps) {
  const light = useRef<THREE.PointLight>(null);
  const core = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const flicker = 0.75 + Math.sin(state.clock.elapsedTime * 14 + position[0]) * 0.15 + Math.random() * 0.1;
    if (light.current) light.current.intensity = flicker * 3.2 * scale;
    if (core.current) {
      core.current.scale.setScalar(scale * (0.9 + Math.sin(state.clock.elapsedTime * 10) * 0.08));
    }
  });

  return (
    <group position={position}>
      <mesh ref={core}>
        <coneGeometry args={[0.5 * scale, 1.4 * scale, 8]} />
        <meshStandardMaterial
          color="#ff8a3d"
          emissive="#ff6a2d"
          emissiveIntensity={2.2}
          transparent
          opacity={0.85}
        />
      </mesh>
      <Sparkles
        count={ambient ? 18 : 30}
        scale={[1.4 * scale, 2.6 * scale, 1.4 * scale]}
        size={3}
        speed={0.6}
        color="#e8a33d"
        opacity={0.9}
      />
      <pointLight ref={light} color="#ff7a33" distance={10 * scale} decay={2} />
    </group>
  );
}
