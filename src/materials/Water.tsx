import { RigidBody } from "@react-three/rapier";
import { mulberry32, hashString } from "../world/prng";
import type { Vec3 } from "../types";

const DROPLET_COUNT = 6;

export function Water({ id, position }: { id: string; position: Vec3 }) {
  const rng = mulberry32(hashString(id));
  const droplets = Array.from({ length: DROPLET_COUNT }, () => ({
    offset: [
      (rng() - 0.5) * 1.6,
      rng() * 1.2,
      (rng() - 0.5) * 1.6,
    ] as Vec3,
    radius: 0.28 + rng() * 0.2,
  }));

  return (
    <group>
      {droplets.map((d, i) => (
        <RigidBody
          key={i}
          type="dynamic"
          colliders="ball"
          position={[position[0] + d.offset[0], position[1] + d.offset[1], position[2] + d.offset[2]]}
          restitution={0.15}
          friction={0.05}
          linearDamping={0.4}
        >
          <mesh castShadow>
            <sphereGeometry args={[d.radius, 12, 12]} />
            <meshStandardMaterial
              color="#3d8fc4"
              transparent
              opacity={0.72}
              roughness={0.05}
              metalness={0.15}
            />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}
