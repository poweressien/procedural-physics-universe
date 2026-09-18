import { useSimulationStore } from "../simulation/useSimulationStore";

export function LoadingScreen() {
  const isGenerating = useSimulationStore((s) => s.isGenerating);
  const loadingSteps = useSimulationStore((s) => s.loadingSteps);

  if (!isGenerating) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-void/95 backdrop-blur-sm">
      <div className="w-80">
        <div className="data-label mb-4 text-center text-sm uppercase tracking-[0.3em] text-signal animate-pulse-slow">
          Creating Universe...
        </div>
        <div className="space-y-1.5">
          {loadingSteps.map((step, i) => (
            <div key={i} className="data-label flex items-center justify-between text-xs text-ink-muted">
              <span>{step}</span>
              <span className="text-signal">{step === "SIMULATION READY." ? "" : "✓"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
