import type { Recipe } from "../recipes";
import type { MatKey } from "../palette";
import type { Spec } from "./types";
import {
  B,
  C,
  N,
  Sp,
  Wedge,
  Trap,
  Cowl,
  Octa,
  base,
} from "./primitives";
import { generateKitDNA, SHAPE, type KitDNA, type ShapeId } from "./dna";

export type ArchetypeType = "grunt" | "heavy" | "speed" | "heroic" | "beast";

export interface ParsedKit {
  kitId: string;
  quad: "SS" | "SR" | "RS" | "RR";
  letter: string;
  serial: number;
  letterIndex: number;
  densityLevel: number;
  isOrnate: boolean;
  archetype: ArchetypeType;
  /** Unique procedural seed for this kit (0..99). */
  seed: number;
  /** Full procedural design DNA derived from the kit ID (Master Prompt 8.0). */
  dna: KitDNA;
}

/**
 * Parses the Kit ID (e.g. "SSA-001", "RRM-088") to determine quad, complexity,
 * archetype, and the procedural DNA that guarantees 100 distinct silhouettes.
 */
export function parseKitCode(kitId: string): ParsedKit {
  const clean = (kitId || "SSA-001").trim().toUpperCase();
  const quadPart = clean.slice(0, 2);
  const quad: "SS" | "SR" | "RS" | "RR" =
    quadPart === "SR" || quadPart === "RS" || quadPart === "RR" ? quadPart : "SS";

  const letter = clean.charAt(2) || "A";
  const letterCode = letter.charCodeAt(0);
  const letterIndex = Math.max(0, Math.min(25, letterCode - 65));

  const numMatch = clean.match(/\d+/);
  const serial = numMatch ? parseInt(numMatch[0], 10) : letterIndex + 1;
  const seed = (serial - 1) % 100;

  const isOrnate = letter >= "M";
  const densityLevel = isOrnate ? Math.min(12, letterIndex - 11) : letterIndex + 1;

  let archetype: ArchetypeType;
  if (letterIndex <= 4) archetype = "grunt";
  else if (letterIndex <= 9) archetype = "heavy";
  else if (letterIndex <= 14) archetype = "speed";
  else if (letterIndex <= 19) archetype = "heroic";
  else archetype = "beast";

  return {
    kitId: clean,
    quad,
    letter,
    serial,
    letterIndex,
    densityLevel,
    isOrnate,
    archetype,
    seed,
    dna: generateKitDNA(clean),
  };
}

/**
 * =========================================================================
 * Shape picker — turns a DNA ShapeId into a forward-facing armor primitive.
 * `d` is the real extrusion depth (z), so nothing is a flat plane any more.
 * =========================================================================
 */
function shp(
  shape: ShapeId,
  mat: MatKey,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  yaw = 0,
): Spec {
  const r = Math.max(0.01, Math.min(w, h) / 2);
  switch (shape) {
    case SHAPE.BOX:
      return B(mat, w, h, d, x, y, z, 0, yaw, 0);
    case SHAPE.HEX:
      return C(mat, r, r, d, x, y, z, Math.PI / 2, yaw, 0, 6);
    case SHAPE.CYL:
      return C(mat, r, r * 0.94, d, x, y, z, Math.PI / 2, yaw, 0, 16);
    case SHAPE.TRAP:
      return Trap(mat, w * 0.76, w, h, x, y, z, 0, yaw, 0, d);
    case SHAPE.DOME:
      return Sp(mat, Math.max(w, h, d) / 2, x, y, z + d * 0.1, 16);
    case SHAPE.CONE:
      return N(mat, Math.max(0.004, w * 0.12), w / 2, Math.max(h, d), x, y, z, -Math.PI / 2, 0, yaw);
    case SHAPE.OCTA:
      return Octa(mat, Math.max(w, h) / 2, x, y, z);
    case SHAPE.WEDGE:
      return Wedge(mat, w, h, d, x, y, z, 0, yaw, 0);
    default:
      return B(mat, w, h, d, x, y, z, 0, yaw, 0);
  }
}

/**
 * =========================================================================
 * Part-2 decoration bonded to the Part-1 shell.
 *
 * Feedback pass:
 *   - the "same-morpheme stepped stack" is now ONE composition out of five
 *     (~20% of kits) instead of the default — the rest get a single hero
 *     panel, a flush rib set, an asymmetric plate, or a minimal node.
 *   - every element is seated so its back face is embedded in the shell
 *     front (lz < shell front): Part 2 is always flush on Part 1, never
 *     floating in front of it.
 *   - cone/dome accents are remapped to a panel family here so body
 *     armour stays plate-like (the pointy shapes live on the visor/crest).
 * =========================================================================
 */
function layeredAccents(
  dna: KitDNA,
  cx: number,
  cy: number,
  cz: number,
  w: number,
  h: number,
  baseDepth: number,
  mats: MatKey[] = ["sec", "trim"],
): Spec[] {
  const out: Spec[] = [];
  const front = cz + baseDepth * 0.5;
  const m0 = mats[0]!;
  const m1 = mats[Math.min(1, mats.length - 1)]!;
  const panel =
    dna.accentShape === SHAPE.CONE || dna.accentShape === SHAPE.DOME
      ? SHAPE.TRAP
      : dna.accentShape;
  const mode = dna.hash % 10;

  if (mode < 2) {
    // ~20% — the stepped crest: big under-plate, one clearly smaller cap.
    const aw = w * 0.64;
    const ah = h * 0.66;
    const ad0 = Math.max(0.02, baseDepth * 0.4);
    out.push(shp(panel, m0, aw, ah, ad0, cx, cy, front - ad0 * 0.4, 0));
    const ad1 = Math.max(0.016, baseDepth * 0.26);
    out.push(shp(panel, m1, aw * 0.5, ah * 0.5, ad1, cx, cy + h * 0.06, front - ad0 * 0.4 + ad0 * 0.35, dna.twist * 0.7));
  } else if (mode < 6) {
    // ~40% — a single asymmetric hero panel embedded in the shell face.
    const aw = w * 0.6;
    const ah = h * 0.74;
    const ad = Math.max(0.02, baseDepth * 0.44);
    out.push(shp(panel, m0, aw, ah, ad, cx + dna.splay * w * 0.18, cy + h * 0.02, front - ad * 0.45, dna.twist * 0.5));
  } else if (mode < 8) {
    // ~20% — a flush rib / louver set, sitting right on the surface.
    const n = 2 + ((dna.hash >> 4) % 3);
    for (let i = 0; i < n; i++) {
      const gy = (i - (n - 1) / 2) * h * 0.17;
      out.push(B(m0, w * 0.52, Math.max(0.01, h * 0.08), Math.max(0.014, baseDepth * 0.2), cx, cy + gy, front - baseDepth * 0.06, 0, 0, dna.twist * 0.2));
    }
  } else {
    // ~20% — minimal: one small node hugging the surface.
    out.push(shp(panel, m0, w * 0.3, h * 0.3, Math.max(0.016, baseDepth * 0.3), cx + dna.splay * w * 0.3, cy - h * 0.12, front - baseDepth * 0.08, 0));
  }
  return out;
}

/**
 * Real front-to-back depth for a part's main shell. `unit` is a realistic
 * nominal depth in metres; DNA nudges it 0.8×..1.6× (Master Prompt 8.0 묘수 2)
 * so nothing renders as a flat plane, and nothing flies off the joint either.
 */
function shellDepth(dna: KitDNA, unit: number): number {
  return unit * (0.8 + (dna.zVolume - 1.5) * 0.32);
}

/**
 * =========================================================================
 * 1. SHOULDER — Base plate + DNA main pauldron + layered cross-combined panels
 * =========================================================================
 */
export function buildLayeredShoulder(kit: ParsedKit, t: number, s: number, detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { archetype, dna } = kit;

  // LAYER 1: BASE — thin sub-frame plate + hinge axle
  out.push(
    B("dark", 0.16 * t, 0.035 * t, 0.16, 0.03, -0.075, 0),
    C("metal", 0.036, 0.036, 0.14, 0, -0.065, 0, 0, 0, Math.PI / 2, Math.max(6, s)),
    C("metal", 0.012, 0.012, 0.08, -0.02, -0.04, 0.045, 0.28, 0, 0, 6),
  );

  // LAYER 2: MAIN — DNA base shape, real volumetric depth
  const mainX = 0.035;
  const mainY = 0.025;
  const wide = archetype === "heavy" || archetype === "beast" ? 0.28 : archetype === "speed" ? 0.2 : 0.24;
  const tall = archetype === "speed" ? 0.16 : archetype === "heavy" ? 0.24 : 0.2;
  const mainD = shellDepth(dna, 0.12);
  out.push(shp(dna.baseShape, "prim", wide * t, tall * t, mainD, mainX, mainY, 0, 0));
  // taper cap so the pauldron isn't a slab
  out.push(
    Trap("prim", wide * t * dna.taper * 0.7, wide * t * 0.9, 0.05 * t, mainX, mainY + tall * t * 0.42, mainD * 0.1, 0, 0, 0, mainD * 0.8),
  );

  // LAYER 3: ACCENT — layered cross-combined panels stepped forward
  out.push(...layeredAccents(dna, mainX, mainY, 0, wide * t * 0.82, tall * t * 0.9, mainD));

  // LAYER 4: HARDWARE — lateral thruster / louver + telemetry
  if (detailLevel >= 12 || archetype === "speed" || archetype === "heroic") {
    out.push(
      C("metal", 0.026, 0.038, 0.045, mainX + wide * t * 0.5, mainY, 0, 0, 0, -Math.PI / 2, 8),
      C("glow", 0.018, 0.028, 0.02, mainX + wide * t * 0.55, mainY, 0, 0, 0, -Math.PI / 2, 8),
    );
  } else {
    out.push(B("metal", 0.016, 0.07 * t, 0.12, mainX + wide * t * 0.46, mainY - 0.01, 0));
  }
  out.push(C("glow", 0.008, 0.008, 0.05, mainX + 0.03, mainY + 0.07, mainD * 0.5, 0, 0, Math.PI / 2, 6));

  return out;
}

/**
 * =========================================================================
 * 2. SHIN — tapered greave, hard clearance above the foot, layered panels
 *
 *  - bottom edge terminates at y = -0.11 (0.07 to ankle, 0.13 to foot)
 *  - lower third tapers inward
 *  - accent layers never extend below y = -0.06
 * =========================================================================
 */
export function buildLayeredShin(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { archetype, dna } = kit;

  // LAYER 1: BASE — internal chassis spine + shock pistons
  out.push(
    B("dark", 0.08 * t, 0.22 * t, 0.09, 0, 0.02, -0.02),
    C("metal", 0.012, 0.012, 0.2 * t, -0.024, 0, -0.01, 0, 0, 0, 8),
    C("metal", 0.012, 0.012, 0.2 * t, 0.024, 0, -0.01, 0, 0, 0, 8),
  );

  // LAYER 2: MAIN — tapered greave. Flared for heavy, pinched for speed/beast.
  const topW = archetype === "heavy" ? 0.15 : 0.15;
  const botW =
    archetype === "heavy" ? 0.185 : archetype === "speed" || archetype === "beast" ? 0.085 : 0.1;
  const mainD = shellDepth(dna, 0.12);
  out.push(
    Trap("prim", topW * t, botW * t, 0.24 * t, 0, 0.01, 0.02, -0.12, 0, 0, mainD),
  );
  // front tibial deflector strip
  out.push(B("trim", 0.026 * t, 0.14 * t, 0.02, 0, -0.01, 0.02 + mainD * 0.55, -0.12, 0, 0));

  // LAYER 3: ACCENT — knee striker seated ON the greave top-front, plus the
  // shared Part-2 decoration (which is mostly a single hero panel now).
  const greaveFront = 0.02 + mainD / 2;
  const kneeShape = archetype === "beast" ? SHAPE.CONE : dna.accentShape;
  out.push(shp(kneeShape, "sec", 0.1 * t, 0.11 * t, mainD * 0.55, 0, 0.115, greaveFront - mainD * 0.25, 0.25));
  out.push(...layeredAccents(dna, 0, 0.0, 0.02, topW * t * 0.9, 0.16 * t, mainD, ["sec", "trim"]));

  // LAYER 3C: outer calf fin — ROOTED inside the greave side (x within the
  // shell), sweeping out and back. Never floating off the leg.
  const rootX = 0.045 * t;
  if (archetype === "speed" || archetype === "heroic") {
    out.push(
      Wedge("trim", 0.11, 0.12 * t, 0.05, rootX + 0.03, 0.0, -0.01, 0.12, 0, -0.35),
      C("glow", 0.012, 0.02, 0.03, rootX + 0.07, -0.03, -0.03, -0.35, 0, 0, 8),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("dark", 0.055, 0.14 * t, 0.08, rootX + 0.02, -0.01, -0.01, 0, 0, -0.12),
      C("glow", 0.016, 0.016, 0.02, rootX + 0.045, -0.06, -0.02, 0, 0, 0, 8),
    );
  } else {
    out.push(B("metal", 0.05, 0.1 * t, 0.06, rootX + 0.015, -0.02, -0.005, 0, 0, -0.1));
  }

  // LAYER 4: ankle actuator (open gap under the armor — no foot clipping)
  out.push(C("metal", 0.014, 0.014, 0.06, 0, -0.09, 0, 0, 0, Math.PI / 2, 6));

  return out;
}

/**
 * =========================================================================
 * 3. FOOT — low-profile instep kept below y = 0.035 for total shin clearance
 * =========================================================================
 */
export function buildLayeredFoot(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { archetype, dna } = kit;

  // Layer 1: ground tread sole
  out.push(B("dark", 0.12 * t, 0.022 * t, 0.24, 0, -0.02, 0.02));

  // Layer 2: sloped instep bridge
  if (archetype === "speed") {
    out.push(Wedge("prim", 0.095 * t, 0.038, 0.17, 0, 0.01, 0.04, 0.28, 0, 0));
  } else if (archetype === "heavy") {
    out.push(B("prim", 0.14 * t, 0.032, 0.19, 0, 0.01, 0.03));
  } else if (archetype === "beast") {
    out.push(
      Cowl("prim", 0.11 * t, 0.038, 0.17, 0, 0.01, 0.04, 0.25, 0, 0),
      N("trim", 0.005, 0.022, 0.07, 0, -0.01, 0.15, Math.PI / 2, 0, 0),
    );
  } else {
    out.push(Trap("prim", 0.09 * t, 0.13 * t, 0.15, 0, 0.01, 0.04, 0.2, 0, 0, 0.11));
  }

  // Layer 3: articulated ankle collar + heel spur + one DNA accent
  out.push(
    Trap("sec", 0.085 * t, 0.105 * t, 0.032, 0, 0.032, -0.04, -0.22, 0, 0, 0.09),
    B("metal", 0.075 * t, 0.028, 0.05, 0, -0.01, -0.1),
  );
  if (dna.accentShape === SHAPE.CONE || archetype === "beast") {
    out.push(N("acc", 0.004, 0.02, 0.09, 0, -0.005, 0.19, Math.PI / 2, 0, 0));
  } else {
    out.push(shp(dna.accentShape, "trim", 0.06 * t, 0.03, 0.05, 0, 0.02, 0.11, dna.twist));
  }

  return out;
}

/**
 * =========================================================================
 * 4. COCKPIT (CHEST HATCH) — heavy volumetric core, cross-combined ducts
 * =========================================================================
 */
export function buildLayeredCockpit(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { dna } = kit;

  // Layer 1: sternum bulkhead
  out.push(B("dark", 0.14 * t, 0.16 * t, 0.09, 0, 0, 0));

  // Layer 2: main hatch cowl — DNA base shape, amplified depth (no paper chests)
  const mainD = shellDepth(dna, 0.14);
  out.push(shp(dna.baseShape, "prim", 0.13 * t, 0.16 * t, mainD, 0, 0.01, 0.02, 0));
  // central wedge mass so the chest reads as sculpted, not a lid
  out.push(Wedge("prim", 0.1 * t, 0.13 * t, mainD * 0.7, 0, 0.02, mainD * 0.5, 0.2, 0, 0));

  // Layer 3: cross-combined vent / latch stack — accent family, stepped out
  out.push(...layeredAccents(dna, 0, 0.0, 0.02, 0.1 * t, 0.13 * t, mainD, ["sec", "metal", "trim"]));
  out.push(
    B("glow", 0.05 * t, 0.015, 0.02, 0, 0.04, 0.04 + mainD * 0.6, 0.2, 0, 0),
    C("metal", 0.008, 0.008, 0.1 * t, 0, -0.04, 0.05, 0, 0, Math.PI / 2, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 5. SKIRT (SIDE ARMOR) — flared plate + layered sub-panels
 * =========================================================================
 */
export function buildLayeredSkirt(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { archetype, dna } = kit;

  out.push(
    B("dark", 0.08 * t, 0.04, 0.12, 0, 0.05, 0),
    C("metal", 0.012, 0.012, 0.12, 0, 0.04, 0, 0, 0, Math.PI / 2, 6),
  );

  const wide = archetype === "heavy" ? 0.15 : archetype === "speed" ? 0.11 : 0.13;
  const tall = archetype === "speed" || archetype === "beast" ? 0.22 : 0.18;
  const mainD = shellDepth(dna, 0.09);
  out.push(shp(dna.baseShape, "prim", wide * t, tall * t, mainD, 0, -0.04, 0, 0));
  out.push(...layeredAccents(dna, 0.02, -0.03, 0, wide * t * 0.75, tall * t * 0.7, mainD, ["sec", "trim"]));
  out.push(C("glow", 0.015, 0.022, 0.04, 0.03, -0.11, -0.03, 0.4, 0, -0.2, 8));

  return out;
}

/**
 * =========================================================================
 * 6. VAMBRACE (FOREARM GAUNTLET) — layered strike shell
 * =========================================================================
 */
export function buildLayeredVambrace(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { dna } = kit;

  out.push(B("dark", 0.1 * t, 0.14 * t, 0.07, 0, 0, 0.02));

  const mainD = shellDepth(dna, 0.08);
  out.push(shp(dna.baseShape, "prim", 0.12 * t, 0.14 * t, mainD, 0, 0, 0.04, 0));
  out.push(...layeredAccents(dna, 0, 0, 0.04, 0.09 * t, 0.11 * t, mainD, ["sec", "metal"]));
  out.push(
    B("metal", 0.03 * t, 0.12 * t, 0.018, 0, 0, 0.05 + mainD * 0.6, 0.1, 0, 0),
    C("glow", 0.007, 0.007, 0.05, 0.03, -0.02, 0.08, 0, 0, 0, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 7. HELM — cranium shell + layered crown/back plates (face left clear)
 * =========================================================================
 */
export function buildLayeredHelm(kit: ParsedKit, t: number, s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { archetype, dna } = kit;

  // Layer 1: skull frame + neck ring
  out.push(
    B("dark", 0.14 * t, 0.15 * t, 0.18, 0, 0, -0.02),
    C("metal", 0.07 * t, 0.07 * t, 0.04, 0, -0.08, 0, 0, 0, 0, s),
  );

  // Layer 2: main helmet cowl (tapered to the jaw)
  if (archetype === "speed") {
    out.push(Cowl("prim", 0.18 * t, 0.19 * t, 0.24, 0, 0.02, -0.02, -0.12, 0, 0));
  } else if (archetype === "heavy") {
    out.push(B("prim", 0.22 * t, 0.2 * t, 0.22, 0, 0.02, -0.01, -0.05, 0, 0));
  } else {
    out.push(Trap("prim", 0.19 * t, 0.22 * t, 0.2 * t, 0, 0.02, -0.01, -0.1, 0, 0, 0.2));
  }

  // Layer 3: a single crown ridge seated ON the cowl top — embedded, not a
  // floating fin. The actual antenna/V-fin crest is its own slot now.
  out.push(
    shp(
      dna.accentShape === SHAPE.CONE || dna.accentShape === SHAPE.DOME ? SHAPE.TRAP : dna.accentShape,
      "sec",
      0.13 * t,
      0.05 * t,
      0.14,
      0,
      0.05,
      -0.005,
      dna.twist * 0.5,
    ),
  );

  // Layer 3b: forehead optic seated on the brow
  out.push(B("glow", 0.08 * t, 0.02, 0.02, 0, 0.04, 0.02 + 0.1 * t, -0.05, 0, 0));

  return out;
}

/**
 * =========================================================================
 * 8. PACK (BACKPACK) — spine housing + layered thruster shrouds
 * =========================================================================
 */
export function buildLayeredPack(kit: ParsedKit, t: number, _s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { dna } = kit;

  out.push(B("dark", 0.18 * t, 0.24 * t, 0.12, 0, 0, -0.08));

  const mainD = shellDepth(dna, 0.16);
  out.push(shp(dna.baseShape, "prim", 0.24 * t, 0.2 * t, mainD, 0, 0.02, -0.12 + mainD * 0.3, 0));
  out.push(...layeredAccents(dna, 0, 0.02, -0.12, 0.2 * t, 0.16 * t, mainD, ["sec", "trim"]));

  out.push(
    C("metal", 0.042, 0.052, 0.06, -0.08 * t, -0.1, -0.16, 0.5, 0, 0, 8),
    C("glow", 0.035, 0.045, 0.02, -0.08 * t, -0.12, -0.18, 0.5, 0, 0, 8),
    C("metal", 0.042, 0.052, 0.06, 0.08 * t, -0.1, -0.16, 0.5, 0, 0, 8),
    C("glow", 0.035, 0.045, 0.02, 0.08 * t, -0.12, -0.18, 0.5, 0, 0, 8),
    Wedge("trim", 0.025, 0.14, 0.26, -0.16 * t, 0.08, -0.1, 0.3, -0.25, 0),
    Wedge("trim", 0.025, 0.14, 0.26, 0.16 * t, 0.08, -0.1, 0.3, 0.25, 0),
  );

  return out;
}

/**
 * Procedural Topological Factory returning multi-layered assembly specs.
 */
export function createGeometryByID(
  kitId: string,
  slotId: string,
  _isLeft: boolean,
  r: Recipe,
): Spec[] {
  const kit = parseKitCode(kitId);
  const b = base(slotId);
  const t = r.thick;
  const s = r.segs;
  const detailLevel = Math.max(0, Math.min(25, (kit.kitId.charCodeAt(2) || 65) - 65));

  switch (b) {
    case "helm":
      return buildLayeredHelm(kit, t, s, detailLevel);
    case "shoulder":
      return buildLayeredShoulder(kit, t, s, detailLevel);
    case "shin":
      return buildLayeredShin(kit, t, s, detailLevel);
    case "foot":
      return buildLayeredFoot(kit, t, s, detailLevel);
    case "cockpit":
      return buildLayeredCockpit(kit, t, s, detailLevel);
    case "skirt":
      return buildLayeredSkirt(kit, t, s, detailLevel);
    case "vambrace":
      return buildLayeredVambrace(kit, t, s, detailLevel);
    case "pack":
      return buildLayeredPack(kit, t, s, detailLevel);
    default:
      return [Trap("prim", 0.12 * t, 0.14 * t, 0.12, 0, 0, 0, 0, 0, 0, 0.12)];
  }
}
