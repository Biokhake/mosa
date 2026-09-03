/**
 * THIGH form grammar — the shin's proximal partner.
 *
 * Same tiers, same TOPOLOGY as the shin (a leg reads as one design), but the
 * load case is different: the thigh carries the whole leg plus the robot's
 * weight through the hip, so its frame is heavier and its actuator set is
 * hip-drum + knee-drum + flexor rather than knee + ankle.
 */

import { makeRng, lerp } from "../rng";
import type { Brief, Proportions, Prim } from "../types";
import type { ThighRig } from "../skeleton";
import { pickLimbTopology } from "./topology";
import type { LimbTopology } from "./topology";
import { buildLimbArmour } from "./limbArmour";

const HALF_PI = Math.PI / 2;

interface Ctx {
  brief: Brief;
  prop: Proportions;
  rig: ThighRig;
  rng: ReturnType<typeof makeRng>;
  topology: LimbTopology;
  out: Prim[];
}

function frameLayer(ctx: Ctx) {
  const { rig, out, brief, prop } = ctx;
  const { rails, actuator } = rig.load;
  const bevel = prop.bevel;

  // structural rails — load-driven count / section (recon: one spar; bruiser: two + brace)
  const railR = rails.section;
  const railGap = rig.girth * 0.24;
  const xs = rails.count === 1 ? [0] : [-1, 1];
  for (const sx of xs) {
    out.push({
      kind: "cyl",
      role: "mechanism",
      size: [railR, railR, rig.length * 0.94],
      pos: [sx * railGap, 0, -rig.girth * 0.16],
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }
  if (rails.braced) {
    out.push({
      kind: "cyl",
      role: "metal",
      size: [railR * 0.6, railR * 0.6, rig.length * 0.66],
      pos: [0, 0, -rig.girth * 0.15],
      rot: [-0.3, 0, 0],
      sides: 8,
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }

  // hip rotary drum — radius from the hip torque
  const hd = actuator.hip;
  out.push({
    kind: "cyl",
    role: "frame",
    size: [hd.drumRadius, hd.drumRadius, hd.drumWidth],
    pos: [0, rig.hipY - hd.drumRadius * 0.3, -rig.girth * 0.04],
    rot: [0, 0, HALF_PI],
    sides: 16,
    tier: "frame",
    zone: "joint",
    bevel,
  });
  // knee rotary drum — upper half shows on the thigh
  const kd = actuator.knee;
  out.push({
    kind: "cyl",
    role: "frame",
    size: [kd.drumRadius, kd.drumRadius, kd.drumWidth],
    pos: [0, rig.kneeY + kd.drumRadius * 0.4, -rig.girth * 0.05],
    rot: [0, 0, HALF_PI],
    sides: 16,
    tier: "frame",
    zone: "joint",
    bevel,
  });

  // hip flexor — reuses the knee flexor spec; twin if the force is high
  const fx = actuator.flexor;
  const twinDx = fx.drive === "twin-linear" ? fx.bore * 1.5 : 0;
  for (const sx of fx.drive === "twin-linear" ? [-1, 1] : [0]) {
    out.push({
      kind: "cyl",
      role: "mechanism",
      size: [fx.bore, fx.bore * 0.8, fx.stroke * (0.7 + brief.frameExposure * 0.3)],
      pos: [sx * twinDx, rig.length * 0.06, rig.girth * 0.2],
      sides: 12,
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }
}

interface Shell {
  topY: number;
  botY: number;
  h: number;
  cy: number;
  wTop: number;
  wBot: number;
  depth: number;
  frontZ: number;
}

function thighShell(ctx: Ctx): Shell {
  const { rig, brief, prop, out, topology } = ctx;

  const topY = rig.hipY - rig.girth * 0.1;
  const botY = rig.kneeY + rig.kneeClearance;
  const h = topY - botY;
  const cy = (topY + botY) / 2;

  const bulk = 0.82 + (rig.load.armourAllowance - 0.4) * 0.34;
  // the thigh is the WIDER leg segment — it does not taper toward the hip
  const wTop = rig.girth * bulk * lerp(1.02, 1.16, brief.taper * 0.4);
  const wBot = rig.girth * bulk * lerp(0.98, 0.78, brief.taper);
  const depth = rig.girth * bulk * lerp(0.92, 1.08, 0.5);

  const res = buildLimbArmour(topology, {
    brief,
    env: { cy, h, wTop, wBot, depth, pitch: 0.05 },
    bevel: prop.bevel,
    matA: "armorA",
    matB: "armorB",
  });
  out.push(...res.prims);

  return { topY, botY, h, cy, wTop, wBot, depth, frontZ: res.frontZ };
}

function root(ctx: Ctx, x: number, y: number, z: number, r: number) {
  ctx.out.push({
    kind: "cyl",
    role: "frame",
    size: [r, r * 1.15, r * 0.6],
    pos: [x, y, z],
    rot: [HALF_PI, 0, 0],
    sides: 12,
    tier: "frame",
    zone: "joint",
    bevel: 0.4,
  });
}

/** Hip cap — a band-shaped plate over the top of the thigh (mirrors the shin's knee guard). */
function hipCap(ctx: Ctx, s: Shell) {
  const { brief, rig, out } = ctx;
  const gy = s.topY - s.h * 0.02;
  const gz = s.frontZ - rig.girth * 0.04;
  const w = s.wTop * 0.78;
  const hh = s.h * 0.2;

  root(ctx, 0, gy - hh * 0.4, s.depth * 0.3, rig.girth * 0.16);

  if (brief.silhouette === "S" && brief.edge === "S") {
    out.push({ kind: "wedge", role: "armorB", size: [w, hh, rig.girth * 0.46], pos: [0, gy, gz], rot: [-0.1, 0, 0], tier: "mass", zone: "joint", bevel: 0.05 });
  } else if (brief.silhouette === "S") {
    out.push({ kind: "box", role: "armorB", size: [w, hh, rig.girth * 0.4], pos: [0, gy, gz], rot: [-0.08, 0, 0], tier: "mass", zone: "joint", bevel: 0.5 });
  } else if (brief.edge === "S") {
    out.push({ kind: "cyl", role: "armorB", size: [w * 0.5, w * 0.5, rig.girth * 0.42], pos: [0, gy, gz], rot: [HALF_PI + 0.08, 0, 0], sides: 14, tier: "mass", zone: "joint", bevel: 0.3 });
  } else {
    out.push({ kind: "hemi", role: "armorB", size: [w * 0.5, 0, 0], pos: [0, gy - hh * 0.2, gz], rot: [-0.2, 0, 0], tier: "mass", zone: "joint", bevel: 1 });
  }
}

/** Detail budget — leaner than the shin (the thigh is largely a plain mass). */
function details(ctx: Ctx, s: Shell) {
  const { brief, prop, rig, out } = ctx;
  let budget = Math.round(1 + brief.decoration * 4); // 1..5
  const [L, M, S] = prop.detailSizes;

  // L — a hip vent / intake on the outer face (vent zone), if decorated
  if (budget >= 3 && brief.decoration > 0.4) {
    budget -= 3;
    out.push({
      kind: brief.edge === "S" ? "box" : "cyl",
      role: "mechanism",
      size: brief.edge === "S" ? [rig.girth * 0.3, L * 0.9, rig.girth * 0.14] : [L * 0.5, L * 0.5, rig.girth * 0.16],
      pos: [rig.girth * 0.5, s.cy + s.h * 0.2, -s.depth * 0.28],
      rot: [0.1, 0, 0.2],
      sides: 12,
      tier: "detail",
      zone: "vent",
      bevel: 0,
    });
  }

  // M — a knee-brace tab at the bottom (joint zone)
  if (budget >= 2) {
    budget -= 2;
    out.push({
      kind: "box",
      role: "accent",
      size: [s.wBot * 0.5, M, M * 0.7],
      pos: [0, s.botY + M * 0.4, s.frontZ - s.depth * 0.04],
      rot: [0.05, 0, 0],
      tier: "detail",
      zone: "joint",
      bevel: prop.bevel,
    });
  }

  // S — bolt heads along the hip cap
  const bolts = Math.min(budget, brief.decoration > 0.55 ? 3 : 2);
  for (let i = 0; i < bolts; i++) {
    const a = (i / Math.max(1, bolts - 1) - 0.5) * s.wTop * 0.5;
    out.push({
      kind: "cyl",
      role: "metal",
      size: [S * 0.5, S * 0.5, S * 0.5],
      pos: [a, s.topY - s.h * 0.05, s.frontZ + S * 0.1],
      rot: [0.05, 0, 0],
      sides: 6,
      tier: "detail",
      zone: "joint",
      bevel: 0,
    });
  }
}

export function grammarThigh(brief: Brief, prop: Proportions, rig: ThighRig): Prim[] {
  const topology = pickLimbTopology(brief, makeRng(`leg:${brief.seed}`));
  const ctx: Ctx = { brief, prop, rig, rng: makeRng(`thigh:${brief.seed}`), topology, out: [] };
  frameLayer(ctx);
  const s = thighShell(ctx);
  hipCap(ctx, s);
  details(ctx, s);
  return ctx.out;
}
