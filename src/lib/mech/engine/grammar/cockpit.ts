/**
 * COCKPIT / CHEST CORE form grammar.
 *
 * The chest is the one part a viewer reads first, and it was the one part with
 * no design decisions in it at all: every kit got the same thoracic cage, the
 * same central turbine, the same two fin banks and the same breastplate, scaled
 * by one of three thickness values. A hundred kits, one chest.
 *
 * So the architecture is chosen here, per brief, along four independent axes:
 *
 *   REACTOR     where the powerplant lives and whether it shows at all
 *   BREASTPLATE how the front armour is massed
 *   HATCH       how the pilot gets in — the thing that makes it a COCKPIT
 *   INTAKE      how air is taken in and heat is thrown away
 *
 * The four are picked separately, so they combine rather than enumerate: the
 * point is that two kits sharing a reactor layout still differ in the plate,
 * the hatch and the breathing.
 *
 * ENVELOPE. The studio's chest sockets were positioned by hand — collar, head,
 * shoulders and the Chest L/R segments are all dimensioned against this block,
 * and the range-of-motion work that placed them is not something to redo for a
 * styling change. So the grammar varies the ARCHITECTURE inside a fixed
 * envelope rather than the envelope itself:
 *
 *   x  +/- 0.16      (Chest L/R seat at +/- 0.20)
 *   y  -0.11 .. 0.11 (collar rim sits at +0.14)
 *   z  -0.13 .. 0.12 (the cockpit hatch module occupies the space in front)
 *
 * Local frame: origin at the chest socket, +Y up, +Z forward.
 */

import { makeRng, hash32, lerp, clamp } from "../rng";
import type { Brief, Prim, PrimKind, Proportions } from "../types";
import type { PartInterface } from "../types";

const HALF_PI = Math.PI / 2;

/** Where the powerplant sits, and whether any of it is visible. */
export type ReactorLayout = "central" | "high" | "twin" | "ring" | "sealed";
/** How the front armour is massed. */
export type Breastplate = "slab" | "splitV" | "stepped" | "clamshell";
/** How the pilot gets in. */
export type Hatch = "front" | "canopy" | "coreBlock";
/** How the chest breathes. */
export type Intake = "framed" | "louvered" | "chevron" | "none";

export interface CockpitArchitecture {
  reactor: ReactorLayout;
  breastplate: Breastplate;
  hatch: Hatch;
  intake: Intake;
  /** 0..1 how much of the chassis frame is left visible */
  exposure: number;
}

export interface CockpitRig {
  /** full width of the chest block */
  width: number;
  /** full height of the chest block */
  height: number;
  /** front-to-back depth of the chassis */
  depth: number;
  /** local Y at which the cervical column leaves the block */
  neckY: number;
  /** how far forward the breastplate may reach before the hatch module */
  frontZ: number;
}

/**
 * Role decides how much powerplant a kit is willing to show. An artillery
 * platform is mostly generator and says so; a recon frame hides it, because a
 * glowing core is a thing to be seen by.
 */
const REACTOR_POOL: Record<Brief["role"], ReactorLayout[]> = {
  artillery: ["ring", "twin", "central"],
  support: ["ring", "central", "twin"],
  bruiser: ["twin", "central", "high"],
  line: ["central", "high", "twin"],
  skirmisher: ["high", "central", "sealed"],
  recon: ["sealed", "high", "central"],
};

/** The band decides the plate language; the seed decides which of its options. */
function pickBreastplate(brief: Brief, n: number): Breastplate {
  const pool: Breastplate[] =
    brief.silhouette === "S"
      ? brief.edge === "S"
        ? ["splitV", "stepped", "slab"]
        : ["stepped", "slab", "splitV"]
      : brief.edge === "S"
        ? ["clamshell", "splitV", "stepped"]
        : ["slab", "clamshell", "stepped"];
  return pool[n % pool.length]!;
}

function pickHatch(brief: Brief, n: number): Hatch {
  // a canopy needs somewhere to see out of, so it goes to the roles that look;
  // a heavy frame swallows the pilot in a core block instead.
  const pool: Hatch[] =
    brief.role === "recon" || brief.role === "skirmisher"
      ? ["canopy", "front", "coreBlock"]
      : brief.role === "bruiser" || brief.role === "artillery"
        ? ["coreBlock", "front", "canopy"]
        : ["front", "coreBlock", "canopy"];
  return pool[n % pool.length]!;
}

function pickIntake(brief: Brief, n: number): Intake {
  if (brief.decoration < 0.18) return "none";
  // A chevron is a WEDGE, and four wedges are enough to tip the measured edge
  // band from filleted to sharp on their own. A hard motif on a fully-filleted
  // machine is the language clash the kit critic exists to catch, so the round
  // band simply does not get chevrons.
  const pool: Intake[] = brief.edge === "S" ? ["chevron", "louvered", "framed"] : ["framed", "louvered", "framed"];
  return pool[n % pool.length]!;
}

export function cockpitArchitecture(brief: Brief): CockpitArchitecture {
  const h = hash32(`cockpit:${brief.seed}`);
  const pool = REACTOR_POOL[brief.role];
  return {
    reactor: pool[h % pool.length]!,
    breastplate: pickBreastplate(brief, h >>> 3),
    hatch: pickHatch(brief, h >>> 7),
    intake: pickIntake(brief, h >>> 11),
    exposure: brief.frameExposure,
  };
}

/** Bulk by role, kept inside the envelope the studio's sockets were fitted to. */
const ROLE_BULK: Record<Brief["role"], number> = {
  recon: 0.9,
  skirmisher: 0.94,
  line: 1,
  support: 1.02,
  artillery: 1.06,
  bruiser: 1.08,
};

export function cockpitView(brief: Brief): CockpitRig {
  const bulk = ROLE_BULK[brief.role];
  return {
    width: 0.32 * bulk,
    height: 0.22,
    depth: 0.26 * lerp(0.94, 1.08, brief.taper),
    neckY: 0.1,
    frontZ: 0.12,
  };
}

interface Ctx {
  brief: Brief;
  prop: Proportions;
  rig: CockpitRig;
  arch: CockpitArchitecture;
  rng: ReturnType<typeof makeRng>;
  out: Prim[];
}

/** Bevel comes from the edge band, not from the primitive. */
function bevelOf(brief: Brief): number {
  return brief.edge === "S" ? 0.06 : 0.72;
}

/** A fillet collar, so nothing in the joint zone sprouts from a bare face. */
function root(ctx: Ctx, x: number, y: number, z: number, r: number) {
  ctx.out.push({
    kind: "cyl",
    role: "frame",
    size: [r, r * 1.12, r * 0.5],
    pos: [x, y, z],
    rot: [HALF_PI, 0, 0],
    sides: 12,
    tier: "frame",
    zone: "joint",
    bevel: 0.4,
  });
}

/**
 * One armour mass.
 *
 * A round cross-section is not a round SILHOUETTE. A cylinder projects to a
 * rectangle from every angle, and sizing one from the plate's width makes its
 * DIAMETER the chest's depth — a barrel that swallows the whole assembly. So
 * an R chest is a stack of bands whose WIDTH follows a curve, which is what
 * actually bends the outline, and every kind keeps an explicit depth.
 */
/** Width scale down a plate, 0 at the collar to 1 at the waist. */
function profileAt(t: number): number {
  return 0.5 + 0.5 * Math.sin(Math.PI * Math.pow(t, 0.82));
}

function plateMass(
  ctx: Ctx,
  x: number,
  y: number,
  /** z of the mass's OUTERMOST face — what the reactor and vents seat against */
  frontZ: number,
  w: number,
  h: number,
  d: number,
  role: Prim["role"],
  group?: string,
  rot?: [number, number, number],
): void {
  const bevel = bevelOf(ctx.brief);
  if (ctx.brief.silhouette === "S") {
    ctx.out.push({ kind: "box", role, size: [w, h, d], pos: [x, y, frontZ - d / 2], rot, tier: "mass", zone: "armor", bevel, group });
    return;
  }
  // A lens profile: tucked at the collar, full across the chest, drawn back in
  // at the waist. The band COUNT is what decides whether the outline reads as a
  // curve — a cylinder still rasterises to a rectangle, so the curvature comes
  // entirely from how often the width changes down the span. Three bands leave
  // visible corners; eight read as a shoulder line.
  const SEGS = 8;
  const gid = group ?? `plate:${Math.round(x * 1e4)}:${Math.round(y * 1e4)}`;
  let top = y + h / 2;
  for (let i = 0; i < SEGS; i++) {
    const t0 = i / SEGS;
    const t1 = (i + 1) / SEGS;
    const bh = h / SEGS;
    // width at the band's widest end, so adjacent bands share an edge
    const ws = Math.max(profileAt(t0), profileAt(t1));
    const r = (w * ws) / 2;
    ctx.out.push({
      kind: "cyl",
      role,
      size: [r, r, bh],
      pos: [x, top - bh / 2, frontZ - r],
      rot,
      sides: 18,
      tier: "mass",
      zone: "armor",
      bevel,
      group: gid,
    });
    top -= bh;
  }
}

/**
 * FRAME — the thoracic chassis, and the cervical column that carries the head.
 *
 * The column is not styling: before it existed the skeleton had no head-to-
 * chest connection at all and the collar had nothing to wrap. It stays a
 * three-axis stack (yaw turntable, pitch trunnion, roll coupling) at fixed
 * heights, because the collar rim and the head are dimensioned against it.
 *
 * The cage is deliberately NARROWER than the breastplate: a chassis as wide as
 * the armour leaves the vents and heat exchangers nowhere to sit where anyone
 * can see them.
 */
function frameLayer(ctx: Ctx) {
  const { rig, arch, out } = ctx;
  const w = rig.width;
  const h = rig.height;
  const d = rig.depth;

  out.push({
    kind: "box",
    role: "mechanism",
    size: [w * 0.78, h, d],
    pos: [0, 0, -0.01],
    tier: "frame",
    zone: "frame",
    bevel: 0.15,
  });
  const railW = w * lerp(0.07, 0.11, arch.exposure);
  for (const s of [-1, 1]) {
    out.push({
      kind: "box",
      role: "frame",
      size: [railW, h * 1.09, d * 0.92],
      pos: [s * w * 0.4, 0, -0.02],
      tier: "frame",
      zone: "frame",
      bevel: 0.2,
    });
  }

  // --- cervical column: the head/chest connection frame -------------------
  const nb = rig.neckY;
  out.push(
    { kind: "cyl", role: "frame", size: [w * 0.16, w * 0.16, 0.045], pos: [0, nb, 0], sides: 14, tier: "frame", zone: "joint", bevel: 0.35 },
    { kind: "torus", role: "metal", size: [w * 0.17, 0.008, 0], pos: [0, nb + 0.02, 0], rot: [HALF_PI, 0, 0], sides: 16, tier: "frame", zone: "joint", bevel: 0 },
    { kind: "cyl", role: "mechanism", size: [w * 0.1, w * 0.113, 0.09], pos: [0, nb + 0.06, 0], sides: 12, tier: "frame", zone: "joint", bevel: 0.3 },
    { kind: "cyl", role: "frame", size: [w * 0.113, w * 0.113, 0.05], pos: [0, nb + 0.105, 0], rot: [0, 0, HALF_PI], sides: 14, tier: "frame", zone: "joint", bevel: 0.35 },
    { kind: "cyl", role: "metal", size: [w * 0.081, w * 0.094, 0.06], pos: [0, nb + 0.15, 0], sides: 12, tier: "frame", zone: "joint", bevel: 0.3 },
    { kind: "torus", role: "frame", size: [w * 0.1, 0.01, 0], pos: [0, nb + 0.175, 0], rot: [HALF_PI, 0, 0], sides: 16, tier: "frame", zone: "joint", bevel: 0 },
  );

  // shoulder yokes — what the Chest L/R segments and the arms actually seat on
  for (const s of [-1, 1]) {
    out.push({
      kind: "cyl",
      role: "frame",
      size: [h * 0.16, h * 0.16, w * 0.16],
      pos: [s * w * 0.47, h * 0.2, -0.01],
      rot: [0, 0, HALF_PI],
      sides: 12,
      tier: "frame",
      zone: "joint",
      bevel: 0.3,
    });
  }
}

/** MASS — the front armour. Returns the z of its outermost face. */
function breastplateMass(ctx: Ctx): number {
  const { rig, arch, brief, out } = ctx;
  const w = rig.width;
  const h = rig.height;
  const d = lerp(0.05, 0.075, brief.taper);
  const front = rig.frontZ;
  // A round chest carries its volume in depth, so it is narrower across than a
  // flat one; a flat one spends the same mass on width. Both stay inside the
  // envelope the studio's shoulder and Chest L/R sockets were fitted to.
  const pw = w * (brief.silhouette === "R" ? 0.7 : 0.84);
  const ph = h * 0.82;

  if (arch.breastplate === "slab") {
    plateMass(ctx, 0, 0.005, front, pw, ph, d, "armorA");
  } else if (arch.breastplate === "splitV") {
    // two plates cranked toward a central seam — the sternum reads as an edge
    for (const s of [-1, 1]) {
      plateMass(ctx, s * pw * 0.26, 0.005, front - d * 0.08, pw * 0.56, ph, d, "armorA", `breastV${s > 0 ? "L" : "R"}`, [0, s * 0.2, 0]);
    }
  } else if (arch.breastplate === "stepped") {
    plateMass(ctx, 0, 0.005, front - d * 0.5, pw, ph, d * 0.8, "armorA");
    plateMass(ctx, 0, 0.005, front, pw * 0.6, ph * 0.54, d * 0.6, "armorB", "breastStep");
  } else {
    for (const s of [-1, 1]) {
      plateMass(ctx, s * pw * 0.255, 0.005, front, pw * 0.5, ph, d, "armorA", `breastC${s > 0 ? "L" : "R"}`);
    }
    out.push({
      kind: "box",
      role: "mechanism",
      size: [Math.max(0.005, w * 0.035), ph * 1.02, d * 1.15],
      pos: [0, 0.005, front - d * 0.5],
      tier: "panel",
      zone: "armor",
      bevel: 0,
    });
  }
  return front;
}

/**
 * The powerplant — the one place on this machine a glow is earned.
 *
 * The housing is seated PROUD of the breastplate rather than behind it. A core
 * buried under the front armour is geometry nobody will ever see, and a raised
 * bezel is how a chest gem is actually mounted.
 */
function reactor(ctx: Ctx, plateFront: number) {
  const { rig, arch, brief, out } = ctx;
  const w = rig.width;
  const h = rig.height;

  const gem = (x: number, y: number, r: number) => {
    const housingD = 0.075;
    // front face of the housing just clear of the plate
    const cz = plateFront + 0.01 - housingD * 0.5;
    // the collar belongs in the PLATE FACE — that is the ring the housing
    // actually passes through, and it is what the bezel in front of it seats on
    root(ctx, x, y, plateFront - 0.005, r * 1.75);
    out.push(
      { kind: "cyl", role: "mechanism", size: [r * 1.5, r * 1.5, housingD], pos: [x, y, cz], rot: [HALF_PI, 0, 0], sides: brief.edge === "S" ? 8 : 16, tier: "mass", zone: "joint", bevel: 0.3 },
      { kind: "torus", role: "trim", size: [r * 1.4, r * 0.26, 0], pos: [x, y, plateFront + 0.012], sides: 20, tier: "detail", zone: "joint", bevel: 0 },
      { kind: "cyl", role: "light", size: [r, r, housingD * 0.9], pos: [x, y, cz + 0.004], rot: [HALF_PI, 0, 0], sides: 14, tier: "detail", zone: "joint", bevel: 0 },
    );
  };

  if (arch.reactor === "central") {
    gem(0, h * 0.04, w * 0.115);
  } else if (arch.reactor === "high") {
    gem(0, h * 0.26, w * 0.095);
  } else if (arch.reactor === "twin") {
    for (const s of [-1, 1]) gem(s * w * 0.22, h * 0.06, w * 0.078);
  } else if (arch.reactor === "ring") {
    // an annular generator: the housing shows, the core is a slot in its face
    const r = w * 0.21;
    const cz = plateFront + 0.008 - 0.035;
    root(ctx, 0, h * 0.02, plateFront - 0.005, r * 1.15);
    out.push(
      { kind: "cyl", role: "mechanism", size: [r * 0.86, r * 0.86, 0.07], pos: [0, h * 0.02, cz], rot: [HALF_PI, 0, 0], sides: 18, tier: "mass", zone: "joint", bevel: 0.3 },
      { kind: "torus", role: "metal", size: [r, w * 0.05, 0], pos: [0, h * 0.02, plateFront + 0.014], sides: 24, tier: "mass", zone: "joint", bevel: 0 },
      { kind: "cyl", role: "light", size: [r * 0.46, r * 0.46, 0.075], pos: [0, h * 0.02, cz + 0.004], rot: [HALF_PI, 0, 0], sides: 16, tier: "detail", zone: "joint", bevel: 0 },
    );
  } else {
    // sealed — an armoured plug where the core would be, and nothing to see by
    const r = w * 0.15;
    const cz = plateFront + 0.008 - 0.03;
    root(ctx, 0, h * 0.02, plateFront - 0.005, r * 1.3);
    out.push(
      { kind: "cyl", role: "metal", size: [r, r * 1.08, 0.06], pos: [0, h * 0.02, cz], rot: [HALF_PI, 0, 0], sides: brief.edge === "S" ? 8 : 16, tier: "mass", zone: "joint", bevel: 0.35 },
      { kind: "cyl", role: "mechanism", size: [r * 0.6, r * 0.6, 0.05], pos: [0, h * 0.02, cz + 0.012], rot: [HALF_PI, 0, 0], sides: brief.edge === "S" ? 8 : 14, tier: "detail", zone: "joint", bevel: 0.2 },
    );
  }
}

/**
 * VENT — how the chest breathes, and where the heat goes.
 *
 * Everything here sits on the OUTSIDE: intakes proud of the breastplate face,
 * heat exchangers outboard of the plate edge. Vents tucked inside the chassis
 * are cost with no payoff, which is exactly what the old chest did with them.
 */
function intakes(ctx: Ctx, plateFront: number) {
  const { rig, arch, brief, out } = ctx;
  if (arch.intake === "none") return;
  const w = rig.width;
  const h = rig.height;

  if (arch.intake === "framed") {
    for (const s of [-1, 1]) {
      const r = w * 0.085;
      out.push(
        { kind: "cyl", role: "metal", size: [r, r, 0.05], pos: [s * w * 0.27, -h * 0.2, plateFront + 0.004], rot: [HALF_PI, 0, 0], sides: 16, tier: "mass", zone: "vent", bevel: 0.3 },
        { kind: "cyl", role: "mechanism", size: [r * 0.66, r * 0.66, 0.055], pos: [s * w * 0.27, -h * 0.2, plateFront + 0.008], rot: [HALF_PI, 0, 0], sides: 14, tier: "detail", zone: "vent", bevel: 0 },
      );
    }
  } else if (arch.intake === "louvered") {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        out.push({
          kind: "box",
          role: "mechanism",
          size: [w * 0.17, h * 0.042, 0.026],
          pos: [s * w * 0.24, -h * (0.12 + i * 0.1), plateFront - 0.004],
          rot: [0.22, 0, 0],
          tier: "detail",
          zone: "vent",
          bevel: 0,
        });
      }
    }
  } else {
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        out.push({
          kind: "wedge",
          role: "mechanism",
          size: [w * 0.18, h * 0.07, 0.032],
          pos: [s * w * 0.24, -h * (0.14 + i * 0.15), plateFront - 0.006],
          rot: [0, 0, s * (brief.edge === "S" ? 0.34 : 0.22)],
          tier: "detail",
          zone: "vent",
          bevel: 0,
        });
      }
    }
  }

  // lateral heat exchangers — outboard of the plate edge, where they show
  const fins = brief.role === "artillery" || brief.role === "bruiser" ? 3 : 2;
  for (const s of [-1, 1]) {
    for (let i = 0; i < fins; i++) {
      out.push({
        kind: "box",
        role: "metal",
        size: [w * 0.075, h * 0.07, 0.11],
        pos: [s * w * 0.49, h * (0.2 - i * 0.19), 0.012],
        tier: "detail",
        zone: "vent",
        bevel: 0,
      });
    }
  }
}

/**
 * The chest-core artifact: chassis, powerplant, front armour, breathing, and
 * the cervical column the head hangs from.
 */
export function grammarChestCore(brief: Brief, prop: Proportions): Prim[] {
  const ctx: Ctx = {
    brief,
    prop,
    rig: cockpitView(brief),
    arch: cockpitArchitecture(brief),
    rng: makeRng(`chest:${brief.seed}`),
    out: [],
  };
  frameLayer(ctx);
  const plateFront = breastplateMass(ctx);
  reactor(ctx, plateFront);
  intakes(ctx, plateFront);
  return ctx.out;
}

/**
 * The cockpit hatch module — the part that makes the chest a cockpit rather
 * than a box with a light in it. It sits in front of the chest core, in the
 * seat the breastplate leaves for it, and it is built from the SAME
 * architecture record, so the hatch language always agrees with the plate
 * behind it. Its own local frame; the studio seats this slot forward.
 */
export function grammarCockpitHatch(brief: Brief, prop: Proportions): Prim[] {
  const arch = cockpitArchitecture(brief);
  const rig = cockpitView(brief);
  const ctx: Ctx = { brief, prop, rig, arch, rng: makeRng(`hatch:${brief.seed}`), out: [] };
  const out = ctx.out;
  const w = rig.width * 0.46;
  const h = rig.height * 0.68;
  const d = lerp(0.075, 0.11, brief.taper);

  // bulkhead the hatch is cut into
  out.push({
    kind: "box",
    role: "mechanism",
    size: [w * 0.98, h, 0.06],
    pos: [0, 0, -0.02],
    tier: "frame",
    zone: "frame",
    bevel: 0.15,
  });

  if (arch.hatch === "front") {
    // a door: a plate with a recessed seam panel and two latches
    plateMass(ctx, 0, 0, d * 0.86, w, h, d, "armorA");
    out.push({
      kind: "box",
      role: "mechanism",
      size: [w * 0.72, h * 0.66, d * 0.24],
      pos: [0, h * 0.02, d * 0.82],
      tier: "panel",
      zone: "armor",
      bevel: 0,
    });
    for (const s of [-1, 1]) {
      root(ctx, s * w * 0.42, -h * 0.24, d * 0.5, w * 0.1);
      out.push({
        kind: "cyl",
        role: "metal",
        size: [w * 0.055, w * 0.055, d * 0.42],
        pos: [s * w * 0.42, -h * 0.24, d * 0.72],
        rot: [HALF_PI, 0, 0],
        sides: 8,
        tier: "detail",
        zone: "joint",
        bevel: 0,
      });
    }
  } else if (arch.hatch === "canopy") {
    // a raised canopy: a sloped frame with a dark aperture set into it. The
    // aperture is glass, not a lamp — nothing here is allowed to emit.
    plateMass(ctx, 0, h * 0.05, d * 0.9, w * 1.02, h * 0.86, d, "armorA", "canopy", [-0.16, 0, 0]);
    out.push({
      // the aperture reads as a window because its dark face is what you see,
      // so it straddles the canopy surface rather than sitting behind it
      kind: "box",
      role: "mechanism",
      size: [w * 0.6, h * 0.4, d * 0.24],
      pos: [0, h * 0.12, d * 0.86],
      rot: [-0.16, 0, 0],
      tier: "panel",
      zone: "armor",
      bevel: 0,
    });
    // the hinge the canopy actually opens on
    out.push({
      kind: "cyl",
      role: "frame",
      size: [w * 0.07, w * 0.07, w * 0.9],
      pos: [0, h * 0.46, d * 0.16],
      rot: [0, 0, HALF_PI],
      sides: 12,
      tier: "frame",
      zone: "joint",
      bevel: 0.3,
    });
  } else {
    // core block: the whole module is the escape pod, framed by its eject rails
    plateMass(ctx, 0, 0, d * 0.84, w * 0.92, h * 0.92, d, "armorA", "coreblock");
    for (const s of [-1, 1]) {
      out.push({
        kind: "box",
        role: "frame",
        size: [w * 0.09, h * 1.02, d * 0.7],
        pos: [s * w * 0.54, 0, d * 0.2],
        tier: "frame",
        zone: "joint",
        bevel: 0.25,
      });
    }
    root(ctx, 0, 0, d * 0.8, w * 0.4);
    out.push({
      kind: "torus",
      role: "trim",
      size: [w * 0.34, w * 0.035, 0],
      pos: [0, 0, d * 0.86],
      sides: 20,
      tier: "detail",
      zone: "joint",
      bevel: 0,
    });
  }

  // A small hardware budget, spent in MIRRORED PAIRS — a lone stud off the
  // centreline is the difference between a machined part and a mistake.
  const pairs = Math.round(clamp(brief.decoration * 2.4, 0, 2));
  for (let i = 0; i < pairs; i++) {
    const y = h * (0.3 - i * 0.34);
    for (const s of [-1, 1]) {
      root(ctx, s * w * 0.62, y, d * 0.2, w * 0.09);
      out.push({
        kind: "cyl",
        role: "metal",
        size: [w * 0.045, w * 0.045, 0.022],
        pos: [s * w * 0.62, y, d * 0.36],
        rot: [HALF_PI, 0, 0],
        sides: 6,
        tier: "detail",
        zone: "joint",
        bevel: 0,
      });
    }
  }

  return out;
}

/**
 * The chest's connection contract. Parent = the abdomen below; children = the
 * neck (via the cervical column) and the two shoulder yokes.
 */
export function cockpitInterfaces(rig: CockpitRig): PartInterface[] {
  const w = rig.width;
  return [
    { id: "chest.waist", role: "parent", parentSlot: "abdomen", pos: [0, -rig.height * 0.5, -0.01], normal: [0, -1, 0], axis: [0, 1, 0], kind: "ball", size: w * 0.36, rating: 0.8 },
    { id: "chest.neck", role: "child", pos: [0, rig.neckY + 0.175, 0], normal: [0, 1, 0], axis: [0, 1, 0], kind: "ball", size: w * 0.2, rating: 0.35 },
    { id: "chest.shoulderR", role: "child", pos: [-w * 0.47, rig.height * 0.2, -0.01], normal: [-1, 0, 0], axis: [1, 0, 0], kind: "ball", size: w * 0.16, rating: 0.7 },
    { id: "chest.shoulderL", role: "child", pos: [w * 0.47, rig.height * 0.2, -0.01], normal: [1, 0, 0], axis: [1, 0, 0], kind: "ball", size: w * 0.16, rating: 0.7 },
  ];
}
