import * as THREE from "three";

let baseTexture: THREE.CanvasTexture | null = null;
const tierCache = new Map<number, THREE.CanvasTexture>();

function buildBaseTexture(): THREE.CanvasTexture {
  const cols = 8;
  const rows = 16;
  const cellW = 16;
  const cellH = 16;
  const canvas = document.createElement("canvas");
  canvas.width = cols * cellW;
  canvas.height = rows * cellH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const litColors = ["#ffd9a0", "#ffeccb", "#bfe8ff", "#ffffff"];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.32) continue;
      const pad = 3;
      ctx.fillStyle = litColors[Math.floor(Math.random() * litColors.length)];
      ctx.globalAlpha = 0.55 + Math.random() * 0.45;
      ctx.fillRect(c * cellW + pad, r * cellH + pad, cellW - pad * 2, cellH - pad * 2);
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const TIER_REPEAT: Record<number, [number, number]> = {
  0: [1, 3],
  1: [1, 6],
  2: [2, 10],
  3: [2, 16],
};

/**
 * A tileable window-grid texture (mostly dark, scattered lit windows),
 * bucketed into a few size "tiers" so tall buildings get denser tiling
 * than short ones — without cloning a fresh texture per building.
 */
export function getWindowTexture(floors: number): THREE.CanvasTexture {
  if (!baseTexture) baseTexture = buildBaseTexture();
  const tier = floors <= 4 ? 0 : floors <= 10 ? 1 : floors <= 20 ? 2 : 3;
  const cached = tierCache.get(tier);
  if (cached) return cached;

  const tex = baseTexture.clone();
  tex.needsUpdate = true;
  const [rx, ry] = TIER_REPEAT[tier];
  tex.repeat.set(rx, ry);
  tierCache.set(tier, tex);
  return tex;
}
