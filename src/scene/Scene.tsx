import { Suspense } from "react";
import { Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { WorldTerrain } from "../world/WorldTerrain";
import { Vegetation } from "../world/Vegetation";
import { Roads } from "../entities/Roads";
import { Buildings } from "../entities/Buildings";
import { Vehicles } from "../entities/Vehicles";
import { Creatures } from "../entities/Creatures";
import { Props } from "../entities/Props";
import { GravityWells } from "../entities/GravityWells";
import { WeatherSystem } from "../weather/WeatherSystem";
import { SimulationLoop } from "../simulation/SimulationLoop";
import { CameraRig } from "../camera/CameraRig";
import { DayNightCycle } from "./DayNightCycle";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { Planet } from "./Planet";

const G = 9.81;

export function Scene() {
  const magnitude = useSimulationStore((s) => s.gravityMagnitude);
  const direction = useSimulationStore((s) => s.gravityDirection);
  const scaleLevel = useSimulationStore((s) => s.scaleLevel);
  const gravity: [number, number, number] = [0, -G * magnitude * direction, 0];
  const groundVisible = scaleLevel !== "planet";

  return (
    <>
      <color attach="background" args={["#05070b"]} />
      <Stars radius={2400} depth={600} count={3400} factor={4} saturation={0} fade speed={0.3} />

      <DayNightCycle />
      <SceneErrorBoundary>
        <Suspense fallback={null}>
          <Planet />
        </Suspense>
      </SceneErrorBoundary>

      <CameraRig />

      <Suspense fallback={null}>
        <Physics gravity={gravity}>
          <SimulationLoop />
          {/* Hidden (not unmounted) at planet scale — physics keeps running
              underneath, it just isn't drawn, so it can't show through the
              planet view at a bad angle, and nothing resets when you
              zoom back in. */}
          <group visible={groundVisible}>
            <WorldTerrain />
            <Vegetation />
            <Roads />
            <Buildings />
            <Vehicles />
            <Creatures />
            <Props />
            <GravityWells />
          </group>
        </Physics>
      </Suspense>

      <WeatherSystem />

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.35} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  );
}
