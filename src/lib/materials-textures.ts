import * as THREE from "three";

/**
 * Procedural texture generator for high-fidelity realistic WPC (Wood-Plastic Composite),
 * grooved deck planks, woven Sunbrella canvas fabric, brushed metals, and grass fibers.
 */

// Cache textures to avoid rebuilding repeatedly
const textureCache: { [key: string]: THREE.CanvasTexture } = {};

export function createWpcPlankTexture(
  baseHex: string,
  grainDarkness = 0.22,
  plankCount = 8
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const cacheKey = `wpc-${baseHex}-${grainDarkness}-${plankCount}`;
  if (textureCache[cacheKey]) {
    return {
      map: textureCache[cacheKey],
      bumpMap: textureCache[`${cacheKey}-bump`],
      roughnessMap: textureCache[`${cacheKey}-rough`],
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 1024;
  bumpCanvas.height = 1024;
  const bCtx = bumpCanvas.getContext("2d");

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = 1024;
  roughCanvas.height = 1024;
  const rCtx = roughCanvas.getContext("2d");

  if (!ctx || !bCtx || !rCtx) {
    const dummy = new THREE.CanvasTexture(canvas);
    return { map: dummy, bumpMap: dummy, roughnessMap: dummy };
  }

  // Parse base color
  const baseColor = new THREE.Color(baseHex);
  const r = Math.floor(baseColor.r * 255);
  const g = Math.floor(baseColor.g * 255);
  const b = Math.floor(baseColor.b * 255);

  // Fill base color
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, 1024, 1024);

  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, 1024, 1024);

  rCtx.fillStyle = "#999999";
  rCtx.fillRect(0, 0, 1024, 1024);

  // Draw realistic wood planks & fine grooved extrusions
  const plankWidth = 1024 / plankCount;

  for (let p = 0; p < plankCount; p++) {
    const startX = p * plankWidth;

    // Plank subtle organic color variation
    const plankVariation = Math.sin(p * 2.3) * 0.15 + (Math.random() - 0.5) * 0.08;
    const pr = Math.min(255, Math.max(0, Math.floor(r * (1 + plankVariation))));
    const pg = Math.min(255, Math.max(0, Math.floor(g * (1 + plankVariation))));
    const pb = Math.min(255, Math.max(0, Math.floor(b * (1 + plankVariation))));

    ctx.fillStyle = `rgb(${pr}, ${pg}, ${pb})`;
    ctx.fillRect(startX + 2, 0, plankWidth - 4, 1024);

    // Fine extrusion longitudinal micro-grooves (WPC linear anti-slip grooves)
    const grooveCount = 12;
    const grooveStep = (plankWidth - 4) / grooveCount;
    for (let gIdx = 0; gIdx < grooveCount; gIdx++) {
      const gx = startX + 2 + gIdx * grooveStep;

      // Shadow edge of groove
      ctx.strokeStyle = `rgba(0, 0, 0, 0.32)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, 1024);
      ctx.stroke();

      // Highlight edge of groove
      ctx.strokeStyle = `rgba(255, 255, 255, 0.14)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx + 1.5, 0);
      ctx.lineTo(gx + 1.5, 1024);
      ctx.stroke();

      // Bump groove
      bCtx.strokeStyle = "#383838";
      bCtx.lineWidth = 2.5;
      bCtx.beginPath();
      bCtx.moveTo(gx, 0);
      bCtx.lineTo(gx, 1024);
      bCtx.stroke();

      // Roughness variation on groove edges
      rCtx.strokeStyle = "#bbbbbb";
      rCtx.lineWidth = 2;
      rCtx.beginPath();
      rCtx.moveTo(gx, 0);
      rCtx.lineTo(gx, 1024);
      rCtx.stroke();
    }

    // Wood polymer fiber noise & organic grain streaks
    for (let f = 0; f < 450; f++) {
      const fx = startX + 2 + Math.random() * (plankWidth - 4);
      const fy = Math.random() * 1024;
      const fLen = 40 + Math.random() * 140;
      const alpha = 0.05 + Math.random() * 0.14;

      ctx.strokeStyle = Math.random() > 0.4 ? `rgba(0, 0, 0, ${alpha})` : `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 0.8 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + (Math.random() - 0.5) * 4, fy + fLen);
      ctx.stroke();
    }

    // Deep black seam gap between modular WPC planks
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(startX, 0, 3, 1024);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(startX + 3, 0, 1, 1024);

    bCtx.fillStyle = "#000000";
    bCtx.fillRect(startX, 0, 4, 1024);
    bCtx.fillStyle = "#ffffff";
    bCtx.fillRect(startX + 4, 0, 1, 1024);

    rCtx.fillStyle = "#ffffff";
    rCtx.fillRect(startX, 0, 4, 1024);
  }

  // Cross modular fasteners & fixings
  for (let sY = 80; sY < 1024; sY += 240) {
    for (let p = 0; p < plankCount; p++) {
      const sX = p * plankWidth + plankWidth / 2;

      ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
      ctx.beginPath();
      ctx.arc(sX, sY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = "#151515";
      bCtx.beginPath();
      bCtx.arc(sX, sY, 3.5, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;
  bumpTexture.repeat.set(1, 1);

  const roughTexture = new THREE.CanvasTexture(roughCanvas);
  roughTexture.wrapS = THREE.RepeatWrapping;
  roughTexture.wrapT = THREE.RepeatWrapping;
  roughTexture.repeat.set(1, 1);

  textureCache[cacheKey] = texture;
  textureCache[`${cacheKey}-bump`] = bumpTexture;
  textureCache[`${cacheKey}-rough`] = roughTexture;

  return { map: texture, bumpMap: bumpTexture, roughnessMap: roughTexture };
}

/**
 * Woven Sunbrella canvas fabric texture for umbrella canopy and outdoor lounge cushions
 */
export function createCanvasFabricTexture(
  baseHex = "#f5f2eb"
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = `canvas-${baseHex}`;
  if (textureCache[cacheKey]) {
    return { map: textureCache[cacheKey], bumpMap: textureCache[`${cacheKey}-bump`] };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext("2d");

  if (!ctx || !bCtx) {
    const d = new THREE.CanvasTexture(canvas);
    return { map: d, bumpMap: d };
  }

  const c = new THREE.Color(baseHex);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, 512, 512);

  // Micro cross-weave threads
  const step = 4;
  for (let x = 0; x < 512; x += step) {
    for (let y = 0; y < 512; y += step) {
      const isAlt = (x / step + y / step) % 2 === 0;
      ctx.fillStyle = isAlt ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.06)";
      ctx.fillRect(x, y, step, step);

      bCtx.fillStyle = isAlt ? "#606060" : "#a0a0a0";
      bCtx.fillRect(x, y, step, step);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 6);

  textureCache[cacheKey] = texture;
  textureCache[`${cacheKey}-bump`] = bump;

  return { map: texture, bumpMap: bump };
}

export function createArtificialTurfTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const cacheKey = "turf-texture";
  if (textureCache[cacheKey]) {
    return { map: textureCache[cacheKey], bumpMap: textureCache[`${cacheKey}-bump`] };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 512;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext("2d");

  if (!ctx || !bCtx) {
    const d = new THREE.CanvasTexture(canvas);
    return { map: d, bumpMap: d };
  }

  ctx.fillStyle = "#15803d";
  ctx.fillRect(0, 0, 512, 512);

  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 18000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 4 + Math.random() * 8;
    const angle = (Math.random() - 0.5) * 0.8;

    const gShades = ["#166534", "#15803d", "#22c55e", "#14532d", "#4ade80", "#84cc16"];
    ctx.strokeStyle = gShades[Math.floor(Math.random() * gShades.length)];
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
    ctx.stroke();

    bCtx.strokeStyle = Math.random() > 0.5 ? "#ffffff" : "#404040";
    bCtx.lineWidth = 1;
    bCtx.beginPath();
    bCtx.moveTo(x, y);
    bCtx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
    bCtx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(4, 4);

  textureCache[cacheKey] = texture;
  textureCache[`${cacheKey}-bump`] = bump;

  return { map: texture, bumpMap: bump };
}

/**
 * Vertical soft streaks for a falling water sheet. Drawn thrice per streak so the
 * pattern tiles seamlessly when the map is scrolled along V every frame.
 */
export function createFallingWaterTexture(): THREE.CanvasTexture {
  const cnv = document.createElement("canvas");
  cnv.width = 128;
  cnv.height = 256;
  const ctx = cnv.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(cnv);

  // Sheer translucent base — the sheet keeps its body between streaks
  ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
  ctx.fillRect(0, 0, 128, 256);

  for (let i = 0; i < 46; i++) {
    const x = Math.random() * 128;
    const w = 1 + Math.random() * 5;
    const y0 = Math.random() * 256;
    const h = 50 + Math.random() * 170;
    const peak = 0.3 + Math.random() * 0.5;
    for (const dy of [-256, 0, 256]) {
      const grad = ctx.createLinearGradient(0, y0 + dy, 0, y0 + dy + h);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(0.45, `rgba(240, 249, 255, ${peak})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y0 + dy, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(cnv);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Soft tileable light blotches for a still pool surface — drift the offset slowly
 * to fake light refraction on the water.
 */
export function createWaterCausticsTexture(): THREE.CanvasTexture {
  const size = 128;
  const cnv = document.createElement("canvas");
  cnv.width = size;
  cnv.height = size;
  const ctx = cnv.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(cnv);

  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 22; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 8 + Math.random() * 22;
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        const grad = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        grad.addColorStop(0, "rgba(224, 242, 254, 0.55)");
        grad.addColorStop(0.6, "rgba(186, 230, 253, 0.25)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(cnv);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
