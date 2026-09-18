import { useMemo } from "react";
import { Footprints, Globe as GlobeIcon } from "lucide-react";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { CITY_BLOCK_RADIUS } from "../generation/cityGenerator";
import { SCALE_ORDER } from "../camera/scalePresets";
import type { ScaleLevel } from "../types";
import { playUiTick } from "./sound";

const MAP_SIZE = 132;

function project(x: number, z: number) {
  const px = (x / (CITY_BLOCK_RADIUS * 1.15)) * (MAP_SIZE / 2) + MAP_SIZE / 2;
  const pz = (z / (CITY_BLOCK_RADIUS * 1.15)) * (MAP_SIZE / 2) + MAP_SIZE / 2;
  return [px, pz];
}

const SCALE_LABEL: Record<ScaleLevel, string> = {
  planet: "Planet",
  city: "City",
  street: "Street",
  building: "Building",
};

export function Minimap() {
  const buildings = useSimulationStore((s) => s.buildings);
  const cameraPos = useSimulationStore((s) => s.cameraPos);
  const scaleLevel = useSimulationStore((s) => s.scaleLevel);
  const setScaleLevel = useSimulationStore((s) => s.setScaleLevel);
  const firstPerson = useSimulationStore((s) => s.firstPerson);
  const toggleFirstPerson = useSimulationStore((s) => s.toggleFirstPerson);

  const dots = useMemo(
    () =>
      Object.values(buildings).map((b) => {
        const [x, y] = project(b.position[0], b.position[2]);
        return { x, y, id: b.id, burning: b.burning, collapsed: b.collapsed };
      }),
    [buildings]
  );

  const [camX, camY] = project(cameraPos[0], cameraPos[2]);

  return (
    <div className="glass-panel pointer-events-auto absolute bottom-4 right-4 rounded-lg p-2.5 shadow-lg">
      <svg width={MAP_SIZE} height={MAP_SIZE} className="rounded-md bg-black/30">
        <line x1={MAP_SIZE / 2} y1={0} x2={MAP_SIZE / 2} y2={MAP_SIZE} stroke="#ffffff10" />
        <line x1={0} y1={MAP_SIZE / 2} x2={MAP_SIZE} y2={MAP_SIZE / 2} stroke="#ffffff10" />
        {dots.map((d) => (
          <circle
            key={d.id}
            cx={d.x}
            cy={d.y}
            r={1.1}
            fill={d.collapsed ? "#556277" : d.burning ? "#e8573d" : "#57d9c4"}
            opacity={0.75}
          />
        ))}
        <circle cx={camX} cy={camY} r={2.6} fill="#e8a33d" stroke="#0a0e15" strokeWidth={0.6} />
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-1">
        {SCALE_ORDER.map((level) => (
          <button
            key={level}
            onClick={() => {
              setScaleLevel(level);
              playUiTick(650);
            }}
            className={`data-label rounded-md border px-1.5 py-1 text-[10px] uppercase tracking-wide transition ${
              scaleLevel === level
                ? "border-signal-dim bg-signal/15 text-signal"
                : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
            }`}
          >
            {SCALE_LABEL[level]}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          toggleFirstPerson();
          playUiTick(firstPerson ? 500 : 850);
        }}
        className={`data-label mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] uppercase tracking-wide transition ${
          firstPerson
            ? "border-signal-dim bg-signal/15 text-signal"
            : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
        }`}
      >
        {firstPerson ? <Footprints size={12} /> : <GlobeIcon size={12} />}
        {firstPerson ? "First-person" : "Free camera"}
      </button>
    </div>
  );
}
