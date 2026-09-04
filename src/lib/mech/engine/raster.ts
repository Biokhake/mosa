/**
 * =========================================================================
 * SILHOUETTE RASTERISER
 * =========================================================================
 *
 * Until now the engine reasoned about shapes it never looked at: "silhouette
 * straightness" was inferred from the VOLUME RATIO of angular vs curved
 * primitives, which is a proxy for the primitive vocabulary, not for the
 * outline a viewer actually reads.
 *
 * This projects the primitives into a 2-D occupancy grid on the CPU (no GPU,
 * no deps) so the critic can measure the real thing: how the contour flows,
 * whether the shape survives at thumbnail size, where the visual weight sits,
 * and how much geometry is buried where nobody will ever see it.
 */

import type { Prim } from "./types";

export type ViewId = "front" | "side" | "quarter";

export interface Silhouette {
  view: ViewId;
  res: number;
  /** res x res occupancy, 1 = covered */
  grid: Uint8Array;
  /** filled cell count */
  area: number;
  /** filled bounding box in cell coords */
  box: { u0: number; v0: number; u1: number; v1: number };
  /** world units per cell — lets callers convert back */
  scale: number;
}

// ---------------------------------------------------------------------------
// primitive -> convex point cloud
// ---------------------------------------------------------------------------

/** Half-extents of a primitive along its own local axes. */
function halfExtent(p: Prim): [number, number, number] {
  const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
  switch (p.kind) {
    case "cyl":
    case "cone": {
      const r = Math.max(a, b);
      return [r, c / 2, r];
    }
    case "capsule":
      return [a, b / 2 + a, a];
    case "sphere":
    case "hemi":
    case "octa":
      return [a, a, a];
    case "torus":
      return [a + b, b, a + b];
    case "trapPrism":
      return [Math.max(a, b) / 2, c / 2, (p.depth ?? 0.04) / 2];
    default:
      return [a / 2, b / 2, c / 2];
  }
}

const ROUND = new Set<Prim["kind"]>(["cyl", "cone", "capsule", "sphere", "hemi", "torus"]);

/**
 * Corner cloud for a primitive in world space. Boxy kinds give the 8 oriented
 * box corners (exact); round kinds give a bevelled cloud so the projection
 * does not square off a cylinder.
 */
function primPoints(p: Prim): [number, number, number][] {
  const [hx, hy, hz] = halfExtent(p);
  const pts: [number, number, number][] = [];
  const round = ROUND.has(p.kind);
  // for round shapes trim the corners toward the inscribed circle
  const k = round ? Math.SQRT1_2 : 1;

  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        pts.push([sx * hx * k, sy * hy, sz * hz * k]);
      }
    }
  }
  if (round) {
    // add the axis extremes the trimmed corners would otherwise lose
    for (const s of [-1, 1]) {
      pts.push([s * hx, 0, 0], [0, s * hy, 0], [0, 0, s * hz]);
    }
  }

  const [rx, ry, rz] = p.rot ?? [0, 0, 0];
  const cx = Math.cos(rx), sx2 = Math.sin(rx);
  const cy = Math.cos(ry), sy2 = Math.sin(ry);
  const cz = Math.cos(rz), sz2 = Math.sin(rz);

  return pts.map(([x0, y0, z0]) => {
    // Euler XYZ: Rx * Ry * Rz
    let x = x0 * cz - y0 * sz2;
    let y = x0 * sz2 + y0 * cz;
    let z = z0;
    const x1 = x * cy + z * sy2;
    const z1 = -x * sy2 + z * cy;
    x = x1;
    z = z1;
    const y1 = y * cx - z * sx2;
    const z2 = y * sx2 + z * cx;
    y = y1;
    z = z2;
    return [x + p.pos[0], y + p.pos[1], z + p.pos[2]] as [number, number, number];
  });
}

/** Project a world point onto the view plane. */
function project(pt: [number, number, number], view: ViewId): [number, number] {
  const [x, y, z] = pt;
  if (view === "front") return [x, y];
  if (view === "side") return [z, y];
  const s = Math.SQRT1_2; // 45 degrees about Y
  return [x * s + z * s, y];
}

// ---------------------------------------------------------------------------
// convex hull + scanline fill
// ---------------------------------------------------------------------------

function hull(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts;
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of s) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function fillPolygon(grid: Uint8Array, res: number, poly: [number, number][]) {
  if (poly.length < 3) return;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const [, v] of poly) {
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  const v0 = Math.max(0, Math.floor(minV));
  const v1 = Math.min(res - 1, Math.ceil(maxV));
  const xs: number[] = [];
  for (let v = v0; v <= v1; v++) {
    const cy = v + 0.5;
    xs.length = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[i]!;
      const [bx, by] = poly[j]!;
      if (ay > cy !== by > cy) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const u0 = Math.max(0, Math.round(xs[i]!));
      const u1 = Math.min(res - 1, Math.round(xs[i + 1]!));
      for (let u = u0; u <= u1; u++) grid[v * res + u] = 1;
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * Rasterise a part / kit into an occupancy grid. The frame is fitted to the
 * geometry with a small margin, so metrics are scale-invariant.
 */
export function rasterize(prims: Prim[], view: ViewId, res = 96): Silhouette {
  const grid = new Uint8Array(res * res);
  const empty: Silhouette = { view, res, grid, area: 0, box: { u0: 0, v0: 0, u1: 0, v1: 0 }, scale: 1 };
  if (!prims.length) return empty;

  const clouds = prims.map((p) => primPoints(p).map((q) => project(q, view)));
  let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
  for (const c of clouds) {
    for (const [u, v] of c) {
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
  }
  const spanU = maxU - minU || 1;
  const spanV = maxV - minV || 1;
  const span = Math.max(spanU, spanV);
  if (!isFinite(span) || span <= 0) return empty;

  const margin = 0.06;
  const usable = res * (1 - margin * 2);
  const k = usable / span;
  const offU = res / 2 - ((minU + maxU) / 2) * k;
  const offV = res / 2 - ((minV + maxV) / 2) * k;

  for (const c of clouds) {
    // +v is up in world, but rows go down — flip so the grid reads like an image
    const cells = c.map(([u, v]) => [u * k + offU, res - (v * k + offV)] as [number, number]);
    fillPolygon(grid, res, hull(cells));
  }

  let area = 0;
  let u0 = res, v0 = res, u1 = -1, v1 = -1;
  for (let v = 0; v < res; v++) {
    for (let u = 0; u < res; u++) {
      if (!grid[v * res + u]) continue;
      area++;
      if (u < u0) u0 = u;
      if (u > u1) u1 = u;
      if (v < v0) v0 = v;
      if (v > v1) v1 = v;
    }
  }
  if (area === 0) return empty;
  return { view, res, grid, area, box: { u0, v0, u1, v1 }, scale: 1 / k };
}

// ---------------------------------------------------------------------------
// metrics read off the raster
// ---------------------------------------------------------------------------

export interface SilhouetteMetrics {
  /** filled area / filled-bbox area — 1 is a solid slab, low is spindly */
  solidity: number;
  /** perimeter^2 / (4*pi*area). 1 = circle. High = ragged, noisy outline. */
  contourComplexity: number;
  /** does the shape survive being shrunk to a thumbnail? 0..1 */
  readability: number;
  /** filled height / width */
  verticality: number;
  /** |left - right| / area — 0 is perfectly balanced */
  balance: number;
  /** mean |d(width)/dv| — low is a flowing taper, high is a jumpy stack */
  profileJitter: number;
  /** share of the filled bbox that is background enclosed by the shape */
  negativeSpace: number;
  /**
   * Measured from the OUTLINE, not from the primitive vocabulary: an angular
   * shape turns in a few sharp corners (its edge slope changes are sparse and
   * large), a curved one turns continuously (many small changes). 1 = faceted,
   * 0 = smooth.
   */
  contourAngularity: number;
}

/** Left/right outline columns per row, over the filled bounding box. */
function edgeProfiles(s: Silhouette): { left: number[]; right: number[] } {
  const { grid, res, box } = s;
  const left: number[] = [];
  const right: number[] = [];
  for (let v = box.v0; v <= box.v1; v++) {
    let lo = -1, hi = -1;
    for (let u = box.u0; u <= box.u1; u++) {
      if (grid[v * res + u]) {
        if (lo < 0) lo = u;
        hi = u;
      }
    }
    if (lo >= 0) {
      left.push(lo);
      right.push(hi);
    }
  }
  return { left, right };
}

/**
 * Angularity of one outline. A faceted edge is piecewise straight: its second
 * difference is zero almost everywhere with a few corner spikes. A curved edge
 * turns a little on EVERY row. So: the share of rows that are locally flat.
 *
 * Measured over a 3-row window so single-pixel quantisation noise on a shallow
 * diagonal does not read as curvature.
 */
function edgeAngularity(edge: number[]): number {
  if (edge.length < 7) return 0.5;
  let flat = 0;
  let n = 0;
  for (let i = 2; i + 2 < edge.length; i++) {
    // local curvature over a wider stencil than a bare 2nd difference
    const c = Math.abs((edge[i + 2]! - edge[i]!) - (edge[i]! - edge[i - 2]!));
    n++;
    if (c < 1.0) flat++;
  }
  return n ? flat / n : 0.5;
}

function widthProfile(s: Silhouette, bands = 24): number[] {
  const { grid, res, box } = s;
  const h = box.v1 - box.v0 + 1;
  const out: number[] = [];
  for (let b = 0; b < bands; b++) {
    const a = box.v0 + Math.floor((b * h) / bands);
    const z = box.v0 + Math.max(a + 1, Math.floor(((b + 1) * h) / bands));
    let wide = 0;
    let rows = 0;
    for (let v = a; v < z && v <= box.v1; v++) {
      let lo = -1, hi = -1;
      for (let u = box.u0; u <= box.u1; u++) {
        if (grid[v * res + u]) {
          if (lo < 0) lo = u;
          hi = u;
        }
      }
      if (lo >= 0) {
        wide += hi - lo + 1;
        rows++;
      }
    }
    out.push(rows ? wide / rows : 0);
  }
  return out;
}

function downsampleFill(s: Silhouette, to: number): Uint8Array {
  const { grid, res } = s;
  const out = new Uint8Array(to * to);
  const step = res / to;
  for (let v = 0; v < to; v++) {
    for (let u = 0; u < to; u++) {
      let hit = 0;
      let n = 0;
      const v0 = Math.floor(v * step), v1 = Math.floor((v + 1) * step);
      const u0 = Math.floor(u * step), u1 = Math.floor((u + 1) * step);
      for (let vv = v0; vv < v1; vv++)
        for (let uu = u0; uu < u1; uu++) {
          n++;
          if (grid[vv * res + uu]) hit++;
        }
      out[v * to + u] = n && hit / n >= 0.5 ? 1 : 0;
    }
  }
  return out;
}

export function measureSilhouette(s: Silhouette): SilhouetteMetrics {
  const { grid, res, area, box } = s;
  if (!area) {
    return {
      solidity: 0, contourComplexity: 1, readability: 0,
      verticality: 1, balance: 0, profileJitter: 0, negativeSpace: 0,
      contourAngularity: 0.5,
    };
  }
  const bw = box.u1 - box.u0 + 1;
  const bh = box.v1 - box.v0 + 1;

  // perimeter: filled cells with at least one empty 4-neighbour
  let perim = 0;
  for (let v = box.v0; v <= box.v1; v++) {
    for (let u = box.u0; u <= box.u1; u++) {
      if (!grid[v * res + u]) continue;
      const up = v > 0 ? grid[(v - 1) * res + u] : 0;
      const dn = v < res - 1 ? grid[(v + 1) * res + u] : 0;
      const lf = u > 0 ? grid[v * res + u - 1] : 0;
      const rt = u < res - 1 ? grid[v * res + u + 1] : 0;
      if (!up || !dn || !lf || !rt) perim++;
    }
  }

  // enclosed background inside the filled bbox (notches / windows / gaps)
  let hole = 0;
  for (let v = box.v0; v <= box.v1; v++) {
    let lo = -1, hi = -1;
    for (let u = box.u0; u <= box.u1; u++) {
      if (grid[v * res + u]) {
        if (lo < 0) lo = u;
        hi = u;
      }
    }
    if (lo < 0) continue;
    for (let u = lo; u <= hi; u++) if (!grid[v * res + u]) hole++;
  }

  // left / right balance about the filled bbox centre
  const mid = (box.u0 + box.u1) / 2;
  let left = 0, right = 0;
  for (let v = box.v0; v <= box.v1; v++) {
    for (let u = box.u0; u <= box.u1; u++) {
      if (!grid[v * res + u]) continue;
      if (u < mid) left++;
      else if (u > mid) right++;
    }
  }

  // readability: how much of the shape is preserved at 16x16
  const small = downsampleFill(s, 16);
  let smallArea = 0;
  for (let i = 0; i < small.length; i++) smallArea += small[i]!;
  const expected = (area / (res * res)) * 256;
  const readability = expected > 0 ? Math.min(1, smallArea / Math.max(1, expected)) : 0;

  const prof = widthProfile(s);
  let jitter = 0;
  for (let i = 1; i < prof.length; i++) jitter += Math.abs(prof[i]! - prof[i - 1]!);
  const meanW = prof.reduce((a, b) => a + b, 0) / (prof.length || 1) || 1;

  const { left: lp, right: rp } = edgeProfiles(s);
  const contourAngularity = (edgeAngularity(lp) + edgeAngularity(rp)) / 2;

  return {
    solidity: area / Math.max(1, bw * bh),
    contourComplexity: (perim * perim) / (4 * Math.PI * area),
    readability,
    verticality: bh / Math.max(1, bw),
    balance: Math.abs(left - right) / Math.max(1, left + right),
    profileJitter: jitter / (prof.length - 1) / meanW,
    negativeSpace: hole / Math.max(1, area + hole),
    contourAngularity,
  };
}

/** Depth of a point along the view direction — larger is nearer the camera. */
function depthOf(pt: [number, number, number], view: ViewId): number {
  const [x, y, z] = pt;
  void y;
  if (view === "front") return z;
  if (view === "side") return x;
  return (x + z) * Math.SQRT1_2;
}

/**
 * Which primitives actually show up on screen, from any of the given views.
 *
 * Single painter's pass per view: primitives are drawn nearest-first and only
 * claim cells that are still empty, so a prim buried behind others claims
 * nothing. (The previous implementation re-rasterised the whole part once per
 * primitive, which was O(n^2) and dominated the critic's cost.)
 */
export function visiblePrims(
  prims: Prim[],
  views: ViewId[] = ["front", "quarter"],
  res = 56,
): boolean[] {
  const seen = new Array<boolean>(prims.length).fill(false);
  if (!prims.length) return seen;

  for (const view of views) {
    const clouds = prims.map((p) => primPoints(p));
    const flat = clouds.map((c) => c.map((q) => project(q, view)));
    let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
    for (const c of flat)
      for (const [u, v] of c) {
        if (u < minU) minU = u;
        if (u > maxU) maxU = u;
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    const span = Math.max(maxU - minU, maxV - minV) || 1;
    if (!isFinite(span)) continue;
    const k = (res * 0.88) / span;
    const offU = res / 2 - ((minU + maxU) / 2) * k;
    const offV = res / 2 - ((minV + maxV) / 2) * k;

    // nearest first
    const order = prims
      .map((p, i) => ({
        i,
        d: Math.max(...clouds[i]!.map((q) => depthOf(q, view))),
      }))
      .sort((a, b) => b.d - a.d);

    const owner = new Int32Array(res * res).fill(-1);
    const claimed = new Array<number>(prims.length).fill(0);
    const scratch = new Uint8Array(res * res);

    for (const { i } of order) {
      scratch.fill(0);
      const cells = flat[i]!.map(([u, v]) => [u * k + offU, res - (v * k + offV)] as [number, number]);
      fillPolygon(scratch, res, hull(cells));
      for (let c = 0; c < scratch.length; c++) {
        if (scratch[c] && owner[c] === -1) {
          owner[c] = i;
          claimed[i]!++;
        }
      }
    }
    // a prim needs a real patch of screen, not a sliver, to count as visible
    const floor = Math.max(2, Math.round(res * res * 0.0015));
    for (let i = 0; i < prims.length; i++) if (claimed[i]! >= floor) seen[i] = true;
  }
  return seen;
}

/** Fraction of prims that contribute nothing to any silhouette (fully buried). */
export function hiddenShare(prims: Prim[], views: ViewId[] = ["front", "quarter"]): number {
  if (prims.length < 2) return 0;
  const vis = visiblePrims(prims, views);
  let hidden = 0;
  for (const v of vis) if (!v) hidden++;
  return hidden / prims.length;
}
