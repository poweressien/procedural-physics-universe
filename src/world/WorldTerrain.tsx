import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { createTerrainSampler, SEA_LEVEL, TERRAIN_SIZE } from "./terrain";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { handleGroundClick } from "../tools/toolActions";

const RESOLUTION = 140;
const PHYSICS_GROUND_SIZE = 620;

function buildTerrainGeometry(seed: number): THREE.BufferGeometry {
  const sampler = createTerrainSampler(seed);
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, RESOLUTION, RESOLUTION);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = sampler.height(x, z);
    pos.setY(i, h);
    const [r, g, b] = sampler.color(x, z, h);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export function WorldTerrain() {
  const seed = useSimulationStore((s) => s.seed);
  const geometry = useMemo(() => buildTerrainGeometry(seed), [seed]);
  const seaRef = useRef<THREE.Mesh>(null);
  const seaMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (seaRef.current) seaRef.current.position.y = SEA_LEVEL + Math.sin(t * 0.35) * 0.06;
    if (seaMatRef.current) seaMatRef.current.opacity = 0.72 + Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group>
      <mesh
        geometry={geometry}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          handleGroundClick(e.point);
        }}
      >
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>

      {/* Sea */}
      <mesh ref={seaRef} position={[0, SEA_LEVEL, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE]} />
        <meshStandardMaterial
          ref={seaMatRef}
          color="#1d6c94"
          transparent
          opacity={0.75}
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* Flat physics ground beneath the playable city area — see README for the
          simplification this represents (visual terrain vs. simulated terrain). */}
      <RigidBody type="fixed" colliders="cuboid" friction={0.9}>
        <mesh position={[0, -0.5, 0]} visible={false}>
          <boxGeometry args={[PHYSICS_GROUND_SIZE, 1, PHYSICS_GROUND_SIZE]} />
        </mesh>
      </RigidBody>
    </group>
  );
}
