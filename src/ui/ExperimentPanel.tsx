import { FlaskConical, X } from "lucide-react";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { playUiTick } from "./sound";

export function ExperimentPanel() {
  const open = useSimulationStore((s) => s.experimentOpen);
  const setOpen = useSimulationStore((s) => s.setExperimentOpen);
  const experiment = useSimulationStore((s) => s.experiment);
  const setExperiment = useSimulationStore((s) => s.setExperiment);
  const runExperiment = useSimulationStore((s) => s.runExperiment);

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          playUiTick(700);
        }}
        className="glass-panel pointer-events-auto absolute bottom-24 right-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-ink-muted shadow-lg transition hover:text-signal"
      >
        <FlaskConical size={14} />
        <span className="data-label text-[10px] uppercase tracking-widest">Experiment</span>
      </button>
    );
  }

  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 right-4 w-72 rounded-lg px-4 py-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="data-label text-[10px] uppercase tracking-widest text-ink-faint">Experiment</div>
        <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
          <X size={14} />
        </button>
      </div>

      <Slider label="Gravity" unit="G" min={-10} max={20} step={0.5} value={experiment.gravity} onChange={(v) => setExperiment({ gravity: v })} />
      <Slider label="Wind" unit="km/h" min={0} max={140} step={1} value={experiment.wind} onChange={(v) => setExperiment({ wind: v })} />
      <Slider label="Temperature" unit="°C" min={-30} max={900} step={1} value={experiment.temperature} onChange={(v) => setExperiment({ temperature: v })} />

      <div className="mt-2 flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">Time</span>
        <span className="text-ink">×{experiment.timeScale}</span>
      </div>
      <div className="mt-1 flex gap-1.5">
        {[1, 10, 50, 100, 1000].map((t) => (
          <button
            key={t}
            onClick={() => setExperiment({ timeScale: t })}
            className={`data-label flex-1 rounded-md border px-1.5 py-1 text-[10px] ${
              experiment.timeScale === t
                ? "border-signal-dim bg-signal/15 text-signal"
                : "border-panel-border bg-white/5 text-ink-muted"
            }`}
          >
            ×{t}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setExperiment({ water: !experiment.water })}
          className={`data-label flex-1 rounded-md border px-2 py-1.5 text-[11px] ${
            experiment.water ? "border-signal-dim bg-signal/15 text-signal" : "border-panel-border bg-white/5 text-ink-muted"
          }`}
        >
          WATER {experiment.water ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => setExperiment({ fire: !experiment.fire })}
          className={`data-label flex-1 rounded-md border px-2 py-1.5 text-[11px] ${
            experiment.fire ? "border-heat/40 bg-heat/15 text-heat" : "border-panel-border bg-white/5 text-ink-muted"
          }`}
        >
          FIRE {experiment.fire ? "ON" : "OFF"}
        </button>
      </div>

      <button
        onClick={() => {
          runExperiment();
          playUiTick(900);
        }}
        className="data-label mt-3 w-full rounded-md border border-signal-dim bg-signal/15 py-2 text-xs text-signal hover:bg-signal/25"
      >
        ▶ RUN EXPERIMENT
      </button>
    </div>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="text-ink">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1 w-full accent-[#57d9c4]"
      />
    </div>
  );
}
