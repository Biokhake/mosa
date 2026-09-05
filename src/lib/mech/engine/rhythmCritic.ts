/**
 * Rhythm / multi-mass silhouette critic helpers.
 * Wired from critique() after existing penalties — see ENGINE-RHYTHM.md.
 */

import { clamp } from "./rng";
import type { Prim } from "./types";

export interface RhythmPenalties {
  penalties: Record<string, number>;
  notes: string[];
}

function kindOf(p: Prim): string {
  return p.kind;
}

/**
 * Penalise mono-blob bases and trim-salvaged designs; reward kind diversity
 * among mass-tier prims.
 */
export function rhythmPenalties(prims: Prim[]): RhythmPenalties {
  const pen: Record<string, number> = {};
  const notes: string[] = [];

  const masses = prims.filter((p) => p.tier === "mass");
  const accents = prims.filter(
    (p) => p.tier === "detail" || p.role === "accent" || p.role === "trim",
  );

  // Distinct logical masses (group counts as one)
  const groups = new Set<string>();
  let ungrouped = 0;
  for (const p of masses) {
    if (p.group) groups.add(p.group);
    else ungrouped++;
  }
  const massUnits = groups.size + ungrouped;

  if (massUnits < 2) {
    pen.monoBlob = 0.34;
    notes.push("base is a single mass (mono-blob) — needs interlocking solids");
  } else if (massUnits < 3) {
    pen.thinMass = 0.12;
    notes.push("only two mass units — silhouette rhythm is thin");
  }

  const kinds = new Set(masses.map(kindOf));
  if (masses.length >= 2 && kinds.size < 2) {
    pen.homoPrims = 0.22;
    notes.push("masses share one prim kind — want heterogeneous solids");
  } else if (masses.length >= 3 && kinds.size < 3) {
    pen.lowPrimMix = 0.1;
    notes.push("mass prim mix is narrow (want ≥3 kinds when 3+ masses)");
  }

  const accentShare = accents.length / Math.max(1, prims.length);
  if (massUnits <= 1 && accentShare > 0.18) {
    pen.trimSalvage = clamp(accentShare * 0.9, 0.2, 0.4);
    notes.push("trim/detail trying to salvage a weak base silhouette");
  } else if (massUnits <= 2 && accentShare > 0.28) {
    pen.trimHeavy = clamp((accentShare - 0.28) * 0.8, 0, 0.22);
    notes.push("accent share high relative to base mass count");
  }

  // Aspect contrast among ungrouped / group proxies: longest vs shortest extent
  const extents: number[] = [];
  for (const p of masses) {
    const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
    extents.push(Math.max(a, b, c));
  }
  if (extents.length >= 2) {
    const mx = Math.max(...extents);
    const mn = Math.min(...extents);
    const ratio = mx / Math.max(mn, 1e-6);
    if (ratio < 1.25) {
      pen.flatRhythm = 0.16;
      notes.push("mass extents too similar — silhouette lacks long/short rhythm");
    }
  }

  return { penalties: pen, notes };
}
