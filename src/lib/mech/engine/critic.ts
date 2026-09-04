/**
 * Composition critic.
 *
 * The grammar can place valid geometry that still looks *arbitrary* — panels
 * stacked without a pyramid, equal-size stair steps, protrusions with no root,
 * a silhouette that drifts off the brief's band. The critic scores those
 * failings so the generate-and-select loop (`refine.ts`) can throw the bad
 * rolls away.
 *
 * Score is 1 minus the sum of penalties; every penalty names itself so a
 * design's weak points are legible.
 */

import { clamp } from "./rng";
import type { Brief, Prim } from "./types";
import { measureMetrics } from "./classify";
import { rasterize, measureSilhouette, hiddenShare } from "./raster";
import type { SilhouetteMetrics } from "./raster";

export interface Critique {
  score: number;
  penalties: Record<string, number>;
  notes: string[];
  /** what the projected outline actually looks like */
  silhouette?: SilhouetteMetrics;
}

interface Box {
  cx: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  d: number;
}

const HALF_PI = Math.PI / 2;

/** Axis-aligned bounding box of a primitive, accounting for the common rotations. */
function box(p: Prim): Box {
  const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
  let w = a;
  let h = b;
  let d = c;
  switch (p.kind) {
    case "cyl":
    case "cone": {
      const r = Math.max(a, b);
      const rx = p.rot?.[0] ?? 0;
      const rz = p.rot?.[2] ?? 0;
      if (Math.abs(Math.abs(rz) - HALF_PI) < 0.4) [w, h, d] = [c, 2 * r, 2 * r];
      else if (Math.abs(Math.abs(rx) - HALF_PI) < 0.4) [w, h, d] = [2 * r, c, 2 * r];
      else [w, h, d] = [2 * r, c, 2 * r];
      break;
    }
    case "capsule":
      [w, h, d] = [2 * a, b + 2 * a, 2 * a];
      break;
    case "sphere":
    case "hemi":
    case "octa":
      [w, h, d] = [2 * a, 2 * a, 2 * a];
      break;
    case "trapPrism":
      [w, h, d] = [Math.max(a, b), c, p.depth ?? 0.04];
      break;
    default:
      break;
  }
  return { cx: p.pos[0], cy: p.pos[1], cz: p.pos[2], w, h, d };
}

function vol(b: Box): number {
  return Math.max(1e-7, b.w * b.h * b.d);
}

function span(boxes: Box[]): Box {
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    const e = [b.w / 2, b.h / 2, b.d / 2];
    const c = [b.cx, b.cy, b.cz];
    for (let k = 0; k < 3; k++) {
      mn[k] = Math.min(mn[k]!, c[k]! - e[k]!);
      mx[k] = Math.max(mx[k]!, c[k]! + e[k]!);
    }
  }
  return {
    cx: (mn[0]! + mx[0]!) / 2,
    cy: (mn[1]! + mx[1]!) / 2,
    cz: (mn[2]! + mx[2]!) / 2,
    w: mx[0]! - mn[0]!,
    h: mx[1]! - mn[1]!,
    d: mx[2]! - mn[2]!,
  };
}

/** Fraction of the smaller box's volume that lies inside the larger. */
function overlapFrac(a: Box, b: Box): number {
  const ox = Math.max(0, Math.min(a.cx + a.w / 2, b.cx + b.w / 2) - Math.max(a.cx - a.w / 2, b.cx - b.w / 2));
  const oy = Math.max(0, Math.min(a.cy + a.h / 2, b.cy + b.h / 2) - Math.max(a.cy - a.h / 2, b.cy - b.h / 2));
  const oz = Math.max(0, Math.min(a.cz + a.d / 2, b.cz + b.d / 2) - Math.max(a.cz - a.d / 2, b.cz - b.d / 2));
  const inter = ox * oy * oz;
  return inter / Math.min(vol(a), vol(b));
}

export function critique(prims: Prim[], brief: Brief): Critique {
  const pen: Record<string, number> = {};
  const notes: string[] = [];
  if (prims.length === 0) return { score: 0, penalties: { empty: 1 }, notes: ["no geometry"] };

  // one projection, shared by the metric vector and the silhouette rules below
  const sil = measureSilhouette(rasterize(prims, "front", 96));
  const m = measureMetrics(prims, sil);
  // prims tagged into the same group are one logical mass (a curved shell is a
  // profile stack, not a pyramid of plates) — merge before layering analysis
  const rawMasses = prims.filter((p) => p.tier === "mass");
  const grouped = new Map<string, Box>();
  const boxes: Box[] = [];
  for (const p of rawMasses) {
    const b = box(p);
    if (!p.group) {
      boxes.push(b);
      continue;
    }
    const cur = grouped.get(p.group);
    if (!cur) grouped.set(p.group, b);
    else {
      const lo = [Math.min(cur.cx - cur.w / 2, b.cx - b.w / 2), Math.min(cur.cy - cur.h / 2, b.cy - b.h / 2), Math.min(cur.cz - cur.d / 2, b.cz - b.d / 2)];
      const hi = [Math.max(cur.cx + cur.w / 2, b.cx + b.w / 2), Math.max(cur.cy + cur.h / 2, b.cy + b.h / 2), Math.max(cur.cz + cur.d / 2, b.cz + b.d / 2)];
      grouped.set(p.group, {
        cx: (lo[0]! + hi[0]!) / 2, cy: (lo[1]! + hi[1]!) / 2, cz: (lo[2]! + hi[2]!) / 2,
        w: hi[0]! - lo[0]!, h: hi[1]! - lo[1]!, d: hi[2]! - lo[2]!,
      });
    }
  }
  for (const b of grouped.values()) boxes.push(b);
  const masses = rawMasses;

  // 1 & 2 — LAYERING must be pyramidal, never an equal-size staircase.
  // Group masses into "columns": near-coincident in X and Z, stacked in Y or Z.
  let layerViol = 0;
  let stairViol = 0;
  const used = new Set<number>();
  for (let i = 0; i < boxes.length; i++) {
    if (used.has(i)) continue;
    const col = [i];
    for (let j = i + 1; j < boxes.length; j++) {
      if (used.has(j)) continue;
      const dx = Math.abs(boxes[i]!.cx - boxes[j]!.cx);
      const dz = Math.abs(boxes[i]!.cz - boxes[j]!.cz);
      // Only masses of comparable scale form a "layer stack" — a keel ridge or
      // a small guard seated on a big plate is a feature, not a tier. Width
      // alone is not enough to say so: a keel is a longitudinal feature running
      // most of the part, a knee guard is a local cap, and they are never two
      // layers of one stack however similar their widths happen to be. Both
      // extents have to be comparable before we call it a tier.
      const wr = boxes[i]!.w / (boxes[j]!.w || 1e-6);
      const hr = boxes[i]!.h / (boxes[j]!.h || 1e-6);
      const comparable = wr > 0.4 && wr < 2.5 && hr > 0.45 && hr < 2.2;
      if (comparable && dx < Math.max(boxes[i]!.w, boxes[j]!.w) * 0.5 && dz < Math.max(boxes[i]!.d, boxes[j]!.d) * 0.75) {
        col.push(j);
      }
    }
    if (col.length < 2) continue;
    col.forEach((k) => used.add(k));
    const zSpread = Math.max(...col.map((k) => boxes[k]!.cz)) - Math.min(...col.map((k) => boxes[k]!.cz));
    const ySpread = Math.max(...col.map((k) => boxes[k]!.cy)) - Math.min(...col.map((k) => boxes[k]!.cy));
    // "Each layer outward must be clearly smaller" is a statement about
    // LAYERING — plates stacked front-to-back off a base. It says nothing
    // about masses stacked ALONG the limb, where the governing shape rule is
    // the taper: a leg is wider at the knee than at the ankle, so ordering a
    // tapered stack bottom-to-top always yields a "growing" sequence and the
    // pyramid test fires on every correctly tapered limb. Taper is judged by
    // the proportion and silhouette rules; leave it to them.
    if (ySpread > zSpread) continue;
    const sorted = [...col].sort((x, y) => boxes[x]!.cz - boxes[y]!.cz);
    for (let k = 1; k < sorted.length; k++) {
      const lo = boxes[sorted[k - 1]!]!;
      const hi = boxes[sorted[k]!]!;
      const loA = lo.w * lo.h;
      const hiA = hi.w * hi.h;
      if (hiA >= loA * 0.92) layerViol++; // outer layer not clearly smaller
      else if (Math.abs(hiA - loA) < loA * 0.1) stairViol++; // near-equal = stair
    }
    if (sorted.length > 3) layerViol += sorted.length - 3; // more than two tiers
  }
  if (layerViol) {
    pen.layering = clamp(layerViol * 0.13, 0, 0.4);
    notes.push(`${layerViol} non-pyramidal layer step(s)`);
  }
  if (stairViol) {
    pen.stairs = clamp(stairViol * 0.16, 0, 0.4);
    notes.push(`${stairViol} equal-size stair step(s)`);
  }

  // 3 — DETAIL must not sit on armour.
  if (m.detailZoneCompliance < 1) {
    pen.detailZone = (1 - m.detailZoneCompliance) * 0.3;
    notes.push(`${Math.round((1 - m.detailZoneCompliance) * 100)}% of detail sits on armour`);
  }

  // 4 — ROOTING: joint-zone protrusions need a frame collar near their base.
  const collars = prims.filter((p) => p.role === "frame" && p.tier === "frame").map(box);
  const protr = prims.filter((p) => (p.tier === "mass" || p.tier === "detail") && p.zone === "joint");
  let unrooted = 0;
  for (const p of protr) {
    const b = box(p);
    const reach = Math.max(b.w, b.h, b.d) * 0.95;
    if (!collars.some((f) => Math.hypot(f.cx - b.cx, f.cy - b.cy, f.cz - b.cz) < reach)) unrooted++;
  }
  if (unrooted) {
    pen.rooting = clamp(unrooted * 0.1, 0, 0.3);
    notes.push(`${unrooted} unrooted protrusion(s)`);
  }

  // 4b — STANDOFF: rule 4 only watches the JOINT zone, so an armour mass could
  // stand proud of its own shell with nothing under it and never be flagged —
  // which is how a full-length keel ridge survived as a bare bar down the shin.
  // A narrow mass that protrudes has to earn it: either it FAIRS IN (a grouped
  // multi-segment run that tapers back into the surface) or it is ROOTED by a
  // frame collar. A single constant section standing off a flat face reads as
  // a part stuck on, not as styling.
  {
    const masses = prims.filter((p) => p.tier === "mass");
    const partW = span(prims.map(box)).w || 1;
    let standoff = 0;
    for (const p of masses) {
      if (p.zone !== "armor" || p.group) continue;
      const b = box(p);
      if (b.w > partW * 0.45) continue; // wide enough to read as a facet
      let others = -Infinity;
      for (const q of masses) {
        if (q === p) continue;
        const qb = box(q);
        others = Math.max(others, qb.cz + qb.d / 2);
      }
      if (!Number.isFinite(others)) continue;
      if (b.cz + b.d / 2 - others < b.d * 0.35) continue; // sits in the surface
      const reach = Math.max(b.w, b.d) * 0.9;
      if (collars.some((f) => Math.hypot(f.cx - b.cx, f.cy - b.cy, f.cz - b.cz) < reach)) continue;
      standoff++;
    }
    if (standoff) {
      pen.standoff = clamp(standoff * 0.12, 0, 0.24);
      notes.push(`${standoff} narrow armour mass(es) stand proud with no fairing or root`);
    }
  }

  // 5 — BALANCE: centre of mass should sit near the part's own axis.
  let M = 0;
  const com = [0, 0, 0];
  for (const p of prims) {
    const v = vol(box(p));
    M += v;
    com[0]! += v * p.pos[0];
    com[1]! += v * p.pos[1];
    com[2]! += v * p.pos[2];
  }
  com[0]! /= M;
  com[1]! /= M;
  com[2]! /= M;
  const s = span(prims.map(box));
  const relX = Math.abs(com[0]! - 0) / (s.w / 2 || 1);
  const relZ = Math.abs(com[2]! - s.cz) / (s.d / 2 || 1);
  if (relX > 0.12) {
    pen.balanceX = clamp((relX - 0.12) * 1.4, 0, 0.3);
    notes.push(`COM ${(relX * 100).toFixed(0)}% off the part axis`);
  }
  if (relZ > 0.4) {
    pen.balanceZ = clamp((relZ - 0.4) * 0.6, 0, 0.22);
    notes.push(`COM front/back heavy`);
  }

  // 6 — SYMMETRY: off-axis prims should be paired.
  if (m.symmetryError > 0.12) {
    pen.symmetry = clamp((m.symmetryError - 0.12) * 0.9, 0, 0.35);
    notes.push(`${Math.round(m.symmetryError * 100)}% unpaired off-axis prims`);
  }

  // 7 — SILHOUETTE coherence: not a cloud of fragments.
  if (m.compactness < 0.13) {
    pen.fragmented = clamp((0.13 - m.compactness) * 2.2, 0, 0.3);
    notes.push(`fragmented silhouette (compactness ${m.compactness.toFixed(2)})`);
  }

  // 8 — BAND INTENT: the measured axes must match what the brief asked for.
  const gotStraight = m.silhouetteStraightness >= 0.5;
  const gotSharp = m.edgeSharpness >= 0.5;
  if ((brief.silhouette === "S") !== gotStraight) {
    pen.bandSilhouette = 0.3;
    notes.push(`brief wants ${brief.silhouette} silhouette, measured ${gotStraight ? "S" : "R"}`);
  }
  if ((brief.edge === "S") !== gotSharp) {
    pen.bandEdge = 0.25;
    notes.push(`brief wants ${brief.edge} edge, measured ${gotSharp ? "S" : "R"}`);
  }

  // 9 — REDUNDANT masses: two of COMPARABLE size occupying the same space
  // (one just hidden inside the other). A small sub-plate embedded in a big
  // plate is layering, checked above — not redundancy.
  let redundant = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const vr = vol(boxes[i]!) / vol(boxes[j]!);
      if (vr > 0.45 && vr < 2.2 && overlapFrac(boxes[i]!, boxes[j]!) > 0.6) redundant++;
    }
  }
  if (redundant) {
    pen.redundant = clamp(redundant * 0.12, 0, 0.3);
    notes.push(`${redundant} near-coincident mass pair(s)`);
  }

  // ==========================================================================
  // SILHOUETTE — measured off the projected outline, not the primitive mix.
  // Everything above reasons about boxes; these rules look at the shape.
  // ==========================================================================
  // 10 — does the OUTLINE match the band the brief asked for? A cylinder has a
  // round section but a straight silhouette, so the old volume-ratio proxy let
  // "curved" kits read as slab-sided. This checks the contour itself.
  const wantAngular = brief.silhouette === "S";
  const angGap = wantAngular ? 0.6 - sil.contourAngularity : sil.contourAngularity - 0.64;
  if (angGap > 0) {
    pen.contourBand = clamp(angGap * 1.6, 0, 0.3);
    notes.push(
      `outline reads ${sil.contourAngularity > 0.62 ? "faceted" : "curved"} (${sil.contourAngularity.toFixed(
        2,
      )}) but the brief wants ${brief.silhouette}`,
    );
  }

  // 11 — does the shape survive at thumbnail size? A silhouette that dissolves
  // when small has no read.
  if (sil.readability < 0.82) {
    pen.readability = clamp((0.82 - sil.readability) * 1.1, 0, 0.28);
    notes.push(`silhouette weak at thumbnail size (${sil.readability.toFixed(2)})`);
  }

  // 12 — a ragged outline is noise, not detail
  if (sil.contourComplexity > 5.6) {
    pen.contourNoise = clamp((sil.contourComplexity - 5.6) * 0.09, 0, 0.26);
    notes.push(`ragged outline (complexity ${sil.contourComplexity.toFixed(1)})`);
  }

  // 13 — the width profile should flow, not step. A jumpy profile is the
  // signature of stacked slabs with no through-line.
  if (sil.profileJitter > 0.11) {
    pen.profileFlow = clamp((sil.profileJitter - 0.11) * 1.6, 0, 0.24);
    notes.push(`width profile steps rather than flows (${sil.profileJitter.toFixed(2)})`);
  }

  // 14 — geometry nobody can see from any angle is cost with no payoff.
  // Frame-tier prims are excluded: an internal structure is meant to be
  // internal, and `frameExposure` already governs how much of it shows.
  const visibleTiers = prims.filter((p) => p.tier !== "frame");
  const buried = visibleTiers.length > 2 ? hiddenShare(visibleTiers) : 0;
  if (buried > 0.12) {
    pen.buried = clamp((buried - 0.12) * 1.2, 0, 0.24);
    notes.push(`${Math.round(buried * 100)}% of prims are hidden from every view`);
  }

  const total = Object.values(pen).reduce((x, y) => x + y, 0);
  return { score: clamp(1 - total, 0, 1), penalties: pen, notes, silhouette: sil };
}
