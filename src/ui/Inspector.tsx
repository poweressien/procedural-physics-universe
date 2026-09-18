import { useSimulationStore } from "../simulation/useSimulationStore";
import { playUiTick } from "./sound";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="data-label text-[10px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className="data-label text-right text-sm text-ink">{value}</span>
    </div>
  );
}

export function Inspector() {
  const selection = useSimulationStore((s) => s.selection);
  const buildings = useSimulationStore((s) => s.buildings);
  const vehicles = useSimulationStore((s) => s.vehicles);
  const creatures = useSimulationStore((s) => s.creatures);
  const props = useSimulationStore((s) => s.props);
  const simYear = useSimulationStore((s) => s.simYear);
  const clearSelection = useSimulationStore((s) => s.select);
  const destroyBuilding = useSimulationStore((s) => s.destroyBuilding);
  const igniteBuilding = useSimulationStore((s) => s.igniteBuilding);

  if (!selection) return null;

  let content: React.ReactNode = null;
  let title = "";

  if (selection.kind === "building") {
    const b = buildings[selection.id];
    if (!b) return null;
    title = b.usage.label;
    content = (
      <>
        <Row label="ID" value={b.id.toUpperCase()} />
        <Row label="Material" value={b.material} />
        <Row label="Age" value={`${Math.max(0, Math.floor(simYear - b.builtYear))} yrs`} />
        <Row label="Floors" value={b.floors} />
        <Row label="Height" value={`${b.size[1].toFixed(1)}m`} />
        <Row label="Occupants" value={b.occupants} />
        <Row
          label="Structural health"
          value={`${b.collapsed ? 0 : Math.round(b.structuralHealth)}%`}
        />
        <Row label="Status" value={b.collapsed ? "COLLAPSED" : b.burning ? "ON FIRE" : "STABLE"} />

        <div className="my-2 h-px bg-panel-border" />
        <div className="data-label mb-1 text-[10px] uppercase tracking-widest text-ink-faint">History</div>
        <div className="readout-scroll max-h-36 space-y-1 overflow-y-auto pr-1">
          {b.history.map((h, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-signal">{h.year}</span>
              <span className="text-ink-muted">{h.text}</span>
            </div>
          ))}
        </div>

        {!b.collapsed && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                igniteBuilding(b.id);
                playUiTick(300);
              }}
              className="data-label flex-1 rounded-md border border-heat/30 bg-heat/10 px-2 py-1.5 text-[11px] text-heat transition hover:bg-heat/20"
            >
              IGNITE
            </button>
            <button
              onClick={() => {
                destroyBuilding(b.id);
                playUiTick(220);
              }}
              className="data-label flex-1 rounded-md border border-hazard/30 bg-hazard/10 px-2 py-1.5 text-[11px] text-hazard transition hover:bg-hazard/20"
            >
              DEMOLISH
            </button>
          </div>
        )}
      </>
    );
  } else if (selection.kind === "vehicle") {
    const v = vehicles.find((x) => x.id === selection.id);
    if (!v) return null;
    title = v.kind === "truck" ? "Truck" : "Sedan";
    content = (
      <>
        <Row label="Type" value={v.kind} />
        <Row label="Speed" value={`${Math.round(v.speed)} km/h`} />
        <Row label="Mass" value={`${Math.round(v.mass).toLocaleString()} kg`} />
        <Row label="Fuel" value={`${Math.round(v.fuel)}%`} />
        <Row label="Owner" value={v.owner} />
      </>
    );
  } else if (selection.kind === "creature") {
    const c = creatures[selection.id];
    if (!c) return null;
    title = c.species;
    content = (
      <>
        <Row label="Age" value={`${c.age.toFixed(1)} yrs`} />
        <Row label="Energy" value={`${Math.round(c.energy)}%`} />
        <Row label="Hunger" value={`${Math.round(c.hunger)}%`} />
        <Row label="State" value={c.state} />
      </>
    );
  } else if (selection.kind === "prop") {
    const p = props.find((x) => x.id === selection.id);
    if (!p) return null;
    title = `User object — ${p.kind}`;
    content = (
      <>
        <Row label="Kind" value={p.kind} />
        <Row label="Spawned" value={`year ${Math.floor(p.createdAt)}`} />
        <Row label="Position" value={p.position.map((n) => n.toFixed(1)).join(", ")} />
      </>
    );
  }

  return (
    <div className="glass-panel pointer-events-auto absolute right-4 top-24 w-72 rounded-lg px-4 py-3 text-ink shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="data-label text-[10px] uppercase tracking-widest text-ink-faint">{selection.kind}</div>
          <div className="text-base font-semibold leading-tight">{title}</div>
        </div>
        <button
          onClick={() => clearSelection(null)}
          className="rounded-md px-1.5 py-0.5 text-ink-faint transition hover:text-ink"
          aria-label="Close inspector"
        >
          ✕
        </button>
      </div>
      {content}
    </div>
  );
}
