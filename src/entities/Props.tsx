import { RigidBody } from "@react-three/rapier";
import { Outlines } from "@react-three/drei";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { handleEntityClick } from "../tools/toolActions";
import { Water } from "../materials/Water";
import { Fire } from "../materials/Fire";
import { Sand } from "../materials/Sand";
import type { PropData } from "../types";

function SelectableRigidProp({ prop }: { prop: PropData }) {
  const selection = useSimulationStore((s) => s.selection);
  const isSelected = selection?.kind === "prop" && selection.id === prop.id;

  const onClick = (e: any) => {
    e.stopPropagation();
    handleEntityClick("prop", prop.id);
  };

  if (prop.kind === "box") {
    return (
      <RigidBody type="dynamic" colliders="cuboid" position={prop.position} restitution={0.2} friction={0.6}>
        <mesh castShadow receiveShadow onClick={onClick}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#c9d3dc" roughness={0.5} metalness={0.2} />
          {isSelected && <Outlines thickness={2} color="#57d9c4" />}
        </mesh>
      </RigidBody>
    );
  }

  if (prop.kind === "sphere") {
    return (
      <RigidBody type="dynamic" colliders="ball" position={prop.position} restitution={0.55} friction={0.3}>
        <mesh castShadow receiveShadow onClick={onClick}>
          <sphereGeometry args={[0.85, 20, 20]} />
          <meshStandardMaterial color="#57d9c4" roughness={0.3} metalness={0.3} />
          {isSelected && <Outlines thickness={2} color="#57d9c4" />}
        </mesh>
      </RigidBody>
    );
  }

  if (prop.kind === "rock") {
    return (
      <RigidBody type="dynamic" colliders="hull" position={prop.position} restitution={0.1} friction={0.9}>
        <mesh castShadow receiveShadow onClick={onClick}>
          <icosahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial color="#6b6459" roughness={1} />
          {isSelected && <Outlines thickness={2} color="#57d9c4" />}
        </mesh>
      </RigidBody>
    );
  }

  if (prop.kind === "vehicle") {
    return (
      <RigidBody type="dynamic" colliders="cuboid" position={prop.position} restitution={0.1} friction={0.7}>
        <group onClick={onClick}>
          <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
            <boxGeometry args={[1.8, 0.7, 3.4]} />
            <meshStandardMaterial color="#e8a33d" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.75, -0.3]}>
            <boxGeometry args={[1.5, 0.5, 1.6]} />
            <meshStandardMaterial color="#2a2e36" roughness={0.2} metalness={0.1} />
          </mesh>
          {isSelected && <Outlines thickness={2} color="#57d9c4" />}
        </group>
      </RigidBody>
    );
  }

  return null;
}

export function Props() {
  const props = useSimulationStore((s) => s.props);

  return (
    <group>
      {props.map((p) => {
        if (p.kind === "water") return <Water key={p.id} id={p.id} position={p.position} />;
        if (p.kind === "sand") return <Sand key={p.id} id={p.id} position={p.position} />;
        if (p.kind === "fire") return <Fire key={p.id} position={p.position} scale={1.1} />;
        return <SelectableRigidProp key={p.id} prop={p} />;
      })}
    </group>
  );
}
