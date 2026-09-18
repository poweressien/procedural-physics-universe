import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";

const SUN_DISTANCE = 340;

// Color stops keyed by sun height (-1 = midnight, 0 = horizon, 1 = noon).
const NIGHT: [number, number, number] = [0.08, 0.11, 0.22];
const DAWN: [number, number, number] = [1.0, 0.55, 0.32];
const NOON: [number, number, number] = [1.0, 0.96, 0.88];

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function DayNightCycle() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const colorScratch = useRef(new THREE.Color());

  useFrame(() => {
    const simYear = useSimulationStore.getState().simYear;
    const totalHours = simYear * 365 * 24;
    const dayFraction = ((totalHours % 24) + 24) % 24 / 24;
    const angle = (dayFraction - 0.5) * Math.PI * 2;
    const height = Math.cos(angle); // 1 = noon, -1 = midnight
    const x = Math.sin(angle) * SUN_DISTANCE;
    const y = height * SUN_DISTANCE * 0.6 + 40;
    const z = SUN_DISTANCE * 0.35;

    const sun = sunRef.current;
    const hemi = hemiRef.current;
    if (!sun || !hemi) return;

    sun.position.set(x, y, z);

    const dayAmount = Math.max(0, height);
    const horizonAmount = 1 - Math.min(1, Math.abs(height) / 0.35);

    let rgb: [number, number, number];
    if (height < -0.05) rgb = NIGHT;
    else rgb = lerp3(lerp3(NIGHT, DAWN, Math.max(0, horizonAmount)), NOON, Math.pow(dayAmount, 0.6));

    colorScratch.current.setRGB(rgb[0], rgb[1], rgb[2]);
    sun.color.copy(colorScratch.current);
    sun.intensity = 0.15 + dayAmount * 1.75 + horizonAmount * 0.3;

    hemi.intensity = 0.18 + dayAmount * 0.5;
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={["#3a4d5c", "#0a0e15", 0.55]} />
      <directionalLight
        ref={sunRef}
        position={[180, 220, 120]}
        intensity={1.6}
        color="#fff2df"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-camera-far={900}
      />
    </>
  );
}
