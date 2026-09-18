import { Instance, Instances } from "@react-three/drei";
import { useSimulationStore } from "../simulation/useSimulationStore";

export function Vegetation() {
  const vegetation = useSimulationStore((s) => s.vegetation);

  return (
    <group>
      <Instances limit={vegetation.length} castShadow>
        <coneGeometry args={[0.9, 2.6, 6]} />
        <meshStandardMaterial color="#1f5c3a" roughness={0.9} />
        {vegetation.map((v, i) => (
          <Instance
            key={i}
            position={[v.position[0], v.position[1] + 1.3 * v.scale, v.position[2]]}
            scale={v.scale}
          />
        ))}
      </Instances>
      <Instances limit={vegetation.length}>
        <cylinderGeometry args={[0.14, 0.18, 1, 5]} />
        <meshStandardMaterial color="#4a3626" roughness={1} />
        {vegetation.map((v, i) => (
          <Instance
            key={i}
            position={[v.position[0], v.position[1] + 0.5 * v.scale, v.position[2]]}
            scale={v.scale}
          />
        ))}
      </Instances>
    </group>
  );
}
