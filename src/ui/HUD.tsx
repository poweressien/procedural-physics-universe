import { useSimulationStore } from "../simulation/useSimulationStore";

function formatClock(simYear: number): string {
  const totalHours = simYear * 365 * 24;
  const dayFraction = (((totalHours % 24) + 24) % 24) / 24;
  const hours = Math.floor(dayFraction * 24);
  const minutes = Math.floor((dayFraction * 24 * 60) % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function HUD() {
  const meta = useSimulationStore((s) => s.meta);
  const simYear = useSimulationStore((s) => s.simYear);
  const paused = useSimulationStore((s) => s.paused);
  const scaleLevel = useSimulationStore((s) => s.scaleLevel);
  const seed = useSimulationStore((s) => s.seed);

  return (
    <div className="glass-panel pointer-events-none absolute left-4 top-4 rounded-lg px-4 py-3 text-ink shadow-lg">
      <div className="data-label text-[10px] uppercase tracking-widest text-ink-faint">World</div>
      <div className="text-lg font-semibold leading-tight">{meta.name}</div>

      <div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 data-label text-xs">
        <div className="text-ink-muted">Year</div>
        <div className="text-right text-ink">{Math.floor(simYear)}</div>

        <div className="text-ink-muted">Time</div>
        <div className="text-right text-ink">{formatClock(simYear)}</div>

        <div className="text-ink-muted">Population</div>
        <div className="text-right text-ink">{meta.population.toLocaleString()}</div>

        <div className="text-ink-muted">Scale</div>
        <div className="text-right uppercase text-signal">{scaleLevel}</div>

        <div className="text-ink-muted">Seed</div>
        <div className="text-right text-ink-muted">{seed}</div>
      </div>

      <div className="mt-2 flex items-center gap-2 data-label text-[11px]">
        <span
          className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-heat" : "bg-signal animate-pulse-slow"}`}
        />
        <span className={paused ? "text-heat" : "text-signal"}>
          {paused ? "PAUSED" : "SIMULATION RUNNING"}
        </span>
      </div>
    </div>
  );
}
