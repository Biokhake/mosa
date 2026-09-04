/**
 * Shared limb-armour builder — turns a TOPOLOGY + a band + a shell envelope
 * into a genuinely different arrangement of masses. Used by shin, thigh, and
 * (later) forearm / upperArm.
 *
 * Coordinates: the limb's own frame, +Y toward the proximal joint, +Z forward.
 */

import { lerp, clamp, hash32 } from "../rng";
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

/**
 * A round cross-section is NOT a round silhouette: a cylinder projects to a
 * rectangle, so an "R" kit built from cylinders still reads as straight-sided
 * from every angle. Curved bands therefore get a stacked shell whose radius
 * follows a profile curve, which is what actually bends the outline.
 */
export type ShellProfile = "straight" | "barrel" | "ogive" | "waisted";

/** Radius multiplier at normalised height t (0 = bottom, 1 = top). */
function profileAt(profile: ShellProfile, t: number): number {
  switch (profile) {
    case "barrel":
      return 1 + 0.3 * Math.sin(Math.PI * t); // fullest at mid-height
    case "ogive":
      return 0.72 + 0.3 * Math.sqrt(Math.max(0, t)); // accelerating taper
    case "waisted":
      return 1 - 0.24 * Math.sin(Math.PI * t); // pinched waist
    default:
      return 1;
  }
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
  profile: ShellProfile = "straight",
): Prim[] {
  const base = {
    role,
    rot: [pitch, 0, 0] as [number, number, number],
    tier: "mass" as const,
    zone: "armor" as const,
    bevel,
  };
  const at = (t: number) => wb + (w - wb) * t;

  if (kind === "trapPrism") {
    return [{ kind, size: [w * 0.9, wb, h], depth: d, pos: [x, y, z], ...base }];
  }
  if (kind === "box") {
    return [{ kind: "box", size: [w, h, d], pos: [x, y, z], ...base }];
  }

  // round kinds: bend the outline with a stacked profile
  if (profile === "straight") {
    if (kind === "capsule") {
      return [{ kind: "capsule", size: [w * 0.5, h * 0.66, 0], pos: [x, y, z], sides, ...base }];
    }
    return [{ kind: "cyl", size: [w * 0.5, wb * 0.5, h], pos: [x, y, z], sides, ...base }];
  }

  const segs = 4;
  const out: Prim[] = [];
  // one logical mass expressed as a profile stack
  const gid = `shell:${role}:${Math.round(y * 1e4)}:${Math.round(h * 1e4)}`;
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const rBot = at(t0) * profileAt(profile, t0) * 0.5;
    const rTop = at(t1) * profileAt(profile, t1) * 0.5;
    const segH = (h / segs) * 1.04; // slight overlap so the joins do not gap
    const cy = y + (-h / 2 + (h * (t0 + t1)) / 2);
    out.push({
      kind: "cyl",
      size: [rTop, rBot, segH],
      pos: [x, cy, z],
      sides,
      group: gid,
      ...base,
    });
  }
  if (kind === "capsule") {
    // cap the stack so it still reads as a soft-ended mass
    out.push({
      kind: "hemi",
      size: [at(1) * profileAt(profile, 1) * 0.5, 0, 0],
      pos: [x, y + h / 2, z],
      group: gid,
      ...base,
      bevel: 1,
    });
  }
  return out;
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

/**
 * Where the panel lines sit along the span. Evenly dividing the height —
 * `(i+1)/(n+1)` — is the visual signature of generated work: real panelling is
 * grouped, a tight pair against a lone line. These are hand-set rhythms.
 */
const RHYTHMS: Record<number, number[][]> = {
  1: [[0.36], [0.62], [0.28]],
  2: [
    [0.3, 0.4],
    [0.26, 0.64],
    [0.55, 0.66],
  ],
  3: [
    [0.24, 0.33, 0.68],
    [0.22, 0.58, 0.68],
    [0.3, 0.4, 0.72],
  ],
};

/** Dark inset panel-line grooves across the front, following the taper. */
function panelLines(env: ShellEnvelope, frontZ: number, n: number, variant = 0): Prim[] {
  const out: Prim[] = [];
  if (n <= 0) return out;
  const bank = RHYTHMS[Math.min(3, n)] ?? [[0.36]];
  const stops = bank[variant % bank.length]!;
  for (let i = 0; i < stops.length; i++) {
    const f = stops[i]!;
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
  // Curved bands bend the OUTLINE, not just the cross-section. S bands stay
  // straight-sided — that is the whole point of the band.
  const profile: ShellProfile =
    brief.silhouette === "S"
      ? "straight"
      : brief.taper > 0.55
        ? "ogive"
        : brief.decoration > 0.55
          ? "waisted"
          : "barrel";
  const out: Prim[] = [];
  const deco = brief.decoration;
  // which hand-set panel rhythm this kit uses
  const rhythm = hash32(brief.seed) % 3;
  let frontZ = env.depth * 0.5;
  let massCount = 1;

  if (topology === "shell") {
    out.push(...shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth, 0, env.cy, env.depth * 0.06, env.pitch, bevel, sides, profile));
    out.push(...panelLines(env, frontZ, Math.round(clamp(deco * 2.2, 0, 2)), rhythm));
  } else if (topology === "tiered") {
    // recessed base + 1–2 forward plates, each clearly smaller
    const baseD = env.depth * 0.7;
    out.push(...shellPrim(kind, matA, env.wTop, env.wBot, env.h, baseD, 0, env.cy, 0, env.pitch, bevel, sides, profile));
    const tiers = deco > 0.62 ? 2 : 1;
    let z = baseD * 0.5;
    let w = env.wTop;
    let hh = env.h;
    for (let i = 0; i < tiers; i++) {
      w *= 0.66;
      hh *= 0.7;
      const td = env.depth * (0.34 - i * 0.1);
      z += td * 0.7;
      out.push(...shellPrim(kind === "capsule" ? "box" : kind, i === 0 ? matB : "accent", w, w * 0.85, hh, td, 0, env.cy + env.h * 0.04 * i, z - td * 0.35, env.pitch, bevel, sides));
      massCount++;
    }
    frontZ = z + env.depth * 0.02;
    out.push(...panelLines(env, env.depth * 0.5, Math.round(clamp(deco * 3, 1, 3)), rhythm));
  } else if (topology === "split") {
    // narrower front shell + two standoff side wings
    const fw = env.wTop * 0.68;
    out.push(...shellPrim(kind, matA, fw, fw * 0.82, env.h, env.depth, 0, env.cy, env.depth * 0.06, env.pitch, bevel, sides, profile));
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
    out.push(...panelLines(env, env.depth * 0.5, Math.round(clamp(deco * 2, 0, 2)), rhythm));
  } else if (topology === "clamshell") {
    // front half + rear half + a longitudinal seam strip down each side
    out.push(...shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth * 0.56, 0, env.cy, env.depth * 0.16, env.pitch, bevel, sides, profile));
    out.push(...shellPrim(kind === "capsule" ? "cyl" : kind, matA, env.wTop * 0.92, env.wBot * 0.9, env.h * 0.94, env.depth * 0.44, 0, env.cy, -env.depth * 0.2, env.pitch, bevel, sides));
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
    out.push(...panelLines(env, env.depth * 0.5 + env.depth * 0.08, Math.round(clamp(deco * 2, 0, 2)), rhythm));
  } else if (topology === "spine") {
    // Slim shell + a central keel ridge.
    //
    // A keel is a ridge ROLLED OUT OF the shell, not a bar bolted onto it.
    // Three things decide whether it reads that way:
    //   - it is wide enough to be a facet. A narrow, deep section is a rod,
    //     and a rod down the shin reads as a stray part, not as styling.
    //   - it stands only slightly proud. Depth is what makes it look bolted on.
    //   - it FAIRS IN at both ends. A constant section running the full span
    //     turns the shin into a strut with a stick taped to it.
    // It also stops short of both joints, so it can never foul the knee guard
    // above or the ankle drum below.
    out.push(...shellPrim(kind, matA, env.wTop, env.wBot, env.h, env.depth * 0.82, 0, env.cy, 0, env.pitch, bevel, sides, profile));

    const ridgeKind: PrimKind = brief.edge === "S" ? "wedge" : brief.silhouette === "R" ? "cyl" : "box";
    const round = ridgeKind === "cyl";
    const shellFrontZ = env.depth * 0.41; // front face of the slim shell
    const rTop = env.cy + env.h * 0.32; // clear of the knee guard
    const rBot = env.cy - env.h * 0.3; // dies out well above the ankle
    const rH = rTop - rBot;
    const rW = env.wTop * (round ? 0.3 : 0.4); // a facet, not a rod
    const proud = env.depth * (brief.edge === "S" ? 0.13 : 0.1);
    // seat the ridge ON the shell face — a deep buried tail is volume nobody
    // ever sees, and it drags the whole run back inside the shell
    const zBack = shellFrontZ - env.depth * 0.06;

    // Stops down the keel: [distance from top, width scale, protrusion scale].
    // A quick rise, a long constant run, a slower die-out into the shell.
    const STOPS: Array<[number, number, number]> = [
      [0, 0.44, 0.3],
      [0.22, 1, 1],
      [0.68, 0.94, 0.9],
      [1, 0.36, 0.22],
    ];
    // one logical mass, so the layering rule does not read it as a plate stack
    const gid = `keel:${Math.round(env.cy * 1e4)}`;
    for (let i = 0; i < STOPS.length - 1; i++) {
      const [t0, w0, p0] = STOPS[i]!;
      const [t1, w1, p1] = STOPS[i + 1]!;
      const yTop = rTop - rH * t0;
      const yBot = rTop - rH * t1;
      const bh = yTop - yBot;
      const front = shellFrontZ + proud * ((p0 + p1) / 2);
      const bd = front - zBack;
      // a cyl band tapers for free between the two stops; the flat kinds step,
      // which is what actually shows the fairing. NB a cyl's front face is one
      // RADIUS ahead of its centre, not half its `size[2]` — that is length.
      const cylR = rW * Math.max(w0, w1) * 0.5;
      out.push({
        kind: ridgeKind,
        role: matB,
        size: round ? [rW * w1 * 0.5, rW * w0 * 0.5, bh] : [rW * ((w0 + w1) / 2), bh, bd],
        pos: [0, (yTop + yBot) / 2, round ? front - cylR : zBack + bd * 0.5],
        rot: [env.pitch, 0, 0],
        sides,
        tier: "mass",
        zone: "armor",
        bevel: brief.edge === "S" ? 0.05 : bevel,
        group: gid,
      });
    }
    massCount = 2;
    frontZ = shellFrontZ + proud;
    // shoulder grooves flanking the keel — outboard of the wider ridge, only
    // as long as the keel itself, and straddling the shell face so the dark
    // side of the groove actually shows (fully recessed, it is invisible)
    for (const s of [-1, 1]) {
      out.push({
        kind: "box",
        role: "mechanism",
        size: [Math.max(0.004, env.wTop * 0.025), rH * 0.86, env.depth * 0.06],
        pos: [s * (rW * 0.5 + env.wTop * 0.07), env.cy + env.h * 0.01, shellFrontZ],
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
      out.push(...shellPrim(kind === "capsule" ? "cyl" : kind, i % 2 ? matB : matA, w, w * 0.9, (env.h / n) * 0.8, env.depth, 0, y, env.depth * 0.06, env.pitch, bevel, sides, profile));
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
