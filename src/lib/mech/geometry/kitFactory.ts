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
 * Layered accent stack (Master Prompt 8.0 —묘수 1 & 3, revised).
 *
 * A pyramidal Part-2 decoration sitting ON the Part-1 shell — never a pile of
 * same-size plates and never 3+ tiers stacked at one spot:
 *   - the plate underneath is always clearly the largest, each successive
 *     plate is markedly smaller (≈0.6×), so it reads as a stepped crest;
 *   - only 2 tiers by default (3 only for the busiest kits), hugging the
 *     shell face with a small proud step — cohesive, not floating;
 *   - the accent primitive is the DNA *accent* family (≠ base = cross-combined)
 *     and only the top plate takes any twist.
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
  const tiers = dna.layerCount >= 5 ? 3 : 2;
  const front = cz + baseDepth * 0.5;
  const shrink = [0.68, 0.42, 0.24];
  let lz = front;
  for (let i = 0; i < tiers; i++) {
    const lw = w * shrink[i]!;
    const lh = h * shrink[i]!;
    const ld = Math.max(0.016, baseDepth * (0.34 - i * 0.08));
    lz += i === 0 ? baseDepth * 0.08 : Math.max(0.012, ld * 0.7);
    const ly = cy + i * h * 0.045;
    const yaw = i === tiers - 1 ? dna.twist * 0.8 : 0;
    out.push(shp(dna.accentShape, mats[Math.min(i, mats.length - 1)]!, lw, lh, ld, cx, ly, lz, yaw));
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

  // LAYER 3: ACCENT — knee striker (Part 2) + one pyramidal mid-calf crest.
  // Everything stays above y = -0.05 so nothing rides the ankle.
  const kneeShape = archetype === "beast" ? SHAPE.CONE : dna.accentShape;
  out.push(shp(kneeShape, "sec", 0.11 * t, 0.12 * t, mainD * 0.6, 0, 0.135, 0.055, 0.4));
  // big under-plate then a smaller proud plate — a stepped crest, not a stack
  out.push(
    shp(dna.accentShape, "sec", topW * t * 0.66, 0.13 * t, mainD * 0.34, 0, 0.03, 0.02 + mainD * 0.55, 0),
    shp(dna.accentShape, "trim", topW * t * 0.4, 0.08 * t, mainD * 0.24, 0, 0.05, 0.02 + mainD * 0.8, dna.twist * 0.8),
  );

  // LAYER 3C: outer calf booster / stabilizer fin
  const flankX = 0.09 * t;
  if (archetype === "speed" || archetype === "heroic") {
    out.push(
      Wedge("trim", 0.015, 0.13 * t, 0.11, flankX, -0.01, -0.05, 0.2, 0, 0),
      C("glow", 0.015, 0.022, 0.03, flankX + 0.01, -0.05, -0.06, -0.4, 0, 0, 8),
    );
  } else if (archetype === "heavy") {
    out.push(
      C("dark", 0.03, 0.03, 0.11 * t, flankX + 0.01, -0.02, -0.04, -0.3, 0, 0, 8),
      C("glow", 0.02, 0.02, 0.02, flankX + 0.01, -0.065, -0.055, -0.3, 0, 0, 8),
    );
  } else {
    out.push(B("metal", 0.018, 0.11 * t, 0.07, flankX, -0.02, -0.04));
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

  // Layer 3: a stepped crown ridge UP and BACK — never over the visor.
  // Big base ridge, one smaller cap ridge. No same-size stack.
  out.push(
    shp(dna.accentShape, "sec", 0.15 * t, 0.055 * t, 0.13, 0, 0.055, -0.03, 0),
    shp(dna.accentShape, "trim", 0.09 * t, 0.04 * t, 0.1, 0, 0.085, -0.06, dna.twist * 0.7),
  );

  // Layer 3b: forehead crest + optic
  out.push(
    Trap("sec", 0.06 * t, 0.09 * t, 0.06, 0, 0.1, 0.07, 0.2, 0, 0, 0.05),
    B("glow", 0.08 * t, 0.022, 0.02, 0, 0.04, 0.095, -0.05, 0, 0),
  );

  if (archetype === "heroic") {
    out.push(
      Wedge("trim", 0.012, 0.14, 0.04, -0.06 * t, 0.16, 0.06, 0.2, 0.3, 0.45),
      Wedge("trim", 0.012, 0.14, 0.04, 0.06 * t, 0.16, 0.06, 0.2, -0.3, -0.45),
    );
  } else if (archetype === "beast") {
    out.push(
      N("trim", 0.004, 0.025, 0.15, -0.07 * t, 0.14, 0.04, 0.2, 0.3, 0.5),
      N("trim", 0.004, 0.025, 0.15, 0.07 * t, 0.14, 0.04, 0.2, -0.3, -0.5),
    );
  } else if (archetype === "grunt") {
    out.push(C("metal", 0.005, 0.005, 0.12, 0.07 * t, 0.12, 0, 0.1, 0, 0, 6));
  } else {
    out.push(Wedge("trim", 0.012, 0.09, 0.16, 0, 0.14, -0.06, -0.35, 0, 0));
  }

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
