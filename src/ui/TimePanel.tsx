import { Camera } from "lucide-react";
import { useSimulationStore } from "../simulation/useSimulationStore";
import { playUiTick } from "./sound";

const SPEEDS = [0.1, 1, 2, 10, 50, 100, 1000];

function captureScreenshot() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  try {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `universe-${Date.now()}.png`;
    a.click();
  } catch {
    // ignore — canvas capture can fail silently on some GPUs/drivers
  }
}

export function TimePanel() {
  const paused = useSimulationStore((s) => s.paused);
  const timeScale = useSimulationStore((s) => s.timeScale);
  const togglePause = useSimulationStore((s) => s.togglePause);
  const setTimeScale = useSimulationStore((s) => s.setTimeScale);

  return (
    <div className="glass-panel pointer-events-auto absolute right-4 top-4 rounded-lg px-3 py-2.5 shadow-lg">
      <div className="data-label mb-1.5 text-[10px] uppercase tracking-widest text-ink-faint">Time</div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            togglePause();
            playUiTick(paused ? 820 : 500);
          }}
          className="data-label rounded-md border border-panel-border bg-white/5 px-2.5 py-1.5 text-xs text-ink transition hover:border-signal-dim hover:text-signal"
        >
          {paused ? "▶ PLAY" : "❚❚ PAUSE"}
        </button>
        <div className="mx-1 h-5 w-px bg-panel-border" />
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setTimeScale(s);
              playUiTick(600 + s);
            }}
            className={`data-label rounded-md border px-2 py-1.5 text-xs transition ${
              timeScale === s
                ? "border-signal-dim bg-signal/15 text-signal"
                : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
            }`}
          >
            ×{s}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-panel-border" />
        <button
          title="Save screenshot"
          onClick={() => {
            captureScreenshot();
            playUiTick(950);
          }}
          className="rounded-md border border-panel-border bg-white/5 p-1.5 text-ink-muted transition hover:border-signal-dim hover:text-signal"
        >
          <Camera size={14} />
        </button>
      </div>
    </div>
  );
}
