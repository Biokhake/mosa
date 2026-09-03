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

import { makeRng, lerp, clamp } from "../rng";
import type { Brief, Proportions, Prim, PrimKind } from "../types";
import type { ShinRig } from "../skeleton";

const HALF_PI = Math.PI / 2;

interface Ctx {
  brief: Brief;
  prop: Proportions;
  rig: ShinRig;
  rng: ReturnType<typeof makeRng>;
  out: Prim[];
}

/** Greave primitive kind for the band. */
function greaveKind(brief: Brief): PrimKind {
  if (brief.silhouette === "S") return brief.edge === "S" ? "trapPrism" : "box";
  return brief.edge === "S" ? "cyl" : "capsule";
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
  const { rig, brief, prop, out } = ctx;

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
  const frontZ = depth * 0.5;
  const kind = greaveKind(brief);

  if (kind === "trapPrism") {
    out.push({
      kind,
      role: "armorA",
      size: [wTop * 0.9, wBot, h],
      pos: [0, cy, depth * 0.06],
      rot: [-0.08, 0, 0],
      depth,
      tier: "mass",
      zone: "armor",
      bevel: prop.bevel,
    });
  } else if (kind === "box") {
    // two-section box: the SR "filleted" read — corners clearly rounded
    const bv = Math.max(0.65, prop.bevel);
    out.push(
      {
        kind: "box",
        role: "armorA",
        size: [wTop, h * 0.58, depth],
        pos: [0, cy + h * 0.2, 0],
        rot: [-0.08, 0, 0],
        tier: "mass",
        zone: "armor",
        bevel: bv,
      },
      {
        kind: "box",
        role: "armorA",
        size: [wBot, h * 0.48, depth * 0.96],
        pos: [0, cy - h * 0.26, depth * 0.02],
        rot: [-0.08, 0, 0],
        tier: "mass",
        zone: "armor",
        bevel: bv,
      },
    );
  } else if (kind === "cyl") {
    out.push({
      kind: "cyl",
      role: "armorA",
      size: [wTop * 0.5, wBot * 0.5, h],
      pos: [0, cy, depth * 0.08],
      rot: [-0.08, 0, 0],
      sides: 16,
      tier: "mass",
      zone: "armor",
      bevel: prop.bevel,
    });
  } else {
    out.push({
      kind: "capsule",
      role: "armorA",
      size: [wTop * 0.5, h * 0.66, 0],
      pos: [0, cy, depth * 0.06],
      rot: [-0.08, 0, 0],
      sides: 20,
      tier: "mass",
      zone: "armor",
      bevel: 1,
    });
  }

  return { topY, botY, h, cy, wTop, wBot, depth, frontZ };
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
  const { brief, rig, out } = ctx;
  if (brief.decoration < 0.45 && brief.role !== "artillery" && brief.role !== "support") return;
  const round = brief.silhouette === "R";
  // sit LOW on the calf (well clear of the knee pivot) and don't reach far back
  const py = g.cy - g.h * 0.14;
  const pz = -g.depth * 0.32;
  root(ctx, 0, py + g.h * 0.16, -g.depth * 0.24, rig.girth * 0.13);
  out.push({
    kind: round ? "cyl" : "box",
    role: "armorB",
    size: round
      ? [rig.girth * 0.28, rig.girth * 0.24, g.h * 0.42]
      : [rig.girth * 0.5, g.h * 0.44, rig.girth * 0.26],
    pos: [0, py, pz],
    rot: [0.08, 0, 0],
    sides: round ? 14 : undefined,
    tier: "mass",
    zone: "vent",
    bevel: round ? 0.6 : ctx.prop.bevel,
  });
}

/** Panel lines — dark inset grooves cut across the greave, following its taper. */
function panelCuts(ctx: Ctx, g: Greave) {
  const { brief, out } = ctx;
  const n = Math.round(clamp(brief.decoration * 3.2, 0, 3));
  for (let i = 0; i < n; i++) {
    const f = (i + 1) / (n + 1);
    const y = g.topY - f * g.h;
    const w = lerp(g.wTop, g.wBot, f) * 0.72;
    out.push({
      kind: "box",
      role: "mechanism",
      size: [w, Math.max(0.004, g.h * 0.018), g.depth * 0.06],
      pos: [0, y, g.frontZ - g.depth * 0.02],
      rot: [-0.08, 0, 0],
      tier: "panel",
      zone: "armor",
      bevel: 0,
    });
  }
}

/** Detail budget: L=4, M=2, S=1 points. Spend, then stop. Joint/Vent zones only. */
function details(ctx: Ctx, g: Greave) {
  const { brief, prop, rng, rig, out } = ctx;
  let budget = Math.round(2 + brief.decoration * 6); // 2..8
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
      out.push({
        kind: "hemi",
        role: "light",
        size: [L * 0.45, 0, 0],
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
    for (let i = 0; i < 3; i++) {
      out.push({
        kind: "box",
        role: "mechanism",
        size: [rig.girth * 0.34, M * 0.35, rig.girth * 0.12],
        pos: [0, g.cy + (i - 1) * M * 0.9, -g.depth * 0.46],
        rot: [0.12, 0, 0],
        tier: "detail",
        zone: "vent",
        bevel: 0,
      });
    }
  }

  // S — a few bolt heads on the knee guard (joint zone)
  const bolts = Math.min(budget, brief.decoration > 0.55 ? 4 : 2);
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
  if (rng) void rng; // reserved for future stochastic placement
}

export function grammarShin(brief: Brief, prop: Proportions, rig: ShinRig): Prim[] {
  const ctx: Ctx = { brief, prop, rig, rng: makeRng(`shin:${brief.seed}`), out: [] };
  frameLayer(ctx);
  const g = greaveMass(ctx);
  kneeGuard(ctx, g);
  calfPod(ctx, g);
  panelCuts(ctx, g);
  details(ctx, g);
  return ctx.out;
}
