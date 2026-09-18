import { useSimulationStore } from "../simulation/useSimulationStore";
import { playUiTick } from "./sound";

export function GravityPanel() {
  const activeTool = useSimulationStore((s) => s.activeTool);
  const magnitude = useSimulationStore((s) => s.gravityMagnitude);
  const direction = useSimulationStore((s) => s.gravityDirection);
  const wells = useSimulationStore((s) => s.gravityWells);
  const setGravityMagnitude = useSimulationStore((s) => s.setGravityMagnitude);
  const reverseGravity = useSimulationStore((s) => s.reverseGravity);
  const clearGravityWells = useSimulationStore((s) => s.clearGravityWells);

  if (activeTool !== "gravity") return null;

  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 left-4 w-64 rounded-lg px-4 py-3 shadow-lg">
      <div className="data-label mb-2 text-[10px] uppercase tracking-widest text-ink-faint">Gravity</div>

      <div className="flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">Global</span>
        <span className={direction < 0 ? "text-hazard" : "text-signal"}>
          {(magnitude * direction).toFixed(2)}G
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={20}
        step={0.1}
        value={magnitude}
        onChange={(e) => setGravityMagnitude(parseFloat(e.target.value))}
        className="mt-2 w-full accent-[#57d9c4]"
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            setGravityMagnitude(Math.max(0, magnitude - 0.5));
            playUiTick(500);
          }}
          className="data-label flex-1 rounded-md border border-panel-border bg-white/5 py-1.5 text-xs text-ink hover:text-signal"
        >
          −
        </button>
        <button
          onClick={() => {
            setGravityMagnitude(Math.min(20, magnitude + 0.5));
            playUiTick(700);
          }}
          className="data-label flex-1 rounded-md border border-panel-border bg-white/5 py-1.5 text-xs text-ink hover:text-signal"
        >
          +
        </button>
        <button
          onClick={() => {
            reverseGravity();
            playUiTick(300);
          }}
          className="data-label flex-1 rounded-md border border-panel-border bg-white/5 py-1.5 text-xs text-ink hover:text-hazard"
        >
          REVERSE
        </button>
      </div>

      <div className="mt-3 h-px bg-panel-border" />
      <div className="mt-2 flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">Gravity wells</span>
        <span className="text-ink">{wells.length}</span>
      </div>
      <div className="data-label mt-1 text-[10px] text-ink-faint">Click the ground to drop a well.</div>
      {wells.length > 0 && (
        <button
          onClick={() => {
            clearGravityWells();
            playUiTick(300);
          }}
          className="data-label mt-2 w-full rounded-md border border-panel-border bg-white/5 py-1.5 text-[11px] text-ink-muted hover:text-hazard"
        >
          CLEAR WELLS
        </button>
      )}
    </div>
  );
}
