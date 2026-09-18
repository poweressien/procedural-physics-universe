import { useState } from "react";
import { Globe2, X } from "lucide-react";
import { useSimulationStore, getShareURL } from "../simulation/useSimulationStore";
import {
  deleteSavedWorld,
  deleteSnapshot,
  listSavedWorlds,
  listSnapshots,
  loadWorld,
  saveSnapshot,
  saveWorld,
} from "../storage/worldStorage";
import { randomSeed, seedFromString } from "../world/prng";
import { playUiTick } from "./sound";

export function SeedPanel() {
  const open = useSimulationStore((s) => s.worldPanelOpen);
  const setOpen = useSimulationStore((s) => s.setWorldPanelOpen);
  const seed = useSimulationStore((s) => s.seed);
  const startNewUniverse = useSimulationStore((s) => s.startNewUniverse);
  const getSerializableState = useSimulationStore((s) => s.getSerializableState);
  const loadSerializableState = useSimulationStore((s) => s.loadSerializableState);

  const [seedInput, setSeedInput] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [saves, setSaves] = useState(() => listSavedWorlds());
  const [snapshots, setSnapshots] = useState(() => listSnapshots());

  const refresh = () => {
    setSaves(listSavedWorlds());
    setSnapshots(listSnapshots());
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          playUiTick(700);
          refresh();
        }}
        className="glass-panel pointer-events-auto absolute left-4 top-44 flex items-center gap-1.5 rounded-lg px-3 py-2 text-ink-muted shadow-lg transition hover:text-signal"
      >
        <Globe2 size={14} />
        <span className="data-label text-[10px] uppercase tracking-widest">World</span>
      </button>
    );
  }

  return (
    <div className="glass-panel pointer-events-auto absolute left-4 top-44 w-72 rounded-lg px-4 py-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="data-label text-[10px] uppercase tracking-widest text-ink-faint">World Control</div>
        <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
          <X size={14} />
        </button>
      </div>

      <div className="data-label text-[11px] text-ink-muted">
        Current seed: <span className="text-signal">{seed}</span>
      </div>

      <div className="mt-2 flex gap-1.5">
        <input
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value)}
          placeholder="seed or phrase"
          className="w-full rounded-md border border-panel-border bg-white/5 px-2 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint focus:border-signal-dim"
        />
        <button
          onClick={() => {
            const n = seedInput.trim();
            if (!n) return;
            const parsed = /^-?\d+$/.test(n) ? parseInt(n, 10) : seedFromString(n);
            startNewUniverse(parsed);
            setSeedInput("");
            playUiTick(800);
          }}
          className="data-label rounded-md border border-panel-border bg-white/5 px-2.5 py-1.5 text-[11px] text-ink hover:text-signal"
        >
          GO
        </button>
      </div>

      <button
        onClick={() => {
          startNewUniverse(randomSeed());
          playUiTick(900);
        }}
        className="data-label mt-2 w-full rounded-md border border-signal-dim bg-signal/10 py-1.5 text-[11px] text-signal hover:bg-signal/20"
      >
        NEW UNIVERSE
      </button>

      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => {
            startNewUniverse(seed);
            playUiTick(400);
          }}
          className="data-label rounded-md border border-panel-border bg-white/5 py-1.5 text-[11px] text-ink-muted hover:text-ink"
        >
          RESET WORLD
        </button>
        <button
          onClick={() => {
            const url = getShareURL();
            setShareUrl(url);
            navigator.clipboard?.writeText(url).catch(() => {});
            playUiTick(650);
          }}
          className="data-label rounded-md border border-panel-border bg-white/5 py-1.5 text-[11px] text-ink-muted hover:text-ink"
        >
          SHARE
        </button>
      </div>
      {shareUrl && (
        <div className="data-label mt-1.5 truncate text-[10px] text-ink-faint" title={shareUrl}>
          Copied: {shareUrl}
        </div>
      )}

      <div className="my-3 h-px bg-panel-border" />

      <div className="data-label mb-1.5 text-[10px] uppercase tracking-widest text-ink-faint">Saved worlds</div>
      <button
        onClick={() => {
          const slot = `slot-${Date.now()}`;
          saveWorld(slot, `${useSimulationStore.getState().meta.name} — save`, getSerializableState());
          refresh();
          playUiTick(750);
        }}
        className="data-label w-full rounded-md border border-panel-border bg-white/5 py-1.5 text-[11px] text-ink hover:text-signal"
      >
        SAVE WORLD
      </button>
      <div className="readout-scroll mt-2 max-h-28 space-y-1 overflow-y-auto pr-1">
        {saves.length === 0 && <div className="data-label text-[10px] text-ink-faint">No saves yet.</div>}
        {saves.map((entry) => (
          <div key={entry.slot} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-ink-muted">{entry.label}</span>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => {
                  const loaded = loadWorld(entry.slot);
                  if (loaded) loadSerializableState(loaded.data);
                  playUiTick(700);
                }}
                className="rounded border border-panel-border px-1.5 py-0.5 text-ink-muted hover:text-signal"
              >
                LOAD
              </button>
              <button
                onClick={() => {
                  deleteSavedWorld(entry.slot);
                  refresh();
                }}
                className="rounded border border-panel-border px-1.5 py-0.5 text-ink-muted hover:text-hazard"
              >
                DEL
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="my-3 h-px bg-panel-border" />

      <div className="data-label mb-1.5 text-[10px] uppercase tracking-widest text-ink-faint">Snapshots</div>
      <button
        onClick={() => {
          const id = `snap-${Date.now()}`;
          saveSnapshot(id, `Year ${Math.floor(useSimulationStore.getState().simYear)}`, getSerializableState());
          refresh();
          playUiTick(750);
        }}
        className="data-label w-full rounded-md border border-panel-border bg-white/5 py-1.5 text-[11px] text-ink hover:text-signal"
      >
        TAKE SNAPSHOT
      </button>
      <div className="readout-scroll mt-2 max-h-28 space-y-1 overflow-y-auto pr-1">
        {snapshots.length === 0 && <div className="data-label text-[10px] text-ink-faint">No snapshots yet.</div>}
        {snapshots.map((entry) => (
          <div key={entry.slot} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-ink-muted">{entry.label}</span>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => {
                  loadSerializableState(entry.data);
                  playUiTick(700);
                }}
                className="rounded border border-panel-border px-1.5 py-0.5 text-ink-muted hover:text-signal"
              >
                RESTORE
              </button>
              <button
                onClick={() => {
                  deleteSnapshot(entry.slot);
                  refresh();
                }}
                className="rounded border border-panel-border px-1.5 py-0.5 text-ink-muted hover:text-hazard"
              >
                DEL
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
