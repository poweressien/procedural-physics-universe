import { RigidBody } from "@react-three/rapier";
import { mulberry32, hashString } from "../world/prng";
import type { Vec3 } from "../types";

const GRAIN_COUNT = 14;

export function Sand({ id, position }: { id: string; position: Vec3 }) {
  const rng = mulberry32(hashString(id));
  const grains = Array.from({ length: GRAIN_COUNT }, () => ({
    offset: [(rng() - 0.5) * 1.4, rng() * 1.6, (rng() - 0.5) * 1.4] as Vec3,
    radius: 0.12 + rng() * 0.08,
  }));

  return (
    <group>
      {grains.map((g, i) => (
        <RigidBody
          key={i}
          type="dynamic"
          colliders="ball"
          position={[position[0] + g.offset[0], position[1] + g.offset[1], position[2] + g.offset[2]]}
          restitution={0.02}
          friction={1.2}
          linearDamping={0.5}
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[g.radius, 8, 8]} />
            <meshStandardMaterial color="#d8c08a" roughness={1} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
