import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { handleEntityClick, handleEntityDoubleClick } from "../tools/toolActions";
import type { BuildingData, BuildingMaterial } from "../types";
import { Fire } from "../materials/Fire";
import { getWindowTexture } from "../materials/textures";

const MATERIAL_COLOR: Record<BuildingMaterial, string> = {
  concrete: "#9aa0ab",
  wood: "#a9714a",
  metal: "#b7c3cc",
  glass: "#4fc1e8",
  stone: "#c7ac82",
};

const ROOF_COLOR: Record<BuildingMaterial, string> = {
  concrete: "#3a3f48",
  wood: "#6b2f2a",
  metal: "#454c54",
  glass: "#2e3742",
  stone: "#4a4136",
};

/** Deterministically jitters a base color per building so a street of
 * "concrete" buildings doesn't read as one flat, identical color. */
function jitteredColor(baseHex: string, colorSeed: number): THREE.Color {
  const c = new THREE.Color(baseHex);
  const hue = (colorSeed - 0.5) * 0.07;
  const sat = (((colorSeed * 7) % 1) - 0.5) * 0.22;
  const light = (((colorSeed * 13) % 1) - 0.5) * 0.16;
  c.offsetHSL(hue, sat, light);
  return c;
}

function BuildingMesh({ building }: { building: BuildingData }) {
  const selection = useSimulationStore((s) => s.selection);
  const isSelected = selection?.kind === "building" && selection.id === building.id;
  const isGlass = building.material === "glass";
  const damageRatio = 1 - building.structuralHealth / 100;
  const windowMap = useMemo(() => getWindowTexture(building.floors), [building.floors]);
  const color = useMemo(
    () => jitteredColor(MATERIAL_COLOR[building.material], building.colorSeed),
    [building.material, building.colorSeed]
  );
  const roofColor = ROOF_COLOR[building.material];
  const roofSize: [number, number, number] = [building.size[0] * 0.92, 0.6, building.size[2] * 0.92];

  const geometry = (
    <boxGeometry args={[building.size[0], building.size[1], building.size[2]]} />
  );

  const material = building.burning ? (
    <meshStandardMaterial
      color={color}
      roughness={0.8}
      metalness={0.05}
      emissive="#e8573d"
      emissiveIntensity={0.55 + damageRatio * 0.4}
    />
  ) : (
    <meshStandardMaterial
      color={color}
      roughness={isGlass ? 0.15 : 0.75}
      metalness={isGlass ? 0.3 : building.material === "metal" ? 0.5 : 0.05}
      transparent={isGlass}
      opacity={isGlass ? 0.78 : 1}
      emissive="#ffd9a0"
      emissiveMap={windowMap}
      emissiveIntensity={0.85}
    />
  );

  const onClick = (e: any) => {
    e.stopPropagation();
    handleEntityClick("building", building.id);
  };
  const onDoubleClick = (e: any) => {
    e.stopPropagation();
    handleEntityDoubleClick(building.position, Math.max(building.size[0], building.size[2]) * 1.6 + 8);
  };

  if (building.collapsed) {
    return (
      <RigidBody
        type="dynamic"
        colliders="cuboid"
        position={[building.position[0], building.position[1] * 0.4, building.position[2]]}
        rotation={[0.3, 0.15, 0.2]}
      >
        <mesh castShadow receiveShadow onClick={onClick} onDoubleClick={onDoubleClick}>
          {geometry}
          {material}
        </mesh>
      </RigidBody>
    );
  }

  return (
    <RigidBody type="fixed" colliders="cuboid" position={building.position}>
      <mesh castShadow receiveShadow onClick={onClick} onDoubleClick={onDoubleClick}>
        {geometry}
        {material}
        {isSelected && <Outlines thickness={2} color="#57d9c4" />}
      </mesh>
      {!building.burning && (
        <mesh position={[0, building.size[1] / 2 + 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={roofSize} />
          <meshStandardMaterial color={roofColor} roughness={0.9} metalness={0.1} />
        </mesh>
      )}
      {building.burning && (
        <Fire position={[0, building.size[1] / 2, 0]} scale={Math.max(1, building.size[0] / 6)} ambient />
      )}
    </RigidBody>
  );
}

export function Buildings() {
  const buildings = useSimulationStore((s) => s.buildings);
  const list = useMemo(() => Object.values(buildings), [buildings]);
  return (
    <group>
      {list.map((b) => (
        <BuildingMesh key={b.id} building={b} />
      ))}
    </group>
  );
}
