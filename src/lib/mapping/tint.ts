/**
 * Canvas tint helpers for mapping segment crops / composites.
 * Multiply-blend toward a hex so white armor picks up the color clearly.
 */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    const r = parseInt(h[0]! + h[0]!, 16);
    const g = parseInt(h[1]! + h[1]!, 16);
    const b = parseInt(h[2]! + h[2]!, 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }
  return null;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("tint: image load failed"));
    img.src = dataUrl;
  });
}

/** Strength of colorize toward hex (0–1). Higher = more obvious paint. */
const TINT_AMOUNT = 0.72;

/**
 * Recolor an image data URL toward `hex` via luminance-preserving mix + multiply.
 * Transparent pixels stay transparent.
 */
export async function tintImageDataUrl(dataUrl: string, hex: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  const rgb = parseHex(hex);
  if (!rgb) return dataUrl;

  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const amount = TINT_AMOUNT;

  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a === 0) continue;
    const r0 = d[i]!;
    const g0 = d[i + 1]!;
    const b0 = d[i + 2]!;
    // Multiply toward tint (white → hex), then mix with original by amount
    const mr = (r0 * rgb.r) / 255;
    const mg = (g0 * rgb.g) / 255;
    const mb = (b0 * rgb.b) / 255;
    d[i] = Math.round(r0 * (1 - amount) + mr * amount);
    d[i + 1] = Math.round(g0 * (1 - amount) + mg * amount);
    d[i + 2] = Math.round(b0 * (1 - amount) + mb * amount);
  }

  ctx.putImageData(imageData, 0, 0);
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}

/**
 * Tint a rectangular region of an existing canvas in place (pixel buffer).
 * Used when compositing tints onto the full keyed front/back figure.
 */
export function tintCanvasRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hex: string,
): void {
  const rgb = parseHex(hex);
  if (!rgb || w < 1 || h < 1) return;
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.floor(w));
  const sh = Math.max(1, Math.floor(h));
  const canvas = ctx.canvas;
  if (sx >= canvas.width || sy >= canvas.height) return;
  const cw = Math.min(sw, canvas.width - sx);
  const ch = Math.min(sh, canvas.height - sy);
  if (cw < 1 || ch < 1) return;

  const imageData = ctx.getImageData(sx, sy, cw, ch);
  const d = imageData.data;
  const amount = TINT_AMOUNT;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]!;
    if (a === 0) continue;
    const r0 = d[i]!;
    const g0 = d[i + 1]!;
    const b0 = d[i + 2]!;
    const mr = (r0 * rgb.r) / 255;
    const mg = (g0 * rgb.g) / 255;
    const mb = (b0 * rgb.b) / 255;
    d[i] = Math.round(r0 * (1 - amount) + mr * amount);
    d[i + 1] = Math.round(g0 * (1 - amount) + mg * amount);
    d[i + 2] = Math.round(b0 * (1 - amount) + mb * amount);
  }
  ctx.putImageData(imageData, sx, sy);
}

/**
 * Tint inside a polygonal region (normalized or pixel points).
 * Points are in canvas pixel space. Outside the polygon is untouched.
 */
export function tintCanvasPolygon(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  hex: string,
): void {
  if (points.length < 3) return;
  const rgb = parseHex(hex);
  if (!rgb) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const sx = Math.max(0, Math.floor(minX));
  const sy = Math.max(0, Math.floor(minY));
  const canvas = ctx.canvas;
  if (sx >= canvas.width || sy >= canvas.height) return;
  const cw = Math.min(Math.ceil(maxX) - sx + 1, canvas.width - sx);
  const ch = Math.min(Math.ceil(maxY) - sy + 1, canvas.height - sy);
  if (cw < 1 || ch < 1) return;

  // Build clip mask via offscreen path test
  const imageData = ctx.getImageData(sx, sy, cw, ch);
  const d = imageData.data;
  const amount = TINT_AMOUNT;

  const inside = (px: number, py: number): boolean => {
    // Ray cast
    let odd = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const pi = points[i]!;
      const pj = points[j]!;
      const yi = pi.y;
      const yj = pj.y;
      if ((yi > py) !== (yj > py) && px < ((pj.x - pi.x) * (py - yi)) / (yj - yi + 1e-9) + pi.x) {
        odd = !odd;
      }
    }
    return odd;
  };

  for (let row = 0; row < ch; row++) {
    for (let col = 0; col < cw; col++) {
      const i = (row * cw + col) * 4;
      const a = d[i + 3]!;
      if (a === 0) continue;
      if (!inside(sx + col + 0.5, sy + row + 0.5)) continue;
      const r0 = d[i]!;
      const g0 = d[i + 1]!;
      const b0 = d[i + 2]!;
      const mr = (r0 * rgb.r) / 255;
      const mg = (g0 * rgb.g) / 255;
      const mb = (b0 * rgb.b) / 255;
      d[i] = Math.round(r0 * (1 - amount) + mr * amount);
      d[i + 1] = Math.round(g0 * (1 - amount) + mg * amount);
      d[i + 2] = Math.round(b0 * (1 - amount) + mb * amount);
    }
  }
  ctx.putImageData(imageData, sx, sy);
}
