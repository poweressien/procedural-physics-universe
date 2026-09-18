import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulationStore } from "../simulation/useSimulationStore";

const FIELD = 220; // radius around the camera that precipitation fills
const HEIGHT = 90;

function Precipitation({ kind, wind }: { kind: "rain" | "snow"; wind: number }) {
  const count = kind === "rain" ? 3200 : 900;
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * FIELD * 2;
      positions[i * 3 + 1] = Math.random() * HEIGHT;
      positions[i * 3 + 2] = (Math.random() - 0.5) * FIELD * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  const points = useRef<THREE.Points>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const store = useSimulationStore.getState();
    if (store.paused || !points.current) return;
    const dt = Math.min(delta, 0.1) * Math.min(store.timeScale, 20);
    const fallSpeed = kind === "rain" ? 42 : 6;
    const posAttr = points.current.geometry.attributes.position as THREE.BufferAttribute;
    const windShift = (wind / 40) * (kind === "rain" ? 1 : 0.4);
    for (let i = 0; i < count; i++) {
      let y = posAttr.getY(i) - fallSpeed * dt;
      let x = posAttr.getX(i) + windShift * dt * 6;
      if (y < 0) {
        y = HEIGHT;
        x = camera.position.x + (Math.random() - 0.5) * FIELD * 2;
        posAttr.setZ(i, camera.position.z + (Math.random() - 0.5) * FIELD * 2);
      }
      posAttr.setX(i, x);
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
    points.current.position.x = 0;
    points.current.position.z = 0;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={kind === "rain" ? 0.28 : 0.6}
        color={kind === "rain" ? "#8fb6cc" : "#ffffff"}
        transparent
        opacity={kind === "rain" ? 0.55 : 0.85}
        sizeAttenuation
      />
    </points>
  );
}

function Lightning() {
  const light = useRef<THREE.PointLight>(null);
  const timer = useRef(2 + Math.random() * 4);

  useFrame((_, delta) => {
    const store = useSimulationStore.getState();
    if (store.paused || !light.current) return;
    timer.current -= delta * Math.min(store.timeScale, 10);
    if (timer.current <= 0) {
      light.current.intensity = 18;
      timer.current = 4 + Math.random() * 8;
    } else {
      light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, 0, 0.15);
    }
  });

  return <pointLight ref={light} position={[0, 120, 0]} color="#cfe3ff" distance={600} decay={1} />;
}

export function WeatherSystem() {
  const weatherType = useSimulationStore((s) => s.weatherType);
  const wind = useSimulationStore((s) => s.wind);
  const scaleLevel = useSimulationStore((s) => s.scaleLevel);

  const fogColor = useMemo(() => {
    switch (weatherType) {
      case "fog":
        return "#7a8a99";
      case "storm":
        return "#20262e";
      case "rain":
        return "#41505d";
      case "snow":
        return "#aab7c2";
      default:
        return "#0a0e15";
    }
  }, [weatherType]);

  const fogNear = weatherType === "fog" ? 12 : weatherType === "storm" ? 40 : 90;
  const fogFar = weatherType === "fog" ? 130 : weatherType === "storm" ? 380 : weatherType === "clear" ? 1000 : 520;

  if (scaleLevel === "planet") return null;

  return (
    <>
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      {(weatherType === "rain" || weatherType === "storm") && <Precipitation kind="rain" wind={wind} />}
      {weatherType === "snow" && <Precipitation kind="snow" wind={wind} />}
      {weatherType === "storm" && <Lightning />}
    </>
  );
}
