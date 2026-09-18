import { useSimulationStore } from "../simulation/useSimulationStore";
import type { WeatherType } from "../types";
import { playUiTick } from "./sound";

const WEATHERS: { id: WeatherType; label: string }[] = [
  { id: "clear", label: "Clear" },
  { id: "clouds", label: "Clouds" },
  { id: "rain", label: "Rain" },
  { id: "storm", label: "Storm" },
  { id: "fog", label: "Fog" },
  { id: "snow", label: "Snow" },
];

export function WeatherPanel() {
  const activeTool = useSimulationStore((s) => s.activeTool);
  const weatherType = useSimulationStore((s) => s.weatherType);
  const wind = useSimulationStore((s) => s.wind);
  const temperature = useSimulationStore((s) => s.temperature);
  const setWeather = useSimulationStore((s) => s.setWeather);
  const setWind = useSimulationStore((s) => s.setWind);
  const setTemperature = useSimulationStore((s) => s.setTemperature);

  if (activeTool !== "weather") return null;

  return (
    <div className="glass-panel pointer-events-auto absolute bottom-24 left-4 w-64 rounded-lg px-4 py-3 shadow-lg">
      <div className="data-label mb-2 text-[10px] uppercase tracking-widest text-ink-faint">Weather</div>

      <div className="grid grid-cols-3 gap-1.5">
        {WEATHERS.map((w) => (
          <button
            key={w.id}
            onClick={() => {
              setWeather(w.id);
              playUiTick(650);
            }}
            className={`data-label rounded-md border px-2 py-1.5 text-[11px] transition ${
              weatherType === w.id
                ? "border-signal-dim bg-signal/15 text-signal"
                : "border-panel-border bg-white/5 text-ink-muted hover:text-ink"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">Wind</span>
        <span className="text-ink">{Math.round(wind)} km/h</span>
      </div>
      <input
        type="range"
        min={0}
        max={140}
        step={1}
        value={wind}
        onChange={(e) => setWind(parseFloat(e.target.value))}
        className="mt-1 w-full accent-[#57d9c4]"
      />

      <div className="mt-3 flex items-center justify-between data-label text-xs">
        <span className="text-ink-muted">Temperature</span>
        <span className="text-ink">{Math.round(temperature)}°C</span>
      </div>
      <input
        type="range"
        min={-30}
        max={900}
        step={1}
        value={temperature}
        onChange={(e) => setTemperature(parseFloat(e.target.value))}
        className="mt-1 w-full accent-[#e8a33d]"
      />
    </div>
  );
}
