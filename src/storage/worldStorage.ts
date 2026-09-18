import type { PropData, WeatherType } from "../types";

export interface BuildingDelta {
  structuralHealth: number;
  burning: boolean;
  collapsed: boolean;
}

export interface SerializableWorld {
  seed: number;
  gravityMagnitude: number;
  gravityDirection: 1 | -1;
  timeScale: number;
  simYear: number;
  weatherType: WeatherType;
  wind: number;
  temperature: number;
  buildingDeltas: Record<string, BuildingDelta>;
  props: PropData[];
  savedAt: number;
}

export interface SavedWorldEntry {
  slot: string;
  label: string;
  data: SerializableWorld;
}

const STORAGE_PREFIX = "physics-universe:save:";
const SNAPSHOT_PREFIX = "physics-universe:snapshot:";
const INDEX_KEY = "physics-universe:save-index";
const SNAPSHOT_INDEX_KEY = "physics-universe:snapshot-index";

function readIndex(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(key: string, ids: string[]) {
  localStorage.setItem(key, JSON.stringify(ids));
}

export function saveWorld(slot: string, label: string, data: SerializableWorld): boolean {
  try {
    localStorage.setItem(STORAGE_PREFIX + slot, JSON.stringify({ label, data }));
    const ids = readIndex(INDEX_KEY);
    if (!ids.includes(slot)) writeIndex(INDEX_KEY, [...ids, slot]);
    return true;
  } catch {
    return false;
  }
}

export function loadWorld(slot: string): SavedWorldEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slot);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { label: string; data: SerializableWorld };
    return { slot, label: parsed.label, data: parsed.data };
  } catch {
    return null;
  }
}

export function listSavedWorlds(): SavedWorldEntry[] {
  return readIndex(INDEX_KEY)
    .map((slot) => loadWorld(slot))
    .filter((e): e is SavedWorldEntry => e !== null);
}

export function deleteSavedWorld(slot: string) {
  localStorage.removeItem(STORAGE_PREFIX + slot);
  writeIndex(INDEX_KEY, readIndex(INDEX_KEY).filter((s) => s !== slot));
}

// --- Snapshots (same shape, separate namespace, quick-slot semantics) ---

export function saveSnapshot(id: string, label: string, data: SerializableWorld): boolean {
  try {
    localStorage.setItem(SNAPSHOT_PREFIX + id, JSON.stringify({ label, data }));
    const ids = readIndex(SNAPSHOT_INDEX_KEY);
    if (!ids.includes(id)) writeIndex(SNAPSHOT_INDEX_KEY, [...ids, id]);
    return true;
  } catch {
    return false;
  }
}

export function listSnapshots(): SavedWorldEntry[] {
  return readIndex(SNAPSHOT_INDEX_KEY)
    .map((id) => {
      try {
        const raw = localStorage.getItem(SNAPSHOT_PREFIX + id);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { label: string; data: SerializableWorld };
        return { slot: id, label: parsed.label, data: parsed.data };
      } catch {
        return null;
      }
    })
    .filter((e): e is SavedWorldEntry => e !== null);
}

export function deleteSnapshot(id: string) {
  localStorage.removeItem(SNAPSHOT_PREFIX + id);
  writeIndex(SNAPSHOT_INDEX_KEY, readIndex(SNAPSHOT_INDEX_KEY).filter((s) => s !== id));
}

// --- Shareable URL (seed + top-level settings only, kept short) ---

interface ShareablePayload {
  seed: number;
  gravityMagnitude: number;
  gravityDirection: 1 | -1;
  weatherType: WeatherType;
}

export function encodeShareURL(payload: ShareablePayload): string {
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.searchParams.set("w", b64);
  return url.toString();
}

export function decodeShareURL(): ShareablePayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get("w");
    if (!b64) return null;
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json) as ShareablePayload;
  } catch {
    return null;
  }
}
