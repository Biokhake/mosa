/**
 * =========================================================================
 * REPAIR OPERATORS
 * =========================================================================
 *
 * The critic used to be a pure filter: `refine` rolled N random candidates and
 * kept whichever scored best. That wastes the most useful thing the critic
 * produces — it does not just say "this is worse", it says WHICH RULE broke.
 *
 * These operators consume that diagnosis and fix the specific fault, so a
 * candidate can be improved rather than re-rolled. Each one is conservative:
 * it only ever removes or adjusts geometry it can justify, and the caller
 * re-critiques afterwards and keeps the result only if it actually helped.
 */

import type { Brief, Prim } from "./types";
import { visiblePrims } from "./raster";

const HALF_PI = Math.PI / 2;

interface Box {
  cx: number; cy: number; cz: number;
  w: number; h: number; d: number;
}

function box(p: Prim): Box {
  const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
  let w = a, h = b, d = c;
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
    case "capsule": [w, h, d] = [2 * a, b + 2 * a, 2 * a]; break;
    case "sphere":
    case "hemi":
    case "octa": [w, h, d] = [2 * a, 2 * a, 2 * a]; break;
    case "trapPrism": [w, h, d] = [Math.max(a, b), c, p.depth ?? 0.04]; break;
    default: break;
  }
  return { cx: p.pos[0], cy: p.pos[1], cz: p.pos[2], w, h, d };
}

const vol = (b: Box) => Math.max(1e-7, b.w * b.h * b.d);

function overlapFrac(a: Box, b: Box): number {
  const ox = Math.max(0, Math.min(a.cx + a.w / 2, b.cx + b.w / 2) - Math.max(a.cx - a.w / 2, b.cx - b.w / 2));
  const oy = Math.max(0, Math.min(a.cy + a.h / 2, b.cy + b.h / 2) - Math.max(a.cy - a.h / 2, b.cy - b.h / 2));
  const oz = Math.max(0, Math.min(a.cz + a.d / 2, b.cz + b.d / 2) - Math.max(a.cz - a.d / 2, b.cz - b.d / 2));
  return (ox * oy * oz) / Math.min(vol(a), vol(b));
}

/**
 * Drop decorative / armour geometry that no view can see. Frame-tier prims are
 * kept: an internal structure is meant to be internal. Grouped prims are kept
 * or dropped together, because a profile stack is one mass.
 */
export function dropBuried(prims: Prim[]): Prim[] {
  const candidates = prims.filter((p) => p.tier !== "frame");
  if (candidates.length < 3) return prims;
  const vis = visiblePrims(candidates);

  // a group survives if ANY of its members is visible
  const groupSeen = new Set<string>();
  candidates.forEach((p, i) => {
    if (p.group && vis[i]) groupSeen.add(p.group);
  });

  const keep = new Set<Prim>();
  candidates.forEach((p, i) => {
    if (vis[i] || (p.group && groupSeen.has(p.group))) keep.add(p);
  });
  return prims.filter((p) => p.tier === "frame" || keep.has(p));
}

/**
 * Where two masses of comparable size sit inside one another, one of them is
 * doing no work. Drop the smaller.
 */
export function dropRedundant(prims: Prim[]): Prim[] {
  const idx = prims.map((p, i) => ({ p, i, b: box(p) })).filter((x) => x.p.tier === "mass");
  const kill = new Set<number>();
  for (let i = 0; i < idx.length; i++) {
    for (let j = i + 1; j < idx.length; j++) {
      const A = idx[i]!, B = idx[j]!;
      if (kill.has(A.i) || kill.has(B.i)) continue;
      if (A.p.group && A.p.group === B.p.group) continue; // one logical mass
      const vr = vol(A.b) / vol(B.b);
      if (vr > 0.45 && vr < 2.2 && overlapFrac(A.b, B.b) > 0.6) {
        kill.add(vol(A.b) <= vol(B.b) ? A.i : B.i);
      }
    }
  }
  return kill.size ? prims.filter((_, i) => !kill.has(i)) : prims;
}

/**
 * Every joint-zone protrusion should meet its parent through a fillet. Where
 * one is missing, add the collar rather than deleting the protrusion — the
 * design intent was fine, the connection detail was not.
 */
export function rootProtrusions(prims: Prim[]): Prim[] {
  const collars = prims.filter((p) => p.role === "frame" && p.tier === "frame").map(box);
  const added: Prim[] = [];
  for (const p of prims) {
    if (p.tier !== "mass" && p.tier !== "detail") continue;
    if (p.zone !== "joint") continue;
    const b = box(p);
    const reach = Math.max(b.w, b.h, b.d) * 0.95;
    const rooted = collars.some((f) => Math.hypot(f.cx - b.cx, f.cy - b.cy, f.cz - b.cz) < reach);
    if (rooted) continue;
    const r = Math.max(0.006, Math.min(b.w, b.h) * 0.34);
    const collar: Prim = {
      kind: "cyl",
      role: "frame",
      size: [r, r * 1.12, r * 0.6],
      // seat it just behind the protrusion, toward the parent surface
      pos: [b.cx, b.cy - b.h * 0.32, b.cz - b.d * 0.3],
      rot: [HALF_PI, 0, 0],
      sides: 10,
      tier: "frame",
      zone: "joint",
      bevel: 0.4,
    };
    added.push(collar);
    collars.push(box(collar));
  }
  return added.length ? [...prims, ...added] : prims;
}

/**
 * Detail is only ever allowed off the armour face. Anything that landed on
 * armour is re-tagged to the vent zone if it is plausibly a vent (dark
 * mechanism), and dropped otherwise — a bolt head floating on a clean panel is
 * noise, not detail.
 */
export function clearDetailFromArmour(prims: Prim[]): Prim[] {
  const out: Prim[] = [];
  for (const p of prims) {
    if (p.tier !== "detail" || p.zone !== "armor") {
      out.push(p);
      continue;
    }
    if (p.role === "mechanism") out.push({ ...p, zone: "vent" });
    // else: dropped
  }
  return out;
}

export interface RepairResult {
  prims: Prim[];
  applied: string[];
}

/**
 * Run the operators the diagnosis calls for. `penalties` comes straight from
 * the critic, so nothing runs speculatively.
 */
export function repair(prims: Prim[], penalties: Record<string, number>, brief: Brief): RepairResult {
  void brief;
  let out = prims;
  const applied: string[] = [];

  if (penalties.buried) {
    const next = dropBuried(out);
    if (next.length < out.length) {
      applied.push(`dropped ${out.length - next.length} buried prim(s)`);
      out = next;
    }
  }
  if (penalties.redundant) {
    const next = dropRedundant(out);
    if (next.length < out.length) {
      applied.push(`dropped ${out.length - next.length} redundant mass(es)`);
      out = next;
    }
  }
  if (penalties.detailZone) {
    const next = clearDetailFromArmour(out);
    if (next !== out) {
      applied.push("cleared detail off the armour face");
      out = next;
    }
  }
  if (penalties.rooting) {
    const next = rootProtrusions(out);
    if (next.length > out.length) {
      applied.push(`rooted ${next.length - out.length} protrusion(s)`);
      out = next;
    }
  }

  return { prims: out, applied };
}
