/**
 * Measure a design, then classify it into the ID grammar.
 *
 * The ID is an OUTPUT: it describes what the measurement found, it does not
 * drive generation. `SSA-001` means "measured straight silhouette + sharp
 * edges + least decoration in that band".
 */

import { clamp } from "./rng";
import type { Band, MetricVector, Prim } from "./types";
import { rasterize, measureSilhouette } from "./raster";
import type { SilhouetteMetrics } from "./raster";

const ANGULAR = new Set<Prim["kind"]>(["box", "wedge", "trapPrism", "octa"]);
const CURVED = new Set<Prim["kind"]>(["cyl", "capsule", "sphere", "hemi", "torus"]);
const SHARP_ACCENT = new Set<Prim["kind"]>(["cone", "wedge"]);

function primVolume(p: Prim): number {
  const [a, b, c] = p.size;
  switch (p.kind) {
    case "box":
    case "wedge":
      return Math.abs(a * b * c) * (p.kind === "wedge" ? 0.5 : 1);
    case "trapPrism":
      return ((a + b) / 2) * c * (p.depth ?? 0.04);
    case "cyl":
      return Math.PI * ((a + b) / 2) ** 2 * c;
    case "cone":
      return (Math.PI / 3) * b ** 2 * c;
    case "capsule":
      return Math.PI * a ** 2 * b + (4 / 3) * Math.PI * a ** 3;
    case "sphere":
      return (4 / 3) * Math.PI * a ** 3;
    case "hemi":
      return (2 / 3) * Math.PI * a ** 3;
    case "octa":
      return (4 / 3) * a ** 3;
    case "torus":
      return 2 * Math.PI ** 2 * a * b ** 2;
    default:
      return a * a * a;
  }
}

const HALF_PI_C = Math.PI / 2;

/** Per-axis half-extents of a primitive, accounting for the common rotations. */
function halfExtent(p: Prim): [number, number, number] {
  const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
  switch (p.kind) {
    case "cyl":
    case "cone": {
      const r = Math.max(a, b);
      const rx = p.rot?.[0] ?? 0;
      const rz = p.rot?.[2] ?? 0;
      if (Math.abs(Math.abs(rz) - HALF_PI_C) < 0.4) return [c / 2, r, r];
      if (Math.abs(Math.abs(rx) - HALF_PI_C) < 0.4) return [r, c / 2, r];
      return [r, c / 2, r];
    }
    case "capsule":
      return [a, b / 2 + a, a];
    case "sphere":
    case "hemi":
    case "octa":
      return [a, a, a];
    case "trapPrism":
      return [Math.max(a, b) / 2, c / 2, (p.depth ?? 0.04) / 2];
    default:
      return [a / 2, b / 2, c / 2];
  }
}

function aabbUnion(prims: Prim[]): number {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of prims) {
    const e = halfExtent(p);
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, p.pos[k]! - e[k]!);
      max[k] = Math.max(max[k]!, p.pos[k]! + e[k]!);
    }
  }
  if (!isFinite(min[0]!)) return 1;
  return Math.max(1e-6, (max[0]! - min[0]!) * (max[1]! - min[1]!) * (max[2]! - min[2]!));
}

/**
 * `sil` lets a caller that has already rasterised the part (the critic does)
 * hand the measurement in rather than paying for a second projection.
 */
export function measureMetrics(prims: Prim[], sil?: SilhouetteMetrics): MetricVector {
  const masses = prims.filter((p) => p.tier === "mass");
  const details = prims.filter((p) => p.tier === "detail");
  const panels = prims.filter((p) => p.tier === "panel");

  // --- silhouette straightness ---
  // Measured off the PROJECTED OUTLINE (see raster.ts). The primitive-volume
  // ratio is kept only as a weak prior: a cylinder has a round section but a
  // straight silhouette, so the vocabulary alone is a poor witness.
  let angV = 0;
  let curV = 0;
  for (const p of masses) {
    const v = primVolume(p);
    if (ANGULAR.has(p.kind)) angV += v;
    else if (CURVED.has(p.kind)) curV += v;
  }
  const vocabStraight = angV + curV > 0 ? angV / (angV + curV) : 0.5;
  const contour = (sil ?? measureSilhouette(rasterize(prims, "front", 96))).contourAngularity;
  // remap the contour reading around its observed neutral so it spans 0..1
  const contourStraight = clamp((contour - 0.5) / 0.32 + 0.5, 0, 1);
  const silhouetteStraightness = contourStraight * 0.72 + vocabStraight * 0.28;

  // --- edge sharpness (1 - mean bevel of masses, + sharp accents) ---
  const meanBevel = masses.length
    ? masses.reduce((s, p) => s + (p.bevel ?? 0), 0) / masses.length
    : 0.3;
  const sharpAccents = prims.filter((p) => SHARP_ACCENT.has(p.kind) && p.tier !== "mass").length;
  const edgeSharpness = clamp(1 - meanBevel + Math.min(0.25, sharpAccents * 0.08), 0, 1);

  // --- decoration weight ---
  const totalV = prims.reduce((s, p) => s + primVolume(p), 0) || 1;
  const detailV = details.reduce((s, p) => s + primVolume(p), 0);
  const decorationWeight = clamp(
    details.length * 0.06 + panels.length * 0.05 + (detailV / totalV) * 3 + (masses.length - 2) * 0.08,
    0,
    1,
  );

  const layerDepth = masses.length;

  // --- symmetry error ---
  const eps = 0.006;
  let asym = 0;
  let off = 0;
  for (const p of prims) {
    if (Math.abs(p.pos[0]) < eps) continue;
    off++;
    const twin = prims.some(
      (o) =>
        o.kind === p.kind &&
        Math.abs(o.pos[0] + p.pos[0]) < eps * 3 &&
        Math.abs(o.pos[1] - p.pos[1]) < eps * 3 &&
        Math.abs(o.pos[2] - p.pos[2]) < eps * 3,
    );
    if (!twin) asym++;
  }
  const symmetryError = off ? asym / off : 0;

  const compactness = clamp(totalV / aabbUnion(prims), 0, 1);

  const detailZoneCompliance = details.length
    ? details.filter((p) => p.zone !== "armor").length / details.length
    : 1;

  return {
    silhouetteStraightness,
    edgeSharpness,
    decorationWeight,
    layerDepth,
    symmetryError,
    compactness,
    detailZoneCompliance,
  };
}

/** Band from the two angularity axes. */
export function classifyBand(m: MetricVector): Band {
  const major = m.silhouetteStraightness >= 0.5 ? "S" : "R";
  const form = m.edgeSharpness >= 0.5 ? "S" : "R";
  return `${major}${form}` as Band;
}

const BAND_BASE: Record<Band, number> = { SS: 1, SR: 26, RS: 51, RR: 76 };
const SKIP: Record<Band, string> = { SS: "S", SR: "R", RS: "S", RR: "R" };

/** Letters A..Z minus the band's skip letter — 25 slots. */
export function bandLetters(band: Band): string[] {
  const skip = SKIP[band];
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((c) => c !== skip);
}

/**
 * Assign an ID given the band and this design's rank (0..24) by decoration
 * within that band (0 = least decorated -> letter A -> serial = base).
 */
export function assignId(band: Band, rankInBand: number): string {
  const letters = bandLetters(band);
  const r = clamp(Math.round(rankInBand), 0, 24);
  const serial = BAND_BASE[band] + r;
  return `${band[0]}${band[1]}${letters[r]}-${String(serial).padStart(3, "0")}`;
}
