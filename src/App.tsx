import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Scene } from "./scene/Scene";
import { HUD } from "./ui/HUD";
import { TimePanel } from "./ui/TimePanel";
import { Toolbar } from "./ui/Toolbar";
import { Inspector } from "./ui/Inspector";
import { GravityPanel } from "./ui/GravityPanel";
import { WeatherPanel } from "./ui/WeatherPanel";
import { SeedPanel } from "./ui/SeedPanel";
import { ExperimentPanel } from "./ui/ExperimentPanel";
import { Minimap } from "./ui/Minimap";
import { LoadingScreen } from "./ui/LoadingScreen";
import { SCALE_PRESETS } from "./camera/scalePresets";
import { useSimulationStore } from "./simulation/useSimulationStore";

export default function App() {
  const playIntroLoading = useSimulationStore((s) => s.playIntroLoading);

  useEffect(() => {
    playIntroLoading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      <Canvas
        shadows
        camera={{ position: SCALE_PRESETS.city.position, fov: 55, near: 0.1, far: 3200 }}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Scene />
      </Canvas>

      <div className="pointer-events-none absolute inset-0">
        <HUD />
        <TimePanel />
        <SeedPanel />
        <Inspector />
        <GravityPanel />
        <WeatherPanel />
        <ExperimentPanel />
        <Minimap />
        <Toolbar />
      </div>

      <LoadingScreen />
    </div>
  );
}
