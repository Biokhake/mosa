/**
 * SHIN form grammar.
 *
 * Built in strict tiers — nothing in a lower tier is added until the higher
 * one is placed:
 *   1. FRAME     dual rails + knee/ankle drums + front flexor   (exposed per brief)
 *   2. MASS      one band-shaped greave + a knee guard + optional calf pod
 *   3. PANEL     dark inset cut-lines on the greave, following its taper
 *   4. DETAIL    only in JOINT / VENT zones, spent from a fixed budget,
 *                in exactly three sizes (L / M / S)
 * Every protrusion is rooted to its parent with a fillet collar.
 */

import { makeRng, lerp } from "../rng";
import type { Brief, Proportions, Prim } from "../types";
import type { ShinRig } from "../skeleton";
import { pickLimbTopology } from "./topology";
import type { LimbTopology } from "./topology";
import { buildLimbArmour } from "./limbArmour";

export interface ShinOpts {
  /** override the philosophy-derived topology (the critic picks per leg) */
  topology?: LimbTopology;
  /** generate-and-select salt — perturbs detail placement, not structure */
  variant?: number;
}

const HALF_PI = Math.PI / 2;

interface Ctx {
  brief: Brief;
  prop: Proportions;
  rig: ShinRig;
  rng: ReturnType<typeof makeRng>;
  topology: LimbTopology;
  out: Prim[];
}

function frameLayer(ctx: Ctx) {
  const { rig, out, brief, prop } = ctx;
  const { rails, actuator } = rig.load;
  const bevel = prop.bevel;

  // structural rails — count + section are LOAD-DRIVEN (recon: one slim spar;
  // bruiser: two fat rails + a diagonal brace).
  const railR = rails.section;
  const railGap = rig.girth * 0.26;
  const xs = rails.count === 1 ? [0] : [-1, 1];
  for (const sx of xs) {
    out.push({
      kind: "cyl",
      role: "mechanism",
      size: [railR, railR, rig.length * 0.96],
      pos: [sx * railGap, 0, -rig.girth * 0.18],
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }
  if (rails.braced) {
    out.push({
      kind: "cyl",
      role: "metal",
      size: [railR * 0.6, railR * 0.6, rig.length * 0.7],
      pos: [0, 0, -rig.girth * 0.16],
      rot: [0.32, 0, 0],
      sides: 8,
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }

  // knee rotary drum — radius from the knee torque
  const kd = actuator.knee;
  out.push({
    kind: "cyl",
    role: "frame",
    size: [kd.drumRadius, kd.drumRadius, kd.drumWidth],
    pos: [0, rig.kneeY - kd.drumRadius * 0.3, -rig.girth * 0.05],
    rot: [0, 0, HALF_PI],
    sides: 16,
    tier: "frame",
    zone: "joint",
    bevel,
  });
  // ankle rotary drum — radius from the ankle torque
  const ad = actuator.ankle;
  out.push({
    kind: "cyl",
    role: "frame",
    size: [ad.drumRadius, ad.drumRadius, ad.drumWidth],
    pos: [0, rig.ankleY + ad.drumRadius * 0.4, 0],
    rot: [0, 0, HALF_PI],
    sides: 14,
    tier: "frame",
    zone: "joint",
    bevel,
  });

  // knee flexor actuator — bore + stroke from the load; twin if the force is high
  const fx = actuator.flexor;
  const flexZ = rig.girth * 0.18;
  const twinDx = fx.drive === "twin-linear" ? fx.bore * 1.5 : 0;
  for (const sx of fx.drive === "twin-linear" ? [-1, 1] : [0]) {
    out.push({
      kind: "cyl",
      role: "mechanism",
      size: [fx.bore, fx.bore * 0.8, fx.stroke * (0.7 + brief.frameExposure * 0.3)],
      pos: [sx * twinDx, rig.length * 0.02, flexZ],
      sides: 12,
      tier: "frame",
      zone: "frame",
      bevel,
    });
  }
}

interface Greave {
  topY: number;
  botY: number;
  h: number;
  cy: number;
  wTop: number;
  wBot: number;
  depth: number;
  frontZ: number;
}

function greaveMass(ctx: Ctx): Greave {
  const { rig, brief, prop, out, topology } = ctx;

  const topY = rig.kneeY - rig.girth * 0.12;
  const botY = rig.ankleY + rig.ankleClearance; // functional clearance, not arbitrary
  const h = topY - botY;
  const cy = (topY + botY) / 2;

  // armour BULK is load-driven: allowance 0.4 (recon) .. 2.0 (bruiser) maps to a
  // slim shell .. a heavy one. This is the "질량감" knob.
  const bulk = 0.78 + (rig.load.armourAllowance - 0.4) * 0.32; // ~0.78 .. 1.29
  const wTop = rig.girth * bulk * lerp(1.0, 1.12, brief.taper * 0.5);
  const wBot = rig.girth * bulk * lerp(0.9, 0.62, brief.taper);
  const depth = rig.girth * bulk * lerp(0.9, 1.06, 0.5);

  // the TOPOLOGY decides how those dimensions are arranged into masses —
  // one shell, tiered plates, a split with side wings, a clamshell seam,
  // a keel spine, or stacked segments.
  const res = buildLimbArmour(topology, {
    brief,
    env: { cy, h, wTop, wBot, depth, pitch: -0.08 },
    bevel: prop.bevel,
    matA: "armorA",
    matB: "armorB",
  });
  out.push(...res.prims);

  return { topY, botY, h, cy, wTop, wBot, depth, frontZ: res.frontZ };
}

/** A fillet collar so a protrusion never sprouts from a bare face. */
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

function kneeGuard(ctx: Ctx, g: Greave) {
  const { brief, rig, out } = ctx;
  const gy = g.topY - g.h * 0.03;
  const gz = g.frontZ - rig.girth * 0.05;
  const w = g.wTop * 0.72;
  const hh = g.h * 0.22;

  root(ctx, 0, gy - hh * 0.4, g.depth * 0.32, rig.girth * 0.16);

  if (brief.silhouette === "S" && brief.edge === "S") {
    out.push({
      kind: "wedge",
      role: "armorB",
      size: [w, hh, rig.girth * 0.5],
      pos: [0, gy, gz],
      rot: [0.15, 0, 0],
      tier: "mass",
      zone: "joint",
      bevel: 0.05,
    });
  } else if (brief.silhouette === "S") {
    out.push({
      kind: "box",
      role: "armorB",
      size: [w, hh, rig.girth * 0.42],
      pos: [0, gy, gz],
      rot: [0.12, 0, 0],
      tier: "mass",
      zone: "joint",
      bevel: 0.5,
    });
  } else if (brief.edge === "S") {
    out.push({
      kind: "cyl",
      role: "armorB",
      size: [w * 0.5, w * 0.5, rig.girth * 0.44],
      pos: [0, gy, gz],
      rot: [HALF_PI + 0.1, 0, 0],
      sides: 14,
      tier: "mass",
      zone: "joint",
      bevel: 0.3,
    });
  } else {
    out.push({
      kind: "hemi",
      role: "armorB",
      size: [w * 0.5, 0, 0],
      pos: [0, gy - hh * 0.2, gz],
      rot: [-0.25, 0, 0],
      tier: "mass",
      zone: "joint",
      bevel: 1,
    });
  }
}

function calfPod(ctx: Ctx, g: Greave) {
  const { brief, rig, out, topology } = ctx;
  // clamshell / spine / segmented already resolve the rear of the greave —
  // a bolt-on pod on top of them just re-clutters the calf.
  if (topology === "clamshell" || topology === "spine" || topology === "segmented") return;
  if (brief.decoration < 0.45 && brief.role !== "artillery" && brief.role !== "support") return;
  const round = brief.silhouette === "R";
  // sit LOW on the calf (well clear of the knee pivot) and don't reach far back
  const py = g.cy - g.h * (0.14 + ctx.rng.range(-0.03, 0.05));
  const pz = -g.depth * (0.3 + ctx.rng.range(-0.02, 0.05));
  const len = g.h * ctx.rng.range(0.4, 0.5);
  root(ctx, 0, py + len * 0.4, -g.depth * 0.24, rig.girth * 0.13);
  out.push({
    kind: round ? "cyl" : "box",
    role: "armorB",
    size: round
      ? [rig.girth * 0.28, rig.girth * 0.24, len]
      : [rig.girth * 0.5, len, rig.girth * 0.26],
    pos: [0, py, pz],
    rot: [0.08, 0, 0],
    sides: round ? 14 : undefined,
    tier: "mass",
    zone: "vent",
    bevel: round ? 0.6 : ctx.prop.bevel,
  });
}

/** Detail budget: L=4, M=2, S=1 points. Spend, then stop. Joint/Vent zones only. */
function details(ctx: Ctx, g: Greave) {
  const { brief, prop, rng, rig, out } = ctx;
  let budget = Math.round(2 + brief.decoration * 6) + rng.int(2) - 1; // 2..8, ±1
  const [L, M, S] = prop.detailSizes;

  // L — the hero, on the knee guard (joint zone)
  if (budget >= 4) {
    budget -= 4;
    const gy = g.topY + L * 0.2;
    if (brief.edge === "S") {
      out.push({
        kind: "cone",
        role: "accent",
        size: [L * 0.12, L * 0.5, L * 1.4],
        pos: [0, gy, g.frontZ - rig.girth * 0.02],
        rot: [-HALF_PI + 0.3, 0, 0],
        tier: "detail",
        zone: "joint",
        bevel: 0,
      });
    } else {
      // a knee striker cap — a knee has no reason to glow, so this is armour,
      // not a light. `light` role is reserved for head optics + weapon beams.
      out.push({
        kind: "hemi",
        role: "armorB",
        size: [L * 0.5, 0, 0],
        pos: [0, gy - L * 0.2, g.frontZ - rig.girth * 0.03],
        rot: [-0.2, 0, 0],
        tier: "detail",
        zone: "joint",
        bevel: 1,
      });
    }
  } else if (budget >= 2) {
    budget -= 2;
    out.push({
      kind: "box",
      role: "accent",
      size: [g.wTop * 0.5, M, M * 0.6],
      pos: [0, g.topY, g.frontZ - g.depth * 0.04],
      rot: [-0.08, 0, 0],
      tier: "detail",
      zone: "joint",
      bevel: prop.bevel,
    });
  }

  // M — a calf vent louver set (vent zone), if there is a pod-ish back
  if (budget >= 2 && brief.decoration > 0.4) {
    budget -= 2;
    const louvers = 2 + rng.int(2); // 2..3
    for (let i = 0; i < louvers; i++) {
      out.push({
        kind: "box",
        role: "mechanism",
        size: [rig.girth * 0.34, M * 0.35, rig.girth * 0.12],
        pos: [0, g.cy + (i - (louvers - 1) / 2) * M * 0.9, -g.depth * 0.46],
        rot: [0.12, 0, 0],
        tier: "detail",
        zone: "vent",
        bevel: 0,
      });
    }
  }

  // S — a few bolt heads on the knee guard (joint zone)
  const bolts = Math.max(0, Math.min(budget, (brief.decoration > 0.55 ? 4 : 2) + rng.int(2) - 1));
  for (let i = 0; i < bolts; i++) {
    const a = (i / Math.max(1, bolts - 1) - 0.5) * g.wTop * 0.55;
    out.push({
      kind: "cyl",
      role: "metal",
      size: [S * 0.5, S * 0.5, S * 0.5],
      pos: [a, g.topY - g.h * 0.06, g.frontZ + S * 0.1],
      rot: [-0.08, 0, 0],
      sides: 6,
      tier: "detail",
      zone: "joint",
      bevel: 0,
    });
  }
}

export function grammarShin(brief: Brief, prop: Proportions, rig: ShinRig, opts: ShinOpts = {}): Prim[] {
  const variant = opts.variant ?? 0;
  const rng = makeRng(`shin:${brief.seed}:${variant}`);
  // the topology is a LEG-level decision so the thigh matches the shin.
  const topology = opts.topology ?? pickLimbTopology(brief, makeRng(`leg:${brief.seed}`));
  const ctx: Ctx = { brief, prop, rig, rng, topology, out: [] };
  frameLayer(ctx);
  const g = greaveMass(ctx);
  kneeGuard(ctx, g);
  calfPod(ctx, g);
  details(ctx, g);
  return ctx.out;
}
