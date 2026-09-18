import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { mulberry32 } from "./prng";

const TEX_W = 512;
const TEX_H = 256;
const CLOUD_W = 512;
const CLOUD_H = 256;

interface PlanetTextures {
  surface: THREE.CanvasTexture;
  lights: THREE.CanvasTexture;
  clouds: THREE.CanvasTexture;
}

const textureCache = new Map<number, PlanetTextures>();

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * Builds a decorative, seeded "planet" texture set for the globe shown at
 * planet scale. Sampled in 3D over the unit sphere (rather than as a flat
 * 2D image) so there's no visible seam or pole pinching — genuinely
 * seamless equirectangular output.
 */
export function generatePlanetTextures(seed: number): PlanetTextures {
  const cached = textureCache.get(seed);
  if (cached) return cached;

  const rngA = mulberry32((seed ^ 0x1b873593) >>> 0);
  const rngB = mulberry32((seed ^ 0x2f6b3d45) >>> 0);
  const rngC = mulberry32((seed ^ 0x7ed55d16) >>> 0);
  const rngCloud = mulberry32((seed ^ 0x9e3779b9) >>> 0);

  const nA = createNoise3D(rngA);
  const nB = createNoise3D(rngB);
  const nC = createNoise3D(rngC);
  const nCloud = createNoise3D(rngCloud);

  const height = (x: number, y: number, z: number) => {
    const continents = nA(x * 1.1, y * 1.1, z * 1.1) * 1.0;
    const hills = nB(x * 2.6, y * 2.6, z * 2.6) * 0.4;
    const detail = nC(x * 6.5, y * 6.5, z * 6.5) * 0.12;
    return continents + hills + detail;
  };

  // --- Surface (diffuse) ---
  const surfaceCanvas = document.createElement("canvas");
  surfaceCanvas.width = TEX_W;
  surfaceCanvas.height = TEX_H;
  const sCtx = surfaceCanvas.getContext("2d")!;
  const sImg = sCtx.createImageData(TEX_W, TEX_H);

  const OCEAN_DEEP: [number, number, number] = [8, 28, 46];
  const OCEAN_SHALLOW: [number, number, number] = [22, 74, 92];
  const SAND: [number, number, number] = [176, 158, 110];
  const LOWLAND: [number, number, number] = [42, 92, 56];
  const HIGHLAND: [number, number, number] = [78, 82, 54];
  const MOUNTAIN: [number, number, number] = [118, 112, 104];
  const SNOW: [number, number, number] = [232, 236, 240];

  const landMask = new Uint8Array(TEX_W * TEX_H);

  for (let py = 0; py < TEX_H; py++) {
    const v = py / TEX_H;
    const lat = (0.5 - v) * Math.PI;
    for (let px = 0; px < TEX_W; px++) {
      const u = px / TEX_W;
      const lon = u * Math.PI * 2 - Math.PI;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);

      const h = height(x, y, z);
      const poleFade = Math.pow(Math.abs(Math.sin(lat)), 5); // subtle polar ice caps

      let color: [number, number, number];
      if (h < -0.15) color = lerpColor(OCEAN_DEEP, OCEAN_SHALLOW, Math.min(1, (h + 1.4) / 1.25));
      else if (h < -0.02) color = lerpColor(OCEAN_SHALLOW, SAND, (h + 0.15) / 0.13);
      else if (h < 0.28) color = lerpColor(SAND, LOWLAND, Math.min(1, (h + 0.02) / 0.3));
      else if (h < 0.55) color = lerpColor(LOWLAND, HIGHLAND, (h - 0.28) / 0.27);
      else if (h < 0.8) color = lerpColor(HIGHLAND, MOUNTAIN, (h - 0.55) / 0.25);
      else color = lerpColor(MOUNTAIN, SNOW, Math.min(1, (h - 0.8) / 0.3));

      color = lerpColor(color, SNOW, poleFade * 0.7);

      const isLand = h >= -0.15;
      landMask[py * TEX_W + px] = isLand ? 1 : 0;

      const idx = (py * TEX_W + px) * 4;
      sImg.data[idx] = color[0];
      sImg.data[idx + 1] = color[1];
      sImg.data[idx + 2] = color[2];
      sImg.data[idx + 3] = 255;
    }
  }
  sCtx.putImageData(sImg, 0, 0);

  // --- City lights (emissive, mostly black, warm dots scattered on land) ---
  const lightsCanvas = document.createElement("canvas");
  lightsCanvas.width = TEX_W;
  lightsCanvas.height = TEX_H;
  const lCtx = lightsCanvas.getContext("2d")!;
  lCtx.fillStyle = "#000000";
  lCtx.fillRect(0, 0, TEX_W, TEX_H);
  lCtx.fillStyle = "#ffd9a0";
  const lightRng = mulberry32((seed ^ 0x45d9f3b) >>> 0);
  let placed = 0;
  let attempts = 0;
  while (placed < 340 && attempts < 6000) {
    attempts++;
    const px = Math.floor(lightRng() * TEX_W);
    const py = Math.floor(lightRng() * TEX_H);
    if (!landMask[py * TEX_W + px]) continue;
    const r = lightRng() * 0.9 + 0.4;
    lCtx.globalAlpha = 0.55 + lightRng() * 0.45;
    lCtx.beginPath();
    lCtx.arc(px, py, r, 0, Math.PI * 2);
    lCtx.fill();
    placed++;
  }
  lCtx.globalAlpha = 1;

  // --- Clouds (alpha layer) ---
  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = CLOUD_W;
  cloudCanvas.height = CLOUD_H;
  const cCtx = cloudCanvas.getContext("2d")!;
  const cImg = cCtx.createImageData(CLOUD_W, CLOUD_H);
  for (let py = 0; py < CLOUD_H; py++) {
    const v = py / CLOUD_H;
    const lat = (0.5 - v) * Math.PI;
    for (let px = 0; px < CLOUD_W; px++) {
      const u = px / CLOUD_W;
      const lon = u * Math.PI * 2 - Math.PI;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      const c1 = nCloud(x * 2.2 + 30, y * 2.2 + 30, z * 2.2 + 30);
      const c2 = nCloud(x * 5.5 + 80, y * 5.5 + 80, z * 5.5 + 80) * 0.5;
      const v2 = c1 + c2;
      const alpha = Math.max(0, Math.min(255, Math.round((v2 - 0.15) * 340)));
      const idx = (py * CLOUD_W + px) * 4;
      cImg.data[idx] = 255;
      cImg.data[idx + 1] = 255;
      cImg.data[idx + 2] = 255;
      cImg.data[idx + 3] = alpha;
    }
  }
  cCtx.putImageData(cImg, 0, 0);

  const surface = new THREE.CanvasTexture(surfaceCanvas);
  surface.colorSpace = THREE.SRGBColorSpace;
  const lights = new THREE.CanvasTexture(lightsCanvas);
  lights.colorSpace = THREE.SRGBColorSpace;
  const clouds = new THREE.CanvasTexture(cloudCanvas);
  clouds.colorSpace = THREE.SRGBColorSpace;

  const result: PlanetTextures = { surface, lights, clouds };
  textureCache.set(seed, result);
  return result;
}
