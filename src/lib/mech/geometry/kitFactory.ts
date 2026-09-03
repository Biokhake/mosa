import type { Recipe } from "../recipes";
import type { MatKey } from "../palette";
import type { Spec } from "./types";
import {
  B,
  C,
  N,
  Wedge,
  Trap,
  Cowl,
  Octa,
  Capsule,
  base,
  makeRotaryServo,
  makeServoActuator,
  makeCoolingFins,
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
      return C(mat, r, r * 0.94, d, x, y, z, Math.PI / 2, yaw, 0, 20);
    case SHAPE.TRAP:
      return Trap(mat, w * 0.76, w, h, x, y, z, 0, yaw, 0, d);
    case SHAPE.DOME:
      return { t: "hemi", m: mat, s: [Math.max(w, h) / 2, 0, 0], p: [x, y, z - d * 0.2], r: [-0.15, yaw, 0] };
    case SHAPE.CONE:
      return N(mat, Math.max(0.004, w * 0.12), w / 2, Math.max(h * 0.7, d), x, y, z, -Math.PI / 2, 0, yaw);
    case SHAPE.OCTA:
      return Octa(mat, Math.max(w, h) / 2, x, y, z);
    case SHAPE.WEDGE:
      return Wedge(mat, w, h, d, x, y, z, 0, yaw, 0);
    case SHAPE.CAPSULE:
      return { t: "capsule", m: mat, s: [Math.min(w, h) * 0.5, Math.max(w, h) * 0.7, 0], p: [x, y, z], r: [0, yaw, w > h ? Math.PI / 2 : 0] };
    default:
      return B(mat, w, h, d, x, y, z, 0, yaw, 0);
  }
}

interface Face {
  w: number;
  h: number;
  front: number;
  back: number;
  cx: number;
  cy: number;
}

/** The front face of a shell centred at (cx,cy,cz) with the given depth. */
function faceOf(cx: number, cy: number, cz: number, w: number, h: number, depth: number): Face {
  return { w, h, front: cz + depth * 0.5, back: cz - depth * 0.5, cx, cy };
}

/**
 * Bond a Part-2 accent to a Part-1 face so it reads as one plate even with
 * edge lines on:
 *   - clamped to a fraction of the face so its outline never crosses the shell
 *     edge (rounds are pulled in harder — a circle can't hug a square corner);
 *   - offset kept inside the leftover margin, so nothing overhangs;
 *   - seated with its back embedded, ~25% of its depth proud, and never poking
 *     through the shell back;
 *   - yaw clamped so an angled panel can't scissor across the shell edges.
 */
function seatAccent(
  shape: ShapeId,
  mat: MatKey,
  face: Face,
  pw: number,
  ph: number,
  pd: number,
  ox = 0,
  oy = 0,
  yaw = 0,
): Spec {
  const round = shape === SHAPE.CYL || shape === SHAPE.HEX || shape === SHAPE.DOME || shape === SHAPE.OCTA;
  const cap = round ? 0.6 : 0.8;
  pw = Math.min(pw, face.w * cap);
  ph = Math.min(ph, face.h * cap);
  pd = Math.max(0.014, Math.min(pd, (face.front - face.back) * 0.72));
  const mx = Math.max(0, (face.w - pw) * 0.5);
  const my = Math.max(0, (face.h - ph) * 0.5);
  ox = Math.max(-mx, Math.min(mx, ox));
  oy = Math.max(-my, Math.min(my, oy));
  let lz = face.front - pd * 0.75;
  const minLz = face.back + pd * 0.5 + 0.006;
  if (lz < minLz) lz = minLz;
  return shp(shape, mat, pw, ph, pd, face.cx + ox, face.cy + oy, lz, Math.max(-0.2, Math.min(0.2, yaw)));
}

/**
 * A nozzle / vent sunk into a flush recessed housing so nothing pierces a
 * panel edge. `(x,y,z)` is the housing centre, already sitting ON the shell.
 */
function socketPort(
  mat: MatKey,
  x: number,
  y: number,
  z: number,
  rad: number,
  depth: number,
  rx = 0,
  ry = 0,
  rz = 0,
  glow = true,
): Spec[] {
  const seg = 10;
  const o: Spec[] = [
    C("dark", rad * 1.55, rad * 1.55, depth * 0.6, x, y, z, rx, ry, rz, seg),
    C(mat, rad, rad * 0.82, depth, x, y, z, rx, ry, rz, seg),
  ];
  if (glow) o.push(C("glow", rad * 0.5, rad * 0.5, depth * 0.62, x, y, z, rx, ry, rz, seg));
  return o;
}

/**
 * Part-2 decoration bonded to the Part-1 shell (feedback pass 3).
 *   - one accent composition per part, always seated via seatAccent, so with
 *     edges on nothing scissors, overhangs or floats;
 *   - stepped stack kept to ~20% of kits; the rest get a single panel, a
 *     recessed grille, or a minimal stud.
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
  const face = faceOf(cx, cy, cz, w, h, baseDepth);
  const m0 = mats[0]!;
  const m1 = mats[Math.min(1, mats.length - 1)]!;
  const panel =
    dna.accentShape === SHAPE.CONE || dna.accentShape === SHAPE.DOME ? SHAPE.TRAP : dna.accentShape;
  const mode = dna.hash % 10;

  if (mode < 2) {
    // ~20% — stepped crest: big under-plate + ONE clearly smaller concentric cap
    out.push(seatAccent(panel, m0, face, w * 0.62, h * 0.66, baseDepth * 0.34, 0, 0, 0));
    out.push(
      seatAccent(panel, m1, { ...face, front: face.front + baseDepth * 0.12 }, w * 0.34, h * 0.34, baseDepth * 0.24, 0, h * 0.04, dna.twist * 0.35),
    );
  } else if (mode < 7) {
    // ~50% — one hero panel, gently offset
    out.push(seatAccent(panel, m0, face, w * 0.6, h * 0.72, baseDepth * 0.38, dna.splay * w * 0.1, h * 0.02, dna.twist * 0.25));
  } else if (mode < 9) {
    // ~20% — one shallow recessed grille: dark pocket + a single slim rib
    out.push(seatAccent(SHAPE.BOX, "dark", face, w * 0.46, h * 0.4, baseDepth * 0.18, 0, 0, 0));
    out.push(
      seatAccent(SHAPE.BOX, m0, { ...face, front: face.front + baseDepth * 0.03 }, w * 0.38, h * 0.09, baseDepth * 0.12, 0, 0, 0),
    );
  } else {
    // ~10% — a single minimal stud
    out.push(seatAccent(panel, m0, face, w * 0.26, h * 0.26, baseDepth * 0.26, dna.splay * w * 0.22, -h * 0.1, 0));
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

  // LAYER 2: MAIN — DNA base shape, real volumetric depth. A shallow bevel
  // block on top instead of a splayed cap.
  const mainX = 0.035;
  const mainY = 0.025;
  const wide = archetype === "heavy" || archetype === "beast" ? 0.26 : archetype === "speed" ? 0.19 : 0.23;
  const tall = archetype === "speed" ? 0.16 : archetype === "heavy" ? 0.23 : 0.2;
  const mainD = shellDepth(dna, 0.12);
  const halfW = wide * t * 0.5;
  const halfH = tall * t * 0.5;
  const boxy =
    dna.baseShape === SHAPE.BOX || dna.baseShape === SHAPE.TRAP || dna.baseShape === SHAPE.WEDGE;
  out.push(shp(dna.baseShape, "prim", wide * t, tall * t, mainD, mainX, mainY, 0, 0));
  // a matching top cap — a small bevel for boxy shells, skipped for round ones
  if (boxy) {
    out.push(B("prim", wide * t * 0.78, 0.045 * t, mainD * 0.78, mainX, mainY + halfH - 0.012, 0));
  }

  // LAYER 3: ACCENT — one seated Part-2 composition on the front face
  out.push(...layeredAccents(dna, mainX, mainY, 0, wide * t, tall * t, mainD));

  // LAYER 4: HARDWARE — one socketed vernier for the faster frames, sunk into
  // the +X face so it never pierces a panel edge. Telemetry is a flush line.
  if (detailLevel >= 12 || archetype === "speed" || archetype === "heroic") {
    out.push(
      ...socketPort("metal", mainX + halfW - 0.03, mainY, mainD * 0.12, 0.02, 0.045, 0, 0, -Math.PI / 2),
    );
  }
  if (boxy) {
    out.push(B("glow", 0.05, 0.01, 0.012, mainX, mainY + halfH * 0.5, mainD * 0.5 - 0.004));
  }

  return out;
}

/**
 * Band-legal greave shell for the shin.
 *   SS  sharp trapezoid / wedge
 *   SR  filleted box (buildPart auto-rounds SR box corners)
 *   RS  curved cylinder
 *   RR  curved capsule
 * DNA `profile` sets taper-in / flare-out / straight / front-wedge.
 */
function greaveShell(
  kit: ParsedKit,
  w: number,
  h: number,
  d: number,
  cy: number,
  mat: MatKey,
  seg: number,
): Spec[] {
  const { quad, dna } = kit;
  const profile = dna.hash % 4;
  const pitch = -0.1;

  if (quad === "SS") {
    if (profile === 3) return [Wedge(mat, w, h, d * 1.2, 0, cy, d * 0.14, pitch, 0, 0)];
    const wt = profile === 0 ? w * 0.62 : profile === 1 ? w : w * 0.9;
    const wb = profile === 0 ? w : profile === 1 ? w * 0.62 : w * 0.98;
    return [Trap(mat, wt, wb, h, 0, cy, 0, pitch, 0, 0, d)];
  }
  if (quad === "SR") {
    const lo = profile === 0 ? 0.76 : profile === 1 ? 1.16 : 0.95;
    return [
      B(mat, w, h * 0.6, d, 0, cy + h * 0.2, 0, pitch, 0, 0),
      B(mat, w * lo, h * 0.46, d * 0.95, 0, cy - h * 0.26, 0.004, pitch, 0, 0),
    ];
  }
  // RS / RR — curved
  if (quad === "RR") {
    return [Capsule(mat, w * 0.5, h * 0.62, 0, cy, 0.01, pitch, 0, 0, Math.max(16, seg))];
  }
  const rt = profile === 1 ? w * 0.4 : w * 0.52;
  const rb = profile === 0 ? w * 0.34 : profile === 1 ? w * 0.58 : w * 0.48;
  return [C(mat, rt, rb, h, 0, cy, 0.012, pitch, 0, 0, Math.max(12, seg))];
}

/**
 * =========================================================================
 * 2. SHIN — the LEG mirror of the FOREARM: dual structural rails, an ankle
 *    rotary drum, a front flexor actuator, and an A~L / M~Z armour cowling
 *    with the same hardpoint-rail + cooling-fin morphemes. Greave shape
 *    follows the band; DNA drives the profile and calf treatment.
 *    Bottom terminates above the ankle so the foot never clips.
 * =========================================================================
 */
export function buildLayeredShin(kit: ParsedKit, t: number, s: number, _detailLevel: number): Spec[] {
  const out: Spec[] = [];
  const { quad, dna, isOrnate } = kit;
  const seg = Math.max(8, s);
  const len = 0.25 * t;
  const round = quad === "RS" || quad === "RR";

  // --- INNER FRAME — same morphemes as the forearm ---
  const railSpan = 0.03 * t;
  out.push(
    C("dark", 0.019 * t, 0.019 * t, len * 0.92, railSpan, -0.01, -0.025, 0, 0, 0, seg),
    C("dark", 0.019 * t, 0.019 * t, len * 0.92, -railSpan, -0.01, -0.025, 0, 0, 0, seg),
  );
  out.push(...makeRotaryServo("joint", "metal", 0, -len * 0.48, 0, 0.038 * t, 0.05 * t, 0, 0, 0, s));
  out.push(...makeServoActuator("dark", "metal", 0, 0, 0.03 * t, len * 0.8, 0.015 * t, 0, 0, 0, seg));

  // --- GREAVE SHELL — band shape + DNA profile ---
  const gw = 0.15 * t;
  const gh = len * 1.02;
  const gd = shellDepth(dna, 0.12);
  out.push(...greaveShell(kit, gw, gh, gd, 0, "prim", seg));

  // --- ARMOUR COWLING ---
  // 1. main Part-2 shell layer — a clearly raised plate on the greave front.
  const shellFront = round ? gw * 0.44 : gd * 0.5;
  let fz: number;
  if (round) {
    // a raised longitudinal shin-guard strake following the curve
    out.push(C("sec", gw * 0.16, gw * 0.14, gh * 0.72, 0, gh * 0.02, shellFront - 0.006, -0.1, 0, 0, seg));
    fz = shellFront + gw * 0.06;
  } else {
    const secD = Math.max(0.022, gd * 0.42);
    out.push(
      shp(quad === "SS" ? SHAPE.TRAP : SHAPE.BOX, "sec", gw * 0.82, gh * 0.62, secD, 0, gh * 0.02, shellFront - secD * 0.28, 0),
    );
    fz = shellFront + secD * 0.22 + 0.004;
  }

  // 2. ONE DNA-selected front detail — the Picatinny rail is now just one of
  //    four, offset off-centre so nothing reads as a fixed centre bar cross.
  const detailMode = (dna.hash >>> 6) % 4;
  if (detailMode === 0) {
    const rx = gw * 0.22;
    out.push(
      B("dark", 0.022 * t, gh * 0.36, 0.014, rx, -gh * 0.02, fz),
      B("metal", 0.026 * t, 0.01, 0.016, rx, gh * 0.1, fz),
      B("metal", 0.026 * t, 0.01, 0.016, rx, -gh * 0.04, fz),
      B("metal", 0.026 * t, 0.01, 0.016, rx, -gh * 0.18, fz),
    );
  } else if (detailMode === 1) {
    out.push(B("acc", gw * 0.52, 0.024 * t, gd * 0.3, 0, gh * 0.04, fz, 0, 0, 0.42));
  } else if (detailMode === 2) {
    // one angled deflector scoop, offset — not a centred stack
    out.push(
      Wedge("acc", gw * 0.5, gh * 0.34, gd * 0.34, -gw * 0.12, gh * 0.02, fz - gd * 0.08, -0.1, 0, 0.16),
      B("dark", gw * 0.24, gh * 0.05, gd * 0.2, gw * 0.18, gh * 0.16, fz - gd * 0.04),
    );
  } else {
    out.push(
      Trap("trim", gw * 0.42, gw * 0.62, gh * 0.15, 0, gh * 0.24, fz - gd * 0.04, -0.1, 0, 0, gd * 0.22),
    );
    if (isOrnate) {
      out.push(...makeCoolingFins("metal", gw * 0.44, 0.038, 0.012, 0, -gh * 0.24, fz - 0.01, 3, "y"));
    }
  }

  // --- KNEE STRIKER — band-shaped, seated on the greave top-front ---
  const kneeShape = quad === "SS" ? SHAPE.WEDGE : quad === "SR" ? SHAPE.BOX : SHAPE.CYL;
  const kFace = faceOf(0, gh * 0.42, 0, gw * 0.85, gh * 0.26, gd);
  out.push(
    seatAccent(kneeShape, "sec", kFace, 0.088 * t, 0.07 * t, gd * 0.42, 0, 0, quad === "SS" ? 0.12 : 0),
  );

  // --- CALF TREATMENT — DNA-selected, rooted or socketed (one shape only) ---
  const calf = (dna.hash >>> 3) % 3;
  if (calf === 0) {
    out.push(...socketPort("dark", 0, -gh * 0.12, -gd * 0.42, 0.02, 0.045, -0.3, 0, 0));
  } else if (calf === 1) {
    if (round) out.push(C("trim", 0.028, 0.02, gd * 0.55, gw * 0.44, -gh * 0.02, 0, Math.PI / 2, 0, 0, seg));
    else out.push(Wedge("trim", 0.035, gh * 0.32, gd * 0.5, gw * 0.42, -gh * 0.02, 0, 0, 0, -0.1));
  } else {
    // a single recessed side scoop
    out.push(B("dark", 0.016 * t, gh * 0.22, gd * 0.34, gw * 0.44, 0, 0, 0, 0, -0.12));
  }

  // --- ANKLE JOINT clearance actuator ---
  out.push(C("metal", 0.013, 0.013, 0.05 * t, 0, -len * 0.42, 0, 0, 0, Math.PI / 2, 6));

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
  // toe accent — a slim seated cap on the instep, or a claw for beasts
  if (archetype === "beast") {
    out.push(N("acc", 0.004, 0.018, 0.07, 0, -0.006, 0.15, Math.PI / 2, 0, 0));
  } else {
    const toeShape =
      dna.accentShape === SHAPE.CONE || dna.accentShape === SHAPE.DOME ? SHAPE.BOX : dna.accentShape;
    out.push(shp(toeShape, "trim", 0.06 * t, 0.026, 0.04, 0, 0.018, 0.085, 0));
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
  const cw = 0.14 * t;
  const ch = 0.16 * t;
  out.push(shp(dna.baseShape, "prim", cw, ch, mainD, 0, 0.01, 0.02, 0));
  // central sculpted mass, seated on the hatch front
  out.push(
    Wedge("prim", cw * 0.62, ch * 0.7, mainD * 0.5, 0, 0.02, 0.02 + mainD * 0.3, 0.16, 0, 0),
  );

  // Layer 3: the shared Part-2 composition + a flush intake line + latch studs
  out.push(...layeredAccents(dna, 0, 0.01, 0.02, cw, ch, mainD, ["sec", "metal", "trim"]));
  const front = 0.02 + mainD * 0.5;
  out.push(
    B("glow", cw * 0.4, 0.012, 0.012, 0, 0.045, front - 0.004, 0.16, 0, 0),
    B("metal", 0.014, 0.014, mainD * 0.7, -cw * 0.42, -0.03, 0.02),
    B("metal", 0.014, 0.014, mainD * 0.7, cw * 0.42, -0.03, 0.02),
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
  const sh = tall * t;
  out.push(shp(dna.baseShape, "prim", wide * t, sh, mainD, 0, -0.04, 0, 0));
  out.push(...layeredAccents(dna, 0, -0.04, 0, wide * t, sh, mainD, ["sec", "trim"]));
  // attitude-control vernier socketed into the skirt bottom edge, facing down
  out.push(...socketPort("dark", 0, -0.04 - sh * 0.42, mainD * 0.1, 0.016, 0.038, Math.PI, 0, 0));

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
  const vw = 0.12 * t;
  const vh = 0.14 * t;
  out.push(shp(dna.baseShape, "prim", vw, vh, mainD, 0, 0, 0.04, 0));
  out.push(...layeredAccents(dna, 0, 0, 0.04, vw, vh, mainD, ["sec", "metal"]));
  // equipment hardpoint rail — a flush recessed channel with a slim rib
  const front = 0.04 + mainD * 0.5;
  out.push(
    B("dark", 0.028 * t, vh * 0.8, mainD * 0.3, 0, 0, front - mainD * 0.12),
    B("metal", 0.02 * t, vh * 0.7, 0.012, 0, 0, front - 0.004),
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

  const bw = 0.2 * t;
  const bh = 0.24 * t;
  out.push(B("dark", 0.18 * t, bh, 0.12, 0, 0, -0.08));

  const mainD = shellDepth(dna, 0.16);
  const czc = -0.14 + mainD * 0.5;
  out.push(shp(dna.baseShape, "prim", bw, 0.2 * t, mainD, 0, 0.02, czc, 0));
  // rear decoration — one seated Part-2 panel on the pack's back face (−z)
  const rear = czc - mainD * 0.5;
  const pnl = dna.hash % 2 === 0 ? SHAPE.BOX : SHAPE.TRAP;
  out.push(
    shp(pnl, "sec", bw * 0.66, 0.14 * t, mainD * 0.32, 0, 0.03, rear + mainD * 0.13, 0),
    B("dark", bw * 0.5, 0.02, mainD * 0.24, 0, 0.03 - 0.07 * t, rear + mainD * 0.1),
  );

  // twin main thrusters — socketed into the pack underside, firing down-back
  out.push(
    ...socketPort("metal", -0.08 * t, -bh * 0.44, -0.1, 0.04, 0.07, 0.5, 0, 0),
    ...socketPort("metal", 0.08 * t, -bh * 0.44, -0.1, 0.04, 0.07, 0.5, 0, 0),
  );
  // stabiliser wings rooted on the pack sides
  out.push(
    Wedge("trim", 0.05, 0.16 * t, 0.24, -bw * 0.44, 0.06, -0.08, 0.25, -0.2, 0),
    Wedge("trim", 0.05, 0.16 * t, 0.24, bw * 0.44, 0.06, -0.08, 0.25, 0.2, 0),
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
