import {
  MousePointer2,
  Wand2,
  Trash2,
  Orbit,
  Droplet,
  Flame,
  Layers,
  CloudRain,
  Clock,
  Box,
  Circle,
  Home,
  Building2,
  Factory,
  Car,
  Truck,
  PawPrint,
  TreePine,
  Mountain,
} from "lucide-react";
import { useSimulationStore } from "../simulation/useSimulationStore";
import type { CreateCategory, CreateItem, ToolId } from "../types";
import { playUiTick } from "./sound";

const TOOLS: { id: ToolId; label: string; icon: React.ComponentType<any> }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "create", label: "Create", icon: Wand2 },
  { id: "destroy", label: "Destroy", icon: Trash2 },
  { id: "gravity", label: "Gravity", icon: Orbit },
  { id: "water", label: "Water", icon: Droplet },
  { id: "fire", label: "Fire", icon: Flame },
  { id: "sand", label: "Sand", icon: Layers },
  { id: "weather", label: "Weather", icon: CloudRain },
  { id: "time", label: "Time", icon: Clock },
];

const CATEGORIES: { id: CreateCategory; label: string }[] = [
  { id: "objects", label: "Objects" },
  { id: "buildings", label: "Buildings" },
  { id: "vehicles", label: "Vehicles" },
  { id: "creatures", label: "Creatures" },
  { id: "terrain", label: "Terrain" },
];

const ITEMS: Record<CreateCategory, { id: CreateItem; label: string; icon: React.ComponentType<any> }[]> = {
  objects: [
    { id: "box", label: "Box", icon: Box },
    { id: "sphere", label: "Sphere", icon: Circle },
  ],
  buildings: [
    { id: "house", label: "House", icon: Home },
    { id: "tower", label: "Tower", icon: Building2 },
    { id: "factory", label: "Factory", icon: Factory },
  ],
  vehicles: [
    { id: "sedan", label: "Sedan", icon: Car },
    { id: "truck", label: "Truck", icon: Truck },
  ],
  creatures: [{ id: "critter", label: "Critter", icon: PawPrint }],
  terrain: [
    { id: "tree", label: "Tree", icon: TreePine },
    { id: "hill", label: "Boulder", icon: Mountain },
  ],
};

function CreateSubPanel() {
  const createCategory = useSimulationStore((s) => s.createCategory);
  const createItem = useSimulationStore((s) => s.createItem);
  const setCreateCategory = useSimulationStore((s) => s.setCreateCategory);
  const setCreateItem = useSimulationStore((s) => s.setCreateItem);

  return (
    <div className="glass-panel mb-2 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCreateCategory(c.id);
              playUiTick(680);
            }}
            className={`data-label rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition ${
              createCategory === c.id
                ? "border-signal-dim bg-signal/15 text-signal"
                : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {ITEMS[createCategory].map((item) => {
          const Icon = item.icon;
          const active = createItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCreateItem(item.id);
                playUiTick(760);
              }}
              className={`flex flex-col items-center gap-1 rounded-md border px-3 py-1.5 transition ${
                active
                  ? "border-signal-dim bg-signal/15 text-signal"
                  : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
              }`}
            >
              <Icon size={16} />
              <span className="data-label text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
      {createItem ? (
        <div className="data-label mt-2 text-[10px] text-ink-faint">
          Click the ground to place a <span className="text-signal">{createItem}</span>.
        </div>
      ) : (
        <div className="data-label mt-2 text-[10px] text-ink-faint">Pick something to create.</div>
      )}
    </div>
  );
}

export function Toolbar() {
  const activeTool = useSimulationStore((s) => s.activeTool);
  const setActiveTool = useSimulationStore((s) => s.setActiveTool);

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2">
      {activeTool === "create" && <CreateSubPanel />}
      <div className="glass-panel flex items-center gap-1 rounded-xl px-2 py-2 shadow-xl">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          const active = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                playUiTick(active ? 500 : 700);
              }}
              title={tool.label}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition ${
                active
                  ? "bg-signal/15 text-signal shadow-[0_0_0_1px_rgba(87,217,196,0.35)]"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink"
              }`}
            >
              <Icon size={18} />
              <span className="data-label text-[9px] uppercase tracking-wide">{tool.label}</span>
            </button>
          );
        })}
      </div>
      <div className="data-label mt-1.5 text-center text-[9px] text-ink-faint">
        WASD move · Shift sprint · Space/Ctrl up-down · drag to orbit · scroll to zoom · double-click to fly in
      </div>
    </div>
  );
}
