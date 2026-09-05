/**
 * Smart Head1/2/3 detection — structure proportions, not square partitions.
 *
 * ============================================================================
 * COGNITIVE CRITERIA (LOCKED) — what counts as Head / Face
 * ============================================================================
 * Head (for Head1/2/3) is NOT “upper half of silhouette”. It is:
 * 1. Topmost compact cranial mass of the standing figure
 * 2. Ends at the neck pinch — first significant width expansion toward shoulders
 *    (row where FG midline-run width jumps toward torso/shoulder scale)
 * 3. Head height typically ≤ ~18% of full figure height (HARD clamp; if the
 *    detector exceeds this, cut at neck / cap — never grow past 0.18 * bodyH)
 * 4. Head max width ≪ shoulder width — once row width ≥ ~1.6× median early-head
 *    width for several consecutive rows, that is torso/shoulder → stop the head
 *    band ABOVE that flare
 * 5. Exclude beam sabers / backpack tips protruding above the head: use the
 *    connected component of the CENTRAL top mass (near body midline), not
 *    leftmost/rightmost spikes
 * 6. Face (defined now; sub-rects wired later): within the head frontal band —
 *    eye/visor band (upper-mid head) + chin/mouth (lower head). Face/Eye slots
 *    MUST use sub-rects strictly inside the head bbox — never leave the head ROI.
 *
 * Pipeline gate: find head ROI (top → neck pinch, capped, midline-centered)
 * FIRST, then split Head1/2/3 only inside that ROI. Polygons that escape the
 * head ROI are clipped back in.
 *
 * Semantics (3-way split INSIDE the head ROI):
 * - Head1 — large-area skull (main cranial mass)
 * - Head2 — structures on top of the skull (V-fin / crest / antennas)
 * - Head3 — structures wrapping side → back of head (cheek/ear/rear helmet)
 *
 * Merge rule (Head1+Head2):
 * - Gundam-like: distinct top protrusion → keep Head1 / Head2 split.
 * - Zaku / streamlined: top melts into skull — do NOT treat Head2 as "missing".
 *   Auto-detect low fin prominence → suggestMergeHead12; when merged, Head2 is
 *   hidden/folded into Head1 (union polygon) and Head3 stays separate when present.
 * - User may force merge or force split via store mergeHead12Mode.
 */

export type NormRect = { x: number; y: number; w: number; h: number };

export type NormPoint = { x: number; y: number };
export type HeadPartId = "Head1" | "Head2" | "Head3";

export interface SmartHeadPart {
  id: HeadPartId;
  view: "front" | "back";
  polygon: NormPoint[];
  normRect: NormRect;
  /** False when Head2 is folded into Head1 under merge. */
  visible: boolean;
}

export interface SmartHeadAnalysis {
  front: SmartHeadPart[];
  back: SmartHeadPart[];
  /** Auto: true when top protrusion is weak (streamlined / Zaku-like). */
  suggestMergeHead12: boolean;
  /** Vertical prominence of top structures vs total head height (0–1). */
  finRatio: number;
  headBBoxFront: NormRect | null;
}

export type MergeHead12Mode = "auto" | "forceMerge" | "forceSplit";

const HEAD_SLOT_IDS = new Set(["Head1", "Head2", "Head3"]);

export function isHeadSmartSlot(slotId: string): boolean {
  return HEAD_SLOT_IDS.has(slotId);
}

/** Effective merge given detector suggestion + user mode. */
export function effectiveMergeHead12(
  mode: MergeHead12Mode,
  suggestMerge: boolean,
): boolean {
  if (mode === "forceMerge") return true;
  if (mode === "forceSplit") return false;
  return suggestMerge;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("smartHead: image load failed"));
    img.src = dataUrl;
  });
}

function isNearWhite(r: number, g: number, b: number, tol = 10): boolean {
  // Tight key: RX-78 white armor (~235–250) must NOT be treated as background.
  // Only near-paper whites from the canvas edge are keyed away.
  const minC = Math.min(r, g, b);
  const chroma = Math.max(r, g, b) - minC;
  return minC >= 255 - tol && chroma <= 12;
}

/** Edge-connected near-white key → FG mask (1 = figure). */
function keyFgMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8Array {
  const fg = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);
  let qh = 0;
  let qt = 0;

  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!isNearWhite(data[i]!, data[i + 1]!, data[i + 2]!)) return;
    visited[p] = 1;
    qx[qt] = x;
    qy[qt] = y;
    qt++;
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (qh < qt) {
    const x = qx[qh]!;
    const y = qy[qh]!;
    qh++;
    if (x > 0) push(x - 1, y);
    if (x + 1 < w) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < h) push(x, y + 1);
  }

  for (let p = 0; p < w * h; p++) {
    if (!visited[p]) fg[p] = 1;
  }
  return fg;
}

/**
 * Keep the FG component whose centroid is closest to body midline in the
 * top band — rejects lateral spikes (beam sabers / backpack tips).
 */
function keepCentralComponent(
  fg: Uint8Array,
  w: number,
  h: number,
  midX: number,
  y0: number,
  y1: number,
): void {
  const label = new Int32Array(w * h);
  label.fill(-1);
  const sizes: number[] = [];
  const cxSum: number[] = [];
  const cySum: number[] = [];
  let cid = 0;
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);

  for (let y = y0; y <= y1; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!fg[start] || label[start]! >= 0) continue;
      let qh = 0;
      let qt = 0;
      qx[qt] = x;
      qy[qt] = y;
      qt++;
      label[start] = cid;
      let sz = 0;
      let sx = 0;
      let sy = 0;
      while (qh < qt) {
        const cx = qx[qh]!;
        const cy = qy[qh]!;
        qh++;
        sz++;
        sx += cx;
        sy += cy;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ] as const) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (ny < y0 || ny > y1) continue;
          const np = ny * w + nx;
          if (!fg[np] || label[np]! >= 0) continue;
          label[np] = cid;
          qx[qt] = nx;
          qy[qt] = ny;
          qt++;
        }
      }
      sizes.push(sz);
      cxSum.push(sx / Math.max(1, sz));
      cySum.push(sy / Math.max(1, sz));
      cid++;
    }
  }
  if (sizes.length === 0) {
    // fall back to global largest
    keepLargestComponent(fg, w, h);
    return;
  }
  // Prefer large + near midline (top mass). Score = size / (1 + dx^2).
  let best = 0;
  let bestScore = -1;
  const minSz = Math.max(20, Math.floor(sizes.reduce((a, b) => a + b, 0) * 0.08));
  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i]! < minSz && sizes[i]! < sizes[best]!) continue;
    const dx = (cxSum[i]! - midX) / Math.max(1, w * 0.05);
    const score = sizes[i]! / (1 + dx * dx);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== best) fg[p] = 0;
  }
}

/** Keep largest 4-connected FG component; zero the rest. */
function keepLargestComponent(fg: Uint8Array, w: number, h: number): void {
  const label = new Int32Array(w * h);
  label.fill(-1);
  const sizes: number[] = [];
  let cid = 0;
  const qx = new Int32Array(w * h);
  const qy = new Int32Array(w * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (!fg[start] || label[start] >= 0) continue;
      let qh = 0;
      let qt = 0;
      qx[qt] = x;
      qy[qt] = y;
      qt++;
      label[start] = cid;
      let sz = 0;
      while (qh < qt) {
        const cx = qx[qh]!;
        const cy = qy[qh]!;
        qh++;
        sz++;
        const neigh = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ] as const;
        for (const [nx, ny] of neigh) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (!fg[np] || label[np]! >= 0) continue;
          label[np] = cid;
          qx[qt] = nx;
          qy[qt] = ny;
          qt++;
        }
      }
      sizes.push(sz);
      cid++;
    }
  }
  if (sizes.length === 0) return;
  let best = 0;
  for (let i = 1; i < sizes.length; i++) {
    if (sizes[i]! > sizes[best]!) best = i;
  }
  for (let p = 0; p < w * h; p++) {
    if (label[p] !== best) fg[p] = 0;
  }
}

function bboxOfMask(
  mask: Uint8Array,
  w: number,
  h: number,
): { x0: number; y0: number; x1: number; y1: number } | null {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1, y1 };
}

function rowSpan(
  mask: Uint8Array,
  w: number,
  y: number,
  x0: number,
  x1: number,
): { left: number; right: number; count: number } | null {
  let left = -1;
  let right = -1;
  let count = 0;
  for (let x = x0; x <= x1; x++) {
    if (!mask[y * w + x]) continue;
    if (left < 0) left = x;
    right = x;
    count++;
  }
  if (left < 0) return null;
  return { left, right, count };
}

/** Midline-connected FG run width on row y (0 if midline empty). */
function midlineRunWidth(
  fg: Uint8Array,
  w: number,
  y: number,
  midX: number,
): number {
  const mid = Math.max(0, Math.min(w - 1, Math.round(midX)));
  if (!fg[y * w + mid]) return 0;
  let L = mid;
  while (L > 0 && fg[y * w + (L - 1)]) L--;
  let R = mid;
  while (R < w - 1 && fg[y * w + (R + 1)]) R++;
  return R - L + 1;
}

export type HeadBand = {
  headTop: number;
  headBottom: number;
  headX0: number;
  headX1: number;
  bodyCx: number;
  earlyHeadW: number;
  shoulderW: number;
  bodyH: number;
};

/**
 * Find the locked head ROI: topmost cranial mass → neck pinch, hard-capped.
 * Returns midline-centered band; caller still keeps the central CC inside it.
 */
function findHeadBand(
  fg: Uint8Array,
  w: number,
  h: number,
  body: { x0: number; y0: number; x1: number; y1: number },
  bodyCx: number,
): HeadBand {
  const bodyH = Math.max(1, body.y1 - body.y0);
  const bodyW = Math.max(1, body.x1 - body.x0);
  const hardCapH = Math.max(4, Math.floor(bodyH * 0.18));
  const minHeadH = Math.max(4, Math.floor(bodyH * 0.075));

  // --- headTop: tip of central mass (V-fin included); ignore far-lateral sabers ---
  const probeHalf = Math.max(6, Math.floor(bodyW * 0.16));
  let headTop = body.y0;
  const topLimit = body.y0 + Math.floor(bodyH * 0.22);
  for (let y = body.y0; y <= topLimit; y++) {
    let near = 0;
    let nearLeft = w;
    let nearRight = 0;
    const x0 = Math.max(body.x0, Math.floor(bodyCx - probeHalf));
    const x1 = Math.min(body.x1, Math.ceil(bodyCx + probeHalf));
    for (let x = x0; x <= x1; x++) {
      if (!fg[y * w + x]) continue;
      near++;
      if (x < nearLeft) nearLeft = x;
      if (x > nearRight) nearRight = x;
    }
    const run = midlineRunWidth(fg, w, y, bodyCx);
    // central blob (V-fin tips often have run=0 at exact midline but near>0)
    if (near >= 6 && (run >= 3 || nearRight - nearLeft >= 4)) {
      headTop = y;
      break;
    }
  }

  // --- row profile: midline-connected run (true head/torso width cue) ---
  const scanEnd = Math.min(
    body.y1,
    headTop + Math.floor(bodyH * 0.36),
  );
  const rows: { y: number; run: number }[] = [];
  for (let y = headTop; y <= scanEnd; y++) {
    rows.push({ y, run: midlineRunWidth(fg, w, y, bodyCx) });
  }

  // Early-head width from the compact cranial band only (skip fin tip AND
  // stop before shoulder rows). Collect while run stays cranial-scale; abort
  // the early window at the first sharp widening so shoulders never pollute
  // the baseline.
  const earlyRuns: number[] = [];
  let earlyRunningMed = 0;
  for (const r of rows) {
    const rel = (r.y - headTop) / bodyH;
    if (rel < 0.02) continue; // skip hollow V-fin tip at midline
    if (rel > 0.09) break; // hard stop — shoulders are below this
    if (r.run < 8) continue;
    if (earlyRuns.length >= 5) {
      const sorted = earlyRuns.slice().sort((a, b) => a - b);
      earlyRunningMed = sorted[Math.floor(sorted.length * 0.5)]!;
      // sharp widen vs established cranial width → leave early band
      if (r.run >= earlyRunningMed * 1.55 && r.run >= earlyRunningMed + 12) {
        break;
      }
    }
    earlyRuns.push(r.run);
  }
  if (earlyRuns.length < 4) {
    for (const r of rows) {
      const rel = (r.y - headTop) / bodyH;
      if (rel < 0.015) continue;
      if (rel > 0.08) break;
      if (r.run >= 8) earlyRuns.push(r.run);
    }
  }
  earlyRuns.sort((a, b) => a - b);
  const earlyHeadW =
    earlyRuns.length > 0
      ? earlyRuns[Math.min(earlyRuns.length - 1, Math.floor(earlyRuns.length * 0.7))]!
      : Math.max(12, Math.floor(bodyW * 0.18));
  const earlyPeak =
    earlyRuns.length > 0 ? earlyRuns[earlyRuns.length - 1]! : earlyHeadW;

  // Smooth run profile
  const smooth: number[] = [];
  for (let i = 0; i < rows.length; i++) {
    let s = 0;
    let n = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j < 0 || j >= rows.length) continue;
      s += rows[j]!.run;
      n++;
    }
    smooth.push(s / Math.max(1, n));
  }

  // Shoulder flare: must exceed BOTH 1.6× early-head AND ~1.35× early peak,
  // so gradual helmet widening is not mistaken for shoulders.
  const flareThresh = Math.max(earlyHeadW * 1.6, earlyPeak * 1.35);
  let flareStart = -1;
  let streak = 0;
  for (let i = 0; i < rows.length; i++) {
    const rel = (rows[i]!.y - headTop) / bodyH;
    if (rel < 0.05) {
      streak = 0;
      continue;
    }
    if (smooth[i]! >= flareThresh || rows[i]!.run >= flareThresh) {
      streak++;
      if (streak >= 3) {
        flareStart = rows[i - 2]!.y;
        break;
      }
    } else {
      streak = 0;
    }
  }

  // Neck = local min just before flare, or classic dip→expand
  let neckY = headTop + Math.floor(bodyH * 0.12);
  let foundNeck = false;
  if (flareStart > headTop) {
    // search local min in window above flare
    const win0 = Math.max(headTop + minHeadH, flareStart - Math.floor(bodyH * 0.06));
    let best = Infinity;
    for (let i = 0; i < rows.length; i++) {
      const y = rows[i]!.y;
      if (y < win0 || y >= flareStart) continue;
      const wi = smooth[i]!;
      if (wi < best && wi > 0) {
        best = wi;
        neckY = y;
        foundNeck = true;
      }
    }
    if (!foundNeck) {
      neckY = Math.max(headTop + minHeadH, flareStart - 1);
      foundNeck = true;
    }
  }

  // Dip→expand fallback when flare detector is weak
  if (!foundNeck && smooth.length >= 8) {
    let bestScore = Infinity;
    const i0 = Math.floor(smooth.length * 0.15);
    const i1 = Math.floor(smooth.length * 0.75);
    for (let i = i0; i < i1; i++) {
      const wi = smooth[i]!;
      const before = smooth[Math.max(0, i - 4)]!;
      const after = smooth[Math.min(smooth.length - 1, i + 4)]!;
      if (wi > 0 && wi <= before * 0.95 && after >= wi * 1.12) {
        const score = wi / (earlyHeadW + 1);
        if (score < bestScore) {
          bestScore = score;
          neckY = rows[i]!.y;
          foundNeck = true;
        }
      }
    }
  }

  // HARD cap: head ≤ ~18% of full figure height
  const capBottom = headTop + hardCapH;
  let headBottom = Math.min(neckY, capBottom);
  headBottom = Math.max(headBottom, headTop + minHeadH);
  headBottom = Math.min(headBottom, capBottom, body.y1);

  // Shoulder width estimate (for lateral ROI clamp)
  let shoulderW = earlyHeadW * 2.2;
  const shSamples: number[] = [];
  const sh0 = headBottom;
  const sh1 = Math.min(body.y1, headBottom + Math.floor(bodyH * 0.1));
  for (let y = sh0; y <= sh1; y++) {
    const run = midlineRunWidth(fg, w, y, bodyCx);
    if (run > earlyHeadW * 1.2) shSamples.push(run);
  }
  if (shSamples.length) {
    shSamples.sort((a, b) => a - b);
    shoulderW = shSamples[Math.floor(shSamples.length * 0.6)]!;
  } else {
    // full-span fallback near mid-chest
    const y = body.y0 + Math.floor(bodyH * 0.22);
    const span = rowSpan(fg, w, y, body.x0, body.x1);
    if (span) shoulderW = span.right - span.left + 1;
  }

  // Lateral ROI: ≪ shoulder width (~0.55–0.62×), centered on midline
  const maxHeadW = Math.min(
    Math.max(shoulderW * 0.55, earlyHeadW * 1.15),
    Math.max(earlyHeadW * 1.5, earlyPeak * 1.2),
    shoulderW * 0.62,
    bodyW * 0.4,
  );
  const headHalf = Math.max(6, Math.floor(maxHeadW / 2));
  const headX0 = Math.max(0, Math.floor(bodyCx - headHalf));
  const headX1 = Math.min(w - 1, Math.ceil(bodyCx + headHalf));

  return {
    headTop,
    headBottom,
    headX0,
    headX1,
    bodyCx,
    earlyHeadW,
    shoulderW,
    bodyH,
  };
}

/** Clamp a normalized polygon into a norm rect (head ROI gate). */
function clipPolygonToNormRect(
  polygon: NormPoint[],
  rect: NormRect,
): NormPoint[] {
  const x0 = rect.x;
  const y0 = rect.y;
  const x1 = rect.x + rect.w;
  const y1 = rect.y + rect.h;
  return polygon.map((p) => ({
    x: Math.max(x0, Math.min(x1, p.x)),
    y: Math.max(y0, Math.min(y1, p.y)),
  }));
}

/** Bright / yellow / high-chroma score for crest / V-fin cues. */
function protrusionScore(
  data: Uint8ClampedArray,
  p: number,
): number {
  const r = data[p]!;
  const g = data[p + 1]!;
  const b = data[p + 2]!;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const chroma = maxC - minC;
  let score = 0;
  // yellow / gold crest or fin paint
  if (r > 140 && g > 120 && b < 140 && r > b + 25) score += 2;
  // red crest / mono-eye accents
  if (r > 150 && r > g + 40 && r > b + 40) score += 1.5;
  // high vertical extent white tip (not bg)
  if (minC > 180 && chroma < 40) score += 0.4;
  if (chroma > 50) score += 0.6;
  return score;
}

/**
 * Trace outer contour of a binary mask (Moore neighborhood) → pixel points.
 * Returns empty if mask is empty.
 */
function traceContour(
  mask: Uint8Array,
  w: number,
  h: number,
): { x: number; y: number }[] {
  const bb = bboxOfMask(mask, w, h);
  if (!bb) return [];
  // Find start: leftmost of top row in bbox
  let sx = -1;
  let sy = -1;
  outer: for (let y = bb.y0; y <= bb.y1; y++) {
    for (let x = bb.x0; x <= bb.x1; x++) {
      if (mask[y * w + x]) {
        sx = x;
        sy = y;
        break outer;
      }
    }
  }
  if (sx < 0) return [];

  // N, NE, E, SE, S, SW, W, NW
  const dx = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy = [-1, -1, 0, 1, 1, 1, 0, -1];

  const pts: { x: number; y: number }[] = [];
  let x = sx;
  let y = sy;
  let dir = 4; // came from north-ish; start looking west of south
  const maxSteps = (bb.x1 - bb.x0 + 1) * (bb.y1 - bb.y0 + 1) * 4;
  for (let step = 0; step < maxSteps; step++) {
    pts.push({ x, y });
    // start search from dir-2 (Moore)
    let found = false;
    for (let k = 0; k < 8; k++) {
      const nd = (dir + 6 + k) % 8; // turn left-ish first
      const nx = x + dx[nd]!;
      const ny = y + dy[nd]!;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (!mask[ny * w + nx]) continue;
      x = nx;
      y = ny;
      dir = nd;
      found = true;
      break;
    }
    if (!found) break;
    if (x === sx && y === sy && pts.length > 8) break;
  }
  return pts;
}

/** Ramer–Douglas–Peucker simplification in pixel space. */
function rdp(
  pts: { x: number; y: number }[],
  epsilon: number,
): { x: number; y: number }[] {
  if (pts.length < 3) return pts.slice();
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  let idx = -1;
  let maxDist = 0;
  const ax = first.x;
  const ay = first.y;
  const bx = last.x - ax;
  const by = last.y - ay;
  const denom = bx * bx + by * by || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const t = Math.max(0, Math.min(1, ((p.x - ax) * bx + (p.y - ay) * by) / denom));
    const px = ax + t * bx;
    const py = ay + t * by;
    const d = Math.hypot(p.x - px, p.y - py);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > epsilon && idx > 0) {
    const left = rdp(pts.slice(0, idx + 1), epsilon);
    const right = rdp(pts.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}


/** Monotone-chain convex hull. */
function convexHull(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  if (pts.length <= 2) return pts.slice();
  const sorted = pts.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function polygonFromMaskUnion(
  mask: Uint8Array,
  w: number,
  h: number,
  imgW: number,
  imgH: number,
  scaleX: number,
  scaleY: number,
  mode: "contour" | "hull" = "contour",
): { polygon: NormPoint[]; normRect: NormRect } | null {
  if (mode === "hull") {
    const pts: { x: number; y: number }[] = [];
    // subsample for speed
    const step = Math.max(1, Math.floor(Math.min(w, h) / 120));
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (mask[y * w + x]) pts.push({ x, y });
      }
    }
    // always include bbox extremes of mask
    const bb = bboxOfMask(mask, w, h);
    if (!bb) return null;
    // denser boundary sample
    for (let y = bb.y0; y <= bb.y1; y++) {
      let left = -1;
      let right = -1;
      for (let x = bb.x0; x <= bb.x1; x++) {
        if (!mask[y * w + x]) continue;
        if (left < 0) left = x;
        right = x;
      }
      if (left >= 0) {
        pts.push({ x: left, y });
        pts.push({ x: right, y });
      }
    }
    const hull = convexHull(pts);
    if (hull.length < 3) return null;
    const simplified = rdp(hull, Math.max(1.0, Math.min(w, h) * 0.01));
    const polygon: NormPoint[] = simplified.map((pt) => ({
      x: Math.max(0, Math.min(1, (pt.x * scaleX) / imgW)),
      y: Math.max(0, Math.min(1, (pt.y * scaleY) / imgH)),
    }));
    const normRect: NormRect = {
      x: (bb.x0 * scaleX) / imgW,
      y: (bb.y0 * scaleY) / imgH,
      w: ((bb.x1 - bb.x0 + 1) * scaleX) / imgW,
      h: ((bb.y1 - bb.y0 + 1) * scaleY) / imgH,
    };
    return { polygon, normRect };
  }
  return polygonFromMask(mask, w, h, imgW, imgH, scaleX, scaleY);
}

function polygonFromMask(
  mask: Uint8Array,
  w: number,
  h: number,
  imgW: number,
  imgH: number,
  scaleX: number,
  scaleY: number,
): { polygon: NormPoint[]; normRect: NormRect } | null {
  const raw = traceContour(mask, w, h);
  if (raw.length < 3) return null;
  const simplified = rdp(raw, Math.max(1.2, Math.min(w, h) * 0.012));
  // Ensure closed-ish unique points
  const polygon: NormPoint[] = simplified.map((p) => ({
    x: Math.max(0, Math.min(1, (p.x * scaleX) / imgW)),
    y: Math.max(0, Math.min(1, (p.y * scaleY) / imgH)),
  }));
  if (polygon.length < 3) return null;
  const bb = bboxOfMask(mask, w, h)!;
  const normRect: NormRect = {
    x: (bb.x0 * scaleX) / imgW,
    y: (bb.y0 * scaleY) / imgH,
    w: ((bb.x1 - bb.x0 + 1) * scaleX) / imgW,
    h: ((bb.y1 - bb.y0 + 1) * scaleY) / imgH,
  };
  return { polygon, normRect };
}

function emptyMask(n: number): Uint8Array {
  return new Uint8Array(n);
}

/**
 * Analyze one view (front or back) into Head1/2/3 masks → polygons.
 * Works on a downscaled buffer for speed.
 */
function analyzeView(
  img: HTMLImageElement,
  view: "front" | "back",
  merge: boolean,
): {
  parts: SmartHeadPart[];
  suggestMergeHead12: boolean;
  finRatio: number;
  headBBox: NormRect | null;
} {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const maxSide = 480;
  const scale = Math.min(1, maxSide / Math.max(imgW, imgH));
  const w = Math.max(32, Math.round(imgW * scale));
  const h = Math.max(32, Math.round(imgH * scale));
  const scaleX = imgW / w;
  const scaleY = imgH / h;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { parts: [], suggestMergeHead12: true, finRatio: 0, headBBox: null };
  }
  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const fg = keyFgMask(data, w, h);
  keepLargestComponent(fg, w, h);
  const body = bboxOfMask(fg, w, h);
  if (!body) {
    return { parts: [], suggestMergeHead12: true, finRatio: 0, headBBox: null };
  }

  // Body center X from mid-torso rows (more stable than top noise)
  const bodyH = Math.max(1, body.y1 - body.y0);
  let cxSum = 0;
  let cxN = 0;
  const midY0 = body.y0 + Math.floor(bodyH * 0.35);
  const midY1 = body.y0 + Math.floor(bodyH * 0.55);
  for (let y = midY0; y <= midY1; y++) {
    const span = rowSpan(fg, w, y, body.x0, body.x1);
    if (!span) continue;
    cxSum += (span.left + span.right) / 2;
    cxN++;
  }
  const bodyCx = cxN > 0 ? cxSum / cxN : (body.x0 + body.x1) / 2;

  // === HEAD ROI GATE (cognitive criteria) ===
  // Topmost cranial mass → neck pinch, ≤18% bodyH, midline-centered, no saber tips.
  const band = findHeadBand(fg, w, h, body, bodyCx);
  const { headTop, headBottom, headX0, headX1 } = band;

  // Seed head mask inside ROI, then keep ONLY the central connected component
  // (rejects beam-saber / backpack tips that poke into the band from the sides).
  const headMask = emptyMask(w * h);
  for (let y = headTop; y <= headBottom; y++) {
    for (let x = headX0; x <= headX1; x++) {
      const p = y * w + x;
      if (fg[p]) headMask[p] = 1;
    }
  }
  keepCentralComponent(headMask, w, h, bodyCx, headTop, headBottom);
  const headBb = bboxOfMask(headMask, w, h);
  if (!headBb) {
    return { parts: [], suggestMergeHead12: true, finRatio: 0, headBBox: null };
  }
  // Re-clamp bbox into the gated band (never expand past neck / 18% cap)
  headBb.y0 = Math.max(headBb.y0, headTop);
  headBb.y1 = Math.min(headBb.y1, headBottom);
  headBb.x0 = Math.max(headBb.x0, headX0);
  headBb.x1 = Math.min(headBb.x1, headX1);
  // Zero any mask pixels that escaped the clamp
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (!headMask[p]) continue;
      if (y < headBb.y0 || y > headBb.y1 || x < headBb.x0 || x > headBb.x1) {
        headMask[p] = 0;
      }
    }
  }

  const headH = Math.max(1, headBb.y1 - headBb.y0);
  const headW = Math.max(1, headBb.x1 - headBb.x0);

  // Row profile: V-fin rows often have a hollow center (2+ runs); skull is solid fill.
  type RowInfo = {
    y: number;
    width: number;
    left: number;
    right: number;
    fill: number;
    runs: number;
  };
  const profile: RowInfo[] = [];
  for (let y = headBb.y0; y <= headBb.y1; y++) {
    const span = rowSpan(headMask, w, y, headBb.x0, headBb.x1);
    if (!span) continue;
    let runs = 0;
    let prev = false;
    let count = 0;
    for (let x = span.left; x <= span.right; x++) {
      const on = !!headMask[y * w + x];
      if (on) count++;
      if (on && !prev) runs++;
      prev = on;
    }
    const width = span.right - span.left + 1;
    profile.push({
      y,
      width,
      left: span.left,
      right: span.right,
      fill: count / Math.max(1, width),
      runs,
    });
  }
  const maxHeadWidth = Math.max(...profile.map((p) => p.width), 1);

  // cranialY: first solid skull row after fin-like rows (hollow / low fill / multi-run)
  let cranialY = headBb.y0 + Math.floor(headH * 0.22);
  let sawFin = false;
  for (const row of profile) {
    const rel = (row.y - headBb.y0) / headH;
    if (rel > 0.5) break;
    const finLike =
      row.runs >= 2 ||
      row.fill < 0.72 ||
      (rel < 0.2 && row.width < maxHeadWidth * 0.85);
    if (finLike) {
      sawFin = true;
      continue;
    }
    // solid row
    if (sawFin || rel >= 0.12) {
      cranialY = row.y;
      break;
    }
  }

  // Boost cranialY downward if bright crest sits above
  let brightTop = 0;
  let brightN = 0;
  for (let y = headBb.y0; y < cranialY; y++) {
    for (let x = headBb.x0; x <= headBb.x1; x++) {
      const p = y * w + x;
      if (!headMask[p]) continue;
      const sc = protrusionScore(data, p * 4);
      if (sc >= 1.5) {
        brightTop += 1;
      }
      brightN++;
    }
  }
  const brightFrac = brightN > 0 ? brightTop / brightN : 0;

  const finHeight = Math.max(0, cranialY - headBb.y0);
  let finRatio = finHeight / headH;

  // Aspect of top region: tall thin fins raise finRatio confidence
  let topAspect = 0;
  {
    let tLeft = w;
    let tRight = 0;
    for (let y = headBb.y0; y < cranialY; y++) {
      const span = rowSpan(headMask, w, y, headBb.x0, headBb.x1);
      if (!span) continue;
      tLeft = Math.min(tLeft, span.left);
      tRight = Math.max(tRight, span.right);
    }
    if (tRight > tLeft) {
      topAspect = finHeight / Math.max(1, tRight - tLeft);
    }
  }

  // Distinct protrusion if fin takes meaningful vertical share OR high-aspect / bright
  const distinctTop =
    finRatio >= 0.12 ||
    (finRatio >= 0.08 && topAspect >= 0.55) ||
    (finRatio >= 0.08 && brightFrac >= 0.04);

  let suggestMergeHead12 = !distinctTop;
  // Honor caller's effective merge only — suggestion is reported separately.
  // (Probe with merge=false still returns split geometry + suggestMergeHead12.)
  const doMerge = merge;

  // Clamp / ensure a usable Head2 band when split (V-fin ≈ top 18–40% of head)
  if (!doMerge) {
    const minY = headBb.y0 + Math.floor(headH * 0.18);
    const maxY = headBb.y0 + Math.floor(headH * 0.4);
    if (distinctTop) {
      cranialY = Math.min(maxY, Math.max(minY, cranialY));
    } else {
      // Force-split on streamlined head: still expose a nominal top band
      cranialY = minY;
    }
    finRatio = (cranialY - headBb.y0) / headH;
  }

  // --- Build part masks ---
  const mask2 = emptyMask(w * h);
  const mask1 = emptyMask(w * h);
  const mask3 = emptyMask(w * h);

  const cx = (headBb.x0 + headBb.x1) / 2;
  // Lateral wrap: outer ~22% on each side of head, mid-lower band
  const sideMargin = headW * 0.22;
  const sideTop = headBb.y0 + Math.floor(headH * (doMerge ? 0.12 : 0.28));
  const sideBot = headBb.y1;

  for (let y = headBb.y0; y <= headBb.y1; y++) {
    for (let x = headBb.x0; x <= headBb.x1; x++) {
      const p = y * w + x;
      if (!headMask[p]) continue;

      const onSide =
        view === "back"
          ? y >= sideTop // back: rear helmet wrap ≈ whole mid/lower head band sides+center rear
          : (x <= headBb.x0 + sideMargin || x >= headBb.x1 - sideMargin) &&
            y >= sideTop &&
            y <= sideBot;

      if (!doMerge && y < cranialY) {
        // Top protrusion → Head2 (V-fin). Stay near midline — lateral spikes
        // (saber tips) are not Head2. Back-view side wrap may claim Head3.
        const nearMid = Math.abs(x - cx) <= headW * 0.42;
        if (view === "back" && onSide && y >= cranialY - 2) {
          mask3[p] = 1;
        } else if (nearMid) {
          mask2[p] = 1;
        } else {
          // far-lateral top noise: drop (do not promote into Head1/3 as fin)
        }
        continue;
      }

      if (onSide) {
        mask3[p] = 1;
      } else {
        mask1[p] = 1;
      }
    }
  }

  // Back view: Head3 prefers rear wrap — expand center of mid/lower into Head3 slightly
  if (view === "back") {
    for (let y = sideTop; y <= headBb.y1; y++) {
      for (let x = headBb.x0; x <= headBb.x1; x++) {
        const p = y * w + x;
        if (!headMask[p]) continue;
        // rear helmet: anything in lower 70% of head on back becomes Head3-biased
        const rel = (y - headBb.y0) / headH;
        if (rel >= 0.25) {
          if (mask1[p]) {
            mask1[p] = 0;
            mask3[p] = 1;
          }
        }
      }
    }
    // Keep a frontal-ish cranial core for Head1 on back (upper center)
    for (let y = headBb.y0; y <= headBb.y0 + Math.floor(headH * 0.45); y++) {
      for (let x = headBb.x0; x <= headBb.x1; x++) {
        const p = y * w + x;
        if (!headMask[p]) continue;
        if (Math.abs(x - cx) < headW * 0.28 && y < sideTop + headH * 0.15) {
          mask3[p] = 0;
          if (!mask2[p]) mask1[p] = 1;
        }
      }
    }
  }

  // Area sanity: tiny Head2 blob is noise, not a fin
  let head2Area = 0;
  let headArea = 0;
  for (let p = 0; p < w * h; p++) {
    if (headMask[p]) headArea++;
    if (mask2[p]) head2Area++;
  }
  const head2Frac = headArea > 0 ? head2Area / headArea : 0;
  if (!doMerge && (head2Frac < 0.035 || head2Area < 40)) {
    suggestMergeHead12 = true;
    finRatio = Math.min(finRatio, 0.05);
    for (let p = 0; p < w * h; p++) {
      if (mask2[p]) {
        mask2[p] = 0;
        if (!mask3[p]) mask1[p] = 1;
      }
    }
  }

  // When merged: Head2 empty; Head1 gets former top
  if (doMerge) {
    for (let p = 0; p < w * h; p++) {
      if (mask2[p]) {
        mask2[p] = 0;
        if (!mask3[p]) mask1[p] = 1;
      }
    }
  }

  // Clean each mask to largest blob (Head3 may be two side blobs — keep all decent components)
  keepLargestComponent(mask1, w, h);
  // Head2 may be a V-fin with briefly disconnected tips — keep all decent components
  if (!doMerge) {
    const label = new Int32Array(w * h);
    label.fill(-1);
    const sizes: number[] = [];
    let cid = 0;
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const start = y * w + x;
        if (!mask2[start] || label[start]! >= 0) continue;
        let qh = 0;
        let qt = 0;
        qx[qt] = x;
        qy[qt] = y;
        qt++;
        label[start] = cid;
        let sz = 0;
        while (qh < qt) {
          const cx0 = qx[qh]!;
          const cy0 = qy[qh]!;
          qh++;
          sz++;
          for (const [nx, ny] of [
            [cx0 - 1, cy0],
            [cx0 + 1, cy0],
            [cx0, cy0 - 1],
            [cx0, cy0 + 1],
          ] as const) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const np = ny * w + nx;
            if (!mask2[np] || label[np]! >= 0) continue;
            label[np] = cid;
            qx[qt] = nx;
            qy[qt] = ny;
            qt++;
          }
        }
        sizes.push(sz);
        cid++;
      }
    }
    const minSz = Math.max(8, Math.floor(headW * headH * 0.008));
    for (let p = 0; p < w * h; p++) {
      const lb = label[p]!;
      if (lb >= 0 && sizes[lb]! < minSz) mask2[p] = 0;
    }
  }

  // Head3: keep components above size threshold (both cheeks)
  {
    const label = new Int32Array(w * h);
    label.fill(-1);
    const sizes: number[] = [];
    let cid = 0;
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const start = y * w + x;
        if (!mask3[start] || label[start]! >= 0) continue;
        let qh = 0;
        let qt = 0;
        qx[qt] = x;
        qy[qt] = y;
        qt++;
        label[start] = cid;
        let sz = 0;
        while (qh < qt) {
          const cx0 = qx[qh]!;
          const cy0 = qy[qh]!;
          qh++;
          sz++;
          for (const [nx, ny] of [
            [cx0 - 1, cy0],
            [cx0 + 1, cy0],
            [cx0, cy0 - 1],
            [cx0, cy0 + 1],
          ] as const) {
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const np = ny * w + nx;
            if (!mask3[np] || label[np]! >= 0) continue;
            label[np] = cid;
            qx[qt] = nx;
            qy[qt] = ny;
            qt++;
          }
        }
        sizes.push(sz);
        cid++;
      }
    }
    const minSz = Math.max(12, Math.floor(headW * headH * 0.01));
    for (let p = 0; p < w * h; p++) {
      const lb = label[p]!;
      if (lb >= 0 && sizes[lb]! < minSz) mask3[p] = 0;
    }
  }

  // Normalized head ROI for polygon clipping (Face/Eye must stay inside too)
  const headRoiNorm: NormRect = {
    x: (headBb.x0 * scaleX) / imgW,
    y: (headBb.y0 * scaleY) / imgH,
    w: ((headBb.x1 - headBb.x0 + 1) * scaleX) / imgW,
    h: ((headBb.y1 - headBb.y0 + 1) * scaleY) / imgH,
  };

  const mkPart = (
    id: HeadPartId,
    mask: Uint8Array,
    visible: boolean,
  ): SmartHeadPart | null => {
    if (!visible) {
      // still provide empty stub? skip
      return null;
    }
    // Zero any mask pixels outside the locked head ROI before tracing
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (!mask[p]) continue;
        if (y < headBb.y0 || y > headBb.y1 || x < headBb.x0 || x > headBb.x1) {
          mask[p] = 0;
        }
      }
    }
    // Head2: hull of V-fin tips, but clipped to head ROI so it cannot balloon
    // into shoulders/chest. Head3: hull of cheek wraps, also clipped.
    const poly =
      id === "Head2" || id === "Head3"
        ? polygonFromMaskUnion(mask, w, h, imgW, imgH, scaleX, scaleY, "hull")
        : polygonFromMask(mask, w, h, imgW, imgH, scaleX, scaleY);
    if (!poly) return null;
    const clippedPoly = clipPolygonToNormRect(poly.polygon, headRoiNorm);
    const clippedRect = {
      x: Math.max(poly.normRect.x, headRoiNorm.x),
      y: Math.max(poly.normRect.y, headRoiNorm.y),
      w: 0,
      h: 0,
    };
    const r1x = Math.min(poly.normRect.x + poly.normRect.w, headRoiNorm.x + headRoiNorm.w);
    const r1y = Math.min(poly.normRect.y + poly.normRect.h, headRoiNorm.y + headRoiNorm.h);
    clippedRect.w = Math.max(0.002, r1x - clippedRect.x);
    clippedRect.h = Math.max(0.002, r1y - clippedRect.y);
    return {
      id,
      view,
      polygon: clippedPoly,
      normRect: clippedRect,
      visible: true,
    };
  };

  const parts: SmartHeadPart[] = [];
  const p1 = mkPart("Head1", mask1, true);
  if (p1) parts.push(p1);

  if (!doMerge) {
    const p2 = mkPart("Head2", mask2, true);
    if (p2) parts.push(p2);
  } else {
    // Hidden Head2 stub with empty polygon — callers hide via visibility
    parts.push({
      id: "Head2",
      view,
      polygon: p1?.polygon.slice() ?? [],
      normRect: p1?.normRect ?? { x: 0, y: 0, w: 0.1, h: 0.1 },
      visible: false,
    });
  }

  const p3 = mkPart("Head3", mask3, true);
  if (p3) parts.push(p3);

  // If Head3 missing, leave it — optional-ish but schema expects it; fallback to lateral strips of Head1 bbox
  if (!p3 && p1) {
    const r = p1.normRect;
    const left: NormPoint[] = [
      { x: r.x, y: r.y + r.h * 0.25 },
      { x: r.x + r.w * 0.28, y: r.y + r.h * 0.2 },
      { x: r.x + r.w * 0.28, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
    ];
    const right: NormPoint[] = [
      { x: r.x + r.w * 0.72, y: r.y + r.h * 0.2 },
      { x: r.x + r.w, y: r.y + r.h * 0.25 },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x + r.w * 0.72, y: r.y + r.h },
    ];
    // Use left+right as single polygon ring (left then right reversed) — simple U wrap
    const wrap = left.concat(right);
    parts.push({
      id: "Head3",
      view,
      polygon: wrap,
      normRect: {
        x: r.x,
        y: r.y + r.h * 0.2,
        w: r.w,
        h: r.h * 0.8,
      },
      visible: true,
    });
  }

  const headBBox: NormRect = { ...headRoiNorm };

  // Recompute finRatio for reporting (pre-merge geometry)
  if (!distinctTop) finRatio = Math.min(finRatio, 0.1);

  return {
    parts,
    suggestMergeHead12,
    finRatio,
    headBBox,
  };
}

let cacheKey: string | null = null;
let cacheResult: SmartHeadAnalysis | null = null;

function cacheId(front: string | null, back: string | null, merge: boolean): string {
  const fh = front ? `${front.length}:${front.slice(0, 64)}:${front.slice(-32)}` : "0";
  const bh = back ? `${back.length}:${back.slice(0, 64)}:${back.slice(-32)}` : "0";
  return `${fh}|${bh}|m:${merge ? 1 : 0}`;
}

/**
 * Analyze front/back kit images → Head1/2/3 polygons.
 * `merge` applies forced/effective Head1+Head2 union (Head2 hidden).
 */
export async function analyzeSmartHead(
  front: string | null,
  back: string | null,
  merge: boolean,
): Promise<SmartHeadAnalysis> {
  const key = cacheId(front, back, merge);
  if (cacheKey === key && cacheResult) return cacheResult;

  if (typeof document === "undefined") {
    const empty: SmartHeadAnalysis = {
      front: [],
      back: [],
      suggestMergeHead12: true,
      finRatio: 0,
      headBBoxFront: null,
    };
    return empty;
  }

  let frontImg: HTMLImageElement | null = null;
  let backImg: HTMLImageElement | null = null;
  try {
    if (front) frontImg = await loadImage(front);
  } catch {
    frontImg = null;
  }
  try {
    if (back) backImg = await loadImage(back);
  } catch {
    backImg = null;
  }

  let suggest = true;
  let finRatio = 0;
  let headBBoxFront: NormRect | null = null;
  let frontParts: SmartHeadPart[] = [];
  let backParts: SmartHeadPart[] = [];

  if (frontImg) {
    const fr = analyzeView(frontImg, "front", merge);
    frontParts = fr.parts;
    suggest = fr.suggestMergeHead12;
    finRatio = fr.finRatio;
    headBBoxFront = fr.headBBox;
  }
  if (backImg) {
    // Use front's merge decision for consistency; re-run back with same merge flag
    const br = analyzeView(backImg, "back", merge);
    backParts = br.parts;
    if (!frontImg) {
      suggest = br.suggestMergeHead12;
      finRatio = br.finRatio;
    }
  }

  // If caller asked merge=false but front suggests merge, and we're in a
  // "detect only" path — still report suggestion; parts reflect `merge` flag.
  // Re-analyze front with suggestion if merge was false but we need consistent
  // auto preview: caller passes effective merge already.

  const result: SmartHeadAnalysis = {
    front: frontParts,
    back: backParts,
    suggestMergeHead12: suggest,
    finRatio,
    headBBoxFront,
  };
  cacheKey = key;
  cacheResult = result;
  return result;
}

/** Invalidate analysis cache (e.g. after kit swap). */
export function clearSmartHeadCache(): void {
  cacheKey = null;
  cacheResult = null;
}

export function pickHeadPart(
  analysis: SmartHeadAnalysis,
  slotId: HeadPartId,
  preferView: "front" | "back" | "both" | null,
): SmartHeadPart | null {
  const preferBack = preferView === "back";
  const fromFront = analysis.front.find((p) => p.id === slotId) ?? null;
  const fromBack = analysis.back.find((p) => p.id === slotId) ?? null;
  if (slotId === "Head3" && fromBack?.visible) {
    // Head3 prefers back wrap when available, else front sides
    return fromBack ?? fromFront;
  }
  if (preferBack) return fromBack ?? fromFront;
  return fromFront ?? fromBack;
}

/**
 * Polygon-masked crop → PNG data URL (outside transparent).
 */
export function cropPolygonToDataUrl(
  img: HTMLImageElement,
  polygon: NormPoint[],
  normRect: NormRect,
  maxPx = 160,
): string | null {
  if (typeof document === "undefined" || polygon.length < 3) return null;
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  const sx = Math.floor(normRect.x * imgW);
  const sy = Math.floor(normRect.y * imgH);
  const sw = Math.max(1, Math.floor(normRect.w * imgW));
  const sh = Math.max(1, Math.floor(normRect.h * imgH));
  const scale = Math.min(1, maxPx / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, dw, dh);
  ctx.beginPath();
  polygon.forEach((pt, i) => {
    const lx = ((pt.x * imgW - sx) / sw) * dw;
    const ly = ((pt.y * imgH - sy) / sh) * dh;
    if (i === 0) ctx.moveTo(lx, ly);
    else ctx.lineTo(lx, ly);
  });
  ctx.closePath();
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
