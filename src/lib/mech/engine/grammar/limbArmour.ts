/**
 * Shared limb-armour builder — turns a TOPOLOGY + a band + a shell envelope
 * into a genuinely different arrangement of masses. Used by shin, thigh, and
 * (later) forearm / upperArm.
 *
 * Coordinates: the limb's own frame, +Y toward the proximal joint, +Z forward.
 */

import { lerp, clamp } from "../rng";
import type { Brief, Prim, PrimKind } from "../types";
import type { LimbTopology } from "./topology";

const HALF_PI = Math.PI / 2;

export interface ShellEnvelope {
  /** vertical centre of the armour span */
  cy: number;
  /** armour span height */
  h: number;
  /** top / bottom width */
  wTop: number;
  wBot: number;
  /** front-to-back depth */
  depth: number;
  /** forward lean (rad) */
  pitch: number;
}

export interface LimbArmourCtx {
  brief: Brief;
  env: ShellEnvelope;
  bevel: number;
  /** primary + secondary armour material roles */
  matA: Prim["role"];
  matB: Prim["role"];
}

export interface LimbArmourResult {
  prims: Prim[];
  /** z of the outermost armour surface (for seating detail) */
  frontZ: number;
  /** number of distinct armour masses produced */
  massCount: number;
}

/** The primary shell primitive for a band. */
function shellKind(brief: Brief): PrimKind {
  if (brief.silhouette === "S") return brief.edge === "S" ? "trapPrism" : "box";
  return brief.edge === "S" ? "cyl" : "capsule";
}

function shellPrim(
  kind: PrimKind,
  role: Prim["role"],
  w: number,
  wb: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  pitch: number,
  bevel: number,
  sides: number,
): Prim {
  const base = {
    role,
    pos: [x, y, z] as [number, number, number],
    rot: [pitch, 0, 0] as [number, number, number],
    tier: "mass" as const,
    zone: "armor" as const,
    bevel,
  };
  switch (kind) {
    case "trapPrism":
      return { kind, size: [w * 0.9, wb, h], depth: d, ...base };
    case "cyl":
      return { kind, size: [w * 0.5, wb * 0.5, h], sides, ...base };
    case "capsule":
      return { kind: "capsule", size: [w * 0.5, h * 0.66, 0], sides, ...base };
    default:
      return { kind: "box", size: [w, h, d], ...base };
  }
}

/** A fillet collar so a standoff plate never sprouts from a bare face. */
function root(x: number, y: number, z: number, r: number): Prim {
  return {
    kind: "cyl",
    role: "frame",
    size: [r, r * 1.1, r * 0.55],
    pos: [x, y, z],
    rot: [HALF_PI, 0, 0],
    sides: 10,
    tier: "frame",
    zone: "joint",
    bevel: 0.4,
  };
}

/** Dark inset panel-line grooves across the front, following the taper. */
function panelLines(env: ShellEnvelope, frontZ: number, n: number): Prim[] {
  const out: Prim[] = [];
  for (let i = 0; i < n; i++) {
    const f = (i + 1) / (n + 1);
    const y = env.cy + env.h * (0.5 - f);
    const w = lerp(env.wTop, env.wBot, f) * 0.7;
    out.push({
      kind: "box",
      role: "mechanism",
      size: [w, Math.max(0.003, env.h * 0.016), env.depth * 0.05],
      pos: [0, y, frontZ - env.depth * 0.02],
      rot: [env.pitch, 0, 0],
      tier: "panel",
      zone: "armor",
      bevel: 0,
    });
  }
  return out;
}

export function buildLimbArmour(topology: LimbTopology, ctx: LimbArmourCtx): LimbArmourResult {
  const { brief, env, bevel, matA, matB } = ctx;
  const kind = shellKind(brief);
  const sides = brief.silhouette === "R" ? (brief.edge === "R" ? 20 : 14) : 8;
  const out: Prim[] = [];
  const deco = brief.decoration;
  let frontZ = env.depth * 0.5;
  let massCount = 1;

  if (topology === "shell") {
    out.push(shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth, 0, env.cy, env.depth * 0.06, env.pitch, bevel, sides));
    out.push(...panelLines(env, frontZ, Math.round(clamp(deco * 2.2, 0, 2))));
  } else if (topology === "tiered") {
    // recessed base + 1–2 forward plates, each clearly smaller
    const baseD = env.depth * 0.7;
    out.push(shellPrim(kind, matA, env.wTop, env.wBot, env.h, baseD, 0, env.cy, 0, env.pitch, bevel, sides));
    const tiers = deco > 0.62 ? 2 : 1;
    let z = baseD * 0.5;
    let w = env.wTop;
    let hh = env.h;
    for (let i = 0; i < tiers; i++) {
      w *= 0.66;
      hh *= 0.7;
      const td = env.depth * (0.34 - i * 0.1);
      z += td * 0.7;
      out.push(shellPrim(kind === "capsule" ? "box" : kind, i === 0 ? matB : "accent", w, w * 0.85, hh, td, 0, env.cy + env.h * 0.04 * i, z - td * 0.35, env.pitch, bevel, sides));
      massCount++;
    }
    frontZ = z + env.depth * 0.02;
    out.push(...panelLines(env, env.depth * 0.5, Math.round(clamp(deco * 3, 1, 3))));
  } else if (topology === "split") {
    // narrower front shell + two standoff side wings
    const fw = env.wTop * 0.68;
    out.push(shellPrim(kind, matA, fw, fw * 0.82, env.h, env.depth, 0, env.cy, env.depth * 0.06, env.pitch, bevel, sides));
    const wingX = env.wTop * 0.42;
    const wingKind: PrimKind = brief.silhouette === "S" ? (brief.edge === "S" ? "wedge" : "box") : "cyl";
    for (const s of [-1, 1]) {
      out.push(root(s * wingX * 0.7, env.cy, env.depth * 0.18, env.wTop * 0.09));
      out.push({
        kind: wingKind,
        role: matB,
        size: wingKind === "cyl" ? [env.wTop * 0.16, env.wTop * 0.14, env.h * 0.7] : [env.wTop * 0.34, env.h * 0.72, env.depth * 0.55],
        pos: [s * wingX, env.cy, env.depth * 0.05],
        rot: [env.pitch, 0, s * 0.22],
        sides,
        tier: "mass",
        zone: "armor",
        bevel,
      });
      massCount++;
    }
    out.push(...panelLines(env, env.depth * 0.5, Math.round(clamp(deco * 2, 0, 2))));
  } else if (topology === "clamshell") {
    // front half + rear half + a longitudinal seam strip down each side
    out.push(shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth * 0.56, 0, env.cy, env.depth * 0.16, env.pitch, bevel, sides));
    out.push(shellPrim(kind === "capsule" ? "cyl" : kind, matA, env.wTop * 0.92, env.wBot * 0.9, env.h * 0.94, env.depth * 0.44, 0, env.cy, -env.depth * 0.2, env.pitch, bevel, sides));
    massCount = 2;
    for (const s of [-1, 1]) {
      out.push({
        kind: "box",
        role: "mechanism",
        size: [Math.max(0.004, env.wTop * 0.03), env.h * 0.9, env.depth * 0.7],
        pos: [s * env.wTop * 0.44, env.cy, 0],
        rot: [env.pitch, 0, 0],
        tier: "panel",
        zone: "armor",
        bevel: 0,
      });
    }
    out.push(...panelLines(env, env.depth * 0.5 + env.depth * 0.08, Math.round(clamp(deco * 2, 0, 2))));
  } else if (topology === "spine") {
    // slim shell + a bold central keel ridge
    out.push(shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth * 0.82, 0, env.cy, 0, env.pitch, bevel, sides));
    const ridgeKind: PrimKind = brief.edge === "S" ? "wedge" : brief.silhouette === "R" ? "cyl" : "box";
    const rd = env.depth * 0.5;
    out.push({
      kind: ridgeKind,
      role: matB,
      size: ridgeKind === "cyl" ? [env.wTop * 0.13, env.wTop * 0.11, env.h * 0.94] : [env.wTop * 0.2, env.h * 0.96, rd],
      pos: [0, env.cy, env.depth * 0.4],
      rot: [env.pitch, 0, 0],
      sides,
      tier: "mass",
      zone: "armor",
      bevel: brief.edge === "S" ? 0.05 : bevel,
    });
    massCount = 2;
    frontZ = env.depth * 0.4 + rd * 0.5;
    for (const s of [-1, 1]) {
      out.push({
        kind: "box",
        role: "mechanism",
        size: [Math.max(0.004, env.wTop * 0.025), env.h * 0.8, env.depth * 0.06],
        pos: [s * env.wTop * 0.16, env.cy, env.depth * 0.5 - 0.004],
        rot: [env.pitch, 0, 0],
        tier: "panel",
        zone: "armor",
        bevel: 0,
      });
    }
  } else {
    // segmented — 2–3 stacked bands with dark connectors between
    const n = deco > 0.55 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const y = env.cy + env.h * (0.5 - (i + 0.5) / n);
      const w = lerp(env.wTop, env.wBot, (i + 0.5) / n);
      out.push(shellPrim(kind === "capsule" ? "cyl" : kind, i % 2 ? matB : matA, w, w * 0.9, (env.h / n) * 0.8, env.depth, 0, y, env.depth * 0.06, env.pitch, bevel, sides));
      massCount = n;
      if (i < n - 1) {
        out.push({
          kind: "box",
          role: "mechanism",
          size: [w * 0.5, env.h / n / 4, env.depth * 0.5],
          pos: [0, y - env.h / n / 2, 0],
          rot: [env.pitch, 0, 0],
          tier: "frame",
          zone: "frame",
          bevel: 0,
        });
      }
    }
  }

  return { prims: out, frontZ, massCount };
}

export { HALF_PI };
