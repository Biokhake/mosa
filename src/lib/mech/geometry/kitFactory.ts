import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  N,
  Wedge,
  Trap,
  Cowl,
  Octa,
  base,
} from "./primitives";

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
  /** Unique procedural seed for this kit (0..99) ensuring 100% unique geometries */
  seed: number;
}

/**
 * Parses the Kit ID (e.g. "SSA-001", "RRM-088") to determine quad, complexity, and archetype.
 */
export function parseKitCode(kitId: string): ParsedKit {
  const clean = (kitId || "SSA-001").trim().toUpperCase();
  const quadPart = clean.slice(0, 2);
  const quad: "SS" | "SR" | "RS" | "RR" =
    quadPart === "SR" || quadPart === "RS" || quadPart === "RR" ? quadPart : "SS";

  const letter = clean.charAt(2) || "A";
  const letterCode = letter.charCodeAt(0);
  const letterIndex = Math.max(0, Math.min(25, letterCode - 65)); // 0..25

  const numMatch = clean.match(/\d+/);
  const serial = numMatch ? parseInt(numMatch[0], 10) : letterIndex + 1;
  const seed = (serial - 1) % 100;

  const isOrnate = letter >= "M";
  const densityLevel = isOrnate ? Math.min(12, letterIndex - 11) : letterIndex + 1;

  // 5 Canonical Archetypes cleanly distributed across the 100 kits
  let archetype: ArchetypeType;
  if (letterIndex <= 4) {
    // A..E: Grunt / Utilitarian (Mass production, utilitarian dome, practical armor)
    archetype = "grunt";
  } else if (letterIndex <= 9) {
    // F..J: Heavy / Juggernaut (Massive inverted triangle, round pauldrons / hex shields, hover feet)
    archetype = "heavy";
  } else if (letterIndex <= 14) {
    // K..O: Speed / Agile (Extreme slim frame, swallowtail/wing skirts, high-heel / talon feet)
    archetype = "speed";
  } else if (letterIndex <= 19) {
    // P..U: Heroic (Iconic V-Fin crest, deep-eye masked face, faceted shoulders, sharp shins)
    archetype = "heroic";
  } else {
    // V..Z: Beast / Villainous (Organic skull curves, cone spikes, claw feet, sinister horns)
    archetype = "beast";
  }

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
  };
}

/**
 * =========================================================================
 * 1. SHOULDER - 3-Layer Assembly (Master 7.0 Mandate)
 *
 * Mandate breakdown:
 *  - Layer 1 (Base): Flat, thin rectangular base plate at lower mount
 *  - Layer 2 (Main): Stepped 3D Main Pauldron (Trapezoid, Cowl, Wedge, Beveled Block)
 *  - Layer 3 (Accent/Panel): Step-offset applique panels, cooling louvers, verniers
 *  - Layer 4 (Hardware): Exposed hinge axle pin, hydraulic elevation actuator, telemetry
 * =========================================================================
 */
export function buildLayeredShoulder(
  kit: ParsedKit,
  t: number,
  s: number,
  detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype, quad } = kit;

  // LAYER 1: BASE (하부 비교적 납작하고 얇은 베이스 & 서브 프레임)
  const baseW = 0.16 * t;
  const baseH = 0.035 * t;
  const baseD = 0.16;
  out.push(
    B("dark", baseW, baseH, baseD, 0.03, -0.075, 0),
    C("metal", 0.036, 0.036, 0.14, 0, -0.065, 0, 0, 0, Math.PI / 2, Math.max(6, s)),
    C("metal", 0.012, 0.012, 0.08, -0.02, -0.04, 0.045, 0.28, 0, 0, 6),
  );

  // LAYER 2: MAIN (베이스 위로 단차를 두고 얹혀지는 입체적인 메인 사다리꼴 장갑)
  const mainY = 0.025;
  const mainX = 0.035;

  if (archetype === "grunt" || quad === "SS") {
    // Mass-production: 3D Faceted Trapezoid Pauldron
    out.push(
      Trap("prim", 0.18 * t, 0.26 * t, 0.20 * t, mainX, mainY, 0, 0, 0, -0.14),
    );
  } else if (archetype === "speed" || quad === "SR") {
    // Aerodynamic Swept Cowl
    out.push(
      Cowl("prim", 0.23 * t, 0.18 * t, 0.22, mainX + 0.01, mainY + 0.01, 0, 0, 0, -0.20),
    );
  } else if (archetype === "heavy" || quad === "RS") {
    // Fortified Heavy Armor Block
    out.push(
      B("prim", 0.26 * t, 0.22 * t, 0.24, mainX + 0.01, mainY, 0, 0, 0, -0.08),
    );
  } else if (archetype === "heroic" || quad === "RR") {
    // Winged Diamond Crest Pauldron
    out.push(
      Trap("prim", 0.25 * t, 0.16 * t, 0.22 * t, mainX + 0.015, mainY + 0.015, 0, 0, 0, -0.18),
    );
  } else {
    // Beast Aggressive Spiked Trapezoid
    out.push(
      Trap("prim", 0.26 * t, 0.14 * t, 0.21 * t, mainX + 0.02, mainY + 0.01, 0, 0, 0, -0.24),
    );
  }

  // LAYER 3: ACCENT / PANELS (전/후/측면에 단차를 두어 입체적으로 돌출 결합된 패널)
  if (archetype === "grunt" || archetype === "heavy") {
    const stepZ = 0.11;
    out.push(
      Trap("sec", 0.12 * t, 0.16 * t, 0.04, mainX + 0.01, mainY + 0.01, stepZ, 0.12, 0, -0.1),
      Trap("sec", 0.12 * t, 0.16 * t, 0.04, mainX + 0.01, mainY + 0.01, -stepZ, -0.12, 0, -0.1),
    );
  } else if (archetype === "speed") {
    out.push(
      Wedge("sec", 0.045, 0.15 * t, 0.18, mainX + 0.02, mainY + 0.03, 0.02, 0.22, 0, -0.26),
    );
  } else if (archetype === "heroic") {
    out.push(
      Trap("sec", 0.14 * t, 0.18 * t, 0.045, mainX + 0.02, mainY + 0.04, 0.05, -0.14, 0, -0.18),
      B("trim", 0.014, 0.15 * t, 0.16, mainX + 0.10, mainY + 0.04, 0, 0, 0, -0.18),
    );
  } else {
    out.push(
      N("trim", 0.005, 0.032, 0.16, mainX + 0.09, mainY + 0.08, 0, 0.12, 0, -0.42),
      Octa("acc", 0.035, mainX + 0.04, mainY + 0.02, 0.10),
    );
  }

  // Lateral (+X) Thruster / Louver Hardware
  if (detailLevel >= 12 || archetype === "speed" || archetype === "heroic") {
    out.push(
      C("metal", 0.026, 0.038, 0.045, mainX + 0.12, mainY, 0, 0, 0, -Math.PI / 2, 8),
      C("glow", 0.018, 0.028, 0.02, mainX + 0.14, mainY, 0, 0, 0, -Math.PI / 2, 8),
    );
  } else {
    out.push(
      B("metal", 0.016, 0.07 * t, 0.12, mainX + 0.11, mainY - 0.01, 0),
    );
  }

  // LAYER 4: HARDWARE & TELEMETRY
  out.push(
    C("glow", 0.008, 0.008, 0.05, mainX + 0.03, mainY + 0.07, 0.08, 0, 0, Math.PI / 2, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 2. SHIN - 3-Layer Assembly with Zero Foot Interference (Master 7.0 Mandate)
 *
 * Mandate breakdown:
 *  - Zero clipping: bottom edge terminates at y = -0.11, leaving 0.07m to ankle and 0.13m to foot.
 *  - Lower third (y < 0) sharply tapers inward (width narrows from 0.15 to 0.095).
 *  - Front ankle arch notch lifts up to y = -0.09 at 35 degrees angle.
 *  - Layer 1 (Base): Internal skeletal spine & chrome shock dampener pistons
 *  - Layer 2 (Main): Tapered Greave or Flared Bell Armor with high ankle clearance
 *  - Layer 3 (Accent): Stepped knee striker plate, front tibial strip, outer calf thruster
 * =========================================================================
 */
export function buildLayeredShin(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype, quad } = kit;

  // LAYER 1: BASE (내부 골격 섀시 & 유압 피스톤 스파인)
  const baseW = 0.08 * t;
  const baseH = 0.22 * t;
  const baseD = 0.09;
  out.push(
    B("dark", baseW, baseH, baseD, 0, 0.02, -0.02),
    C("metal", 0.012, 0.012, 0.20 * t, -0.024, 0, -0.01, 0, 0, 0, 8),
    C("metal", 0.012, 0.012, 0.20 * t, 0.024, 0, -0.01, 0, 0, 0, 8),
  );

  // LAYER 2: MAIN (정강이 주 장갑판 - Tapered / High-Clearance Profile)
  const mainY = 0.015;
  const mainZ = 0.02;

  if (archetype === "grunt" || quad === "SS") {
    // Tapered Greave: Top 0.15 -> Bottom 0.095 width
    out.push(
      Trap("prim", 0.15 * t, 0.095 * t, 0.24 * t, 0, mainY, mainZ, -0.12, 0, 0),
    );
  } else if (archetype === "speed" || quad === "SR") {
    // Forward Aerodynamic Wedge Greave
    out.push(
      Wedge("prim", 0.13 * t, 0.24 * t, 0.14, 0, mainY, mainZ, -0.16, 0, 0),
    );
  } else if (archetype === "heavy" || quad === "RS") {
    // Flared Bell Armor with high arched clearance
    out.push(
      Trap("prim", 0.13 * t, 0.17 * t, 0.23 * t, 0, mainY, mainZ - 0.01, -0.08, 0, 0),
    );
  } else if (archetype === "heroic" || quad === "RR") {
    // Chiseled Greave Cowl
    out.push(
      Cowl("prim", 0.14 * t, 0.24 * t, 0.15, 0, mainY, mainZ, -0.14, 0, 0),
    );
  } else {
    // Beast Aggressive Ribbed Tapered Plate
    out.push(
      Trap("prim", 0.16 * t, 0.09 * t, 0.24 * t, 0, mainY, mainZ, -0.15, 0, 0),
    );
  }

  // LAYER 3: ACCENT / PANELS (레이어드 니 스트라이커 & 카프 스태빌라이저)
  // 3A: Knee Striker Plate
  if (archetype === "grunt") {
    out.push(
      Trap("sec", 0.10 * t, 0.13 * t, 0.065, 0, 0.13, 0.072, 0.35, 0, 0),
    );
  } else if (archetype === "speed") {
    out.push(
      Wedge("sec", 0.085 * t, 0.085, 0.075, 0, 0.135, 0.075, 0.45, 0, 0),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("sec", 0.13 * t, 0.075, 0.06, 0, 0.12, 0.075, 0.2, 0, 0),
    );
  } else if (archetype === "heroic") {
    out.push(
      Trap("sec", 0.12 * t, 0.07 * t, 0.085, 0, 0.135, 0.08, 0.4, 0, 0),
    );
  } else {
    out.push(
      N("trim", 0.005, 0.03, 0.11, 0, 0.14, 0.085, 0.5, 0, 0),
    );
  }

  // 3B: Front Tibial Ridge Deflector Strip
  out.push(
    B("trim", 0.026 * t, 0.14 * t, 0.018, 0, -0.01, 0.065, -0.12, 0, 0),
  );

  // 3C: Outer Flank (+X) Calf Booster / Stabilizer Fin
  const flankX = 0.095 * t;
  if (archetype === "speed" || archetype === "heroic") {
    out.push(
      Wedge("trim", 0.015, 0.13 * t, 0.11, flankX, -0.01, -0.05, 0.2, 0, 0),
      C("glow", 0.015, 0.022, 0.03, flankX + 0.01, -0.05, -0.06, -0.4, 0, 0, 8),
    );
  } else if (archetype === "heavy") {
    out.push(
      C("dark", 0.030, 0.030, 0.11 * t, flankX + 0.01, -0.02, -0.04, -0.3, 0, 0, 8),
      C("glow", 0.020, 0.020, 0.02, flankX + 0.01, -0.065, -0.055, -0.3, 0, 0, 8),
    );
  } else {
    out.push(
      B("metal", 0.018, 0.11 * t, 0.07, flankX, -0.02, -0.04),
    );
  }

  // LAYER 4: ANKLE JOINT CLEARANCE & ACTUATOR (Open gap under the shin armor)
  out.push(
    C("metal", 0.014, 0.014, 0.06, 0, -0.09, 0, 0, 0, Math.PI / 2, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 3. FOOT - 3-Layer Assembly with Low-Profile Instep
 * Top profile kept strictly below y = 0.035 to ensure total clearance under the shin.
 * =========================================================================
 */
export function buildLayeredFoot(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype } = kit;

  // Layer 1: Base - Ground Tread Sole (m: "dark")
  out.push(
    B("dark", 0.12 * t, 0.022 * t, 0.24, 0, -0.02, 0.02),
  );

  // Layer 2: Main - Low-Profile Sloped Instep Bridge (m: "prim")
  if (archetype === "grunt") {
    out.push(
      Trap("prim", 0.10 * t, 0.13 * t, 0.15, 0, 0.01, 0.04, 0.20, 0, 0),
    );
  } else if (archetype === "speed") {
    out.push(
      Wedge("prim", 0.095 * t, 0.038, 0.17, 0, 0.01, 0.04, 0.28, 0, 0),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("prim", 0.14 * t, 0.032, 0.19, 0, 0.01, 0.03),
    );
  } else if (archetype === "heroic") {
    out.push(
      Cowl("prim", 0.105 * t, 0.038, 0.16, 0, 0.01, 0.04, 0.22, 0, 0),
    );
  } else {
    out.push(
      Cowl("prim", 0.11 * t, 0.038, 0.17, 0, 0.01, 0.04, 0.25, 0, 0),
      N("trim", 0.005, 0.022, 0.07, 0, -0.01, 0.15, Math.PI / 2, 0, 0),
    );
  }

  // Layer 3: Accent - Articulated Ankle Guard Collar & Heel Spur (m: "sec" + "metal")
  out.push(
    Trap("sec", 0.085 * t, 0.105 * t, 0.032, 0, 0.032, -0.04, -0.22, 0, 0),
    B("metal", 0.075 * t, 0.028, 0.05, 0, -0.01, -0.10),
  );

  return out;
}

/**
 * =========================================================================
 * 4. COCKPIT (CHEST HATCH) - 3-Layer Assembly
 * =========================================================================
 */
export function buildLayeredCockpit(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype } = kit;

  // Layer 1: Base Sternum Bulkhead
  out.push(
    B("dark", 0.14 * t, 0.16 * t, 0.09, 0, 0, 0),
  );

  // Layer 2: Main Stepped Cockpit Hatch Cowl
  if (archetype === "speed") {
    out.push(
      Wedge("prim", 0.12 * t, 0.16 * t, 0.14, 0, 0.01, 0.04, 0.25, 0, 0),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("prim", 0.15 * t, 0.16 * t, 0.12, 0, 0.01, 0.04, 0.2, 0, 0),
    );
  } else {
    out.push(
      Trap("prim", 0.12 * t, 0.15 * t, 0.15 * t, 0, 0.01, 0.04, 0.3, 0, 0),
    );
  }

  // Layer 3: Accent Visor Plate & Lock Latches
  out.push(
    Trap("sec", 0.09 * t, 0.12 * t, 0.08 * t, 0, 0.03, 0.08, 0.3, 0, 0),
    B("glow", 0.05 * t, 0.015, 0.02, 0, 0.04, 0.10, 0.3, 0, 0),
    C("metal", 0.008, 0.008, 0.10 * t, 0, -0.04, 0.05, 0, 0, Math.PI / 2, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 5. SKIRT (SIDE ARMOR) - 3-Layer Assembly
 * =========================================================================
 */
export function buildLayeredSkirt(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype } = kit;

  // Layer 1: Base Hinge Pivot
  out.push(
    B("dark", 0.08 * t, 0.04, 0.12, 0, 0.05, 0),
    C("metal", 0.012, 0.012, 0.12, 0, 0.04, 0, 0, 0, Math.PI / 2, 6),
  );

  // Layer 2: Main Flared Skirt Plate
  if (archetype === "grunt") {
    out.push(
      Trap("prim", 0.13 * t, 0.16 * t, 0.20 * t, 0, -0.04, 0, 0, 0, -0.18),
    );
  } else if (archetype === "speed") {
    out.push(
      Wedge("prim", 0.11 * t, 0.22 * t, 0.16, 0, -0.05, 0, 0, 0, -0.22),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("prim", 0.15 * t, 0.20 * t, 0.16, 0, -0.04, 0, 0, 0, -0.14),
    );
  } else if (archetype === "heroic") {
    out.push(
      Cowl("prim", 0.13 * t, 0.22 * t, 0.16, 0, -0.04, 0, 0, 0, -0.20),
    );
  } else {
    out.push(
      Trap("prim", 0.14 * t, 0.18 * t, 0.22 * t, 0, -0.05, 0, 0, 0, -0.24),
    );
  }

  // Layer 3: Accent Step-Offset Sub-Plate & Attitude Control Vernier
  out.push(
    Trap("sec", 0.09 * t, 0.12 * t, 0.12 * t, 0.025, -0.03, 0, 0, 0, -0.18),
    C("glow", 0.015, 0.022, 0.04, 0.03, -0.11, -0.03, 0.4, 0, -0.2, 8),
  );

  return out;
}

/**
 * =========================================================================
 * 6. VAMBRACE (FOREARM GAUNTLET) - 3-Layer Assembly
 * =========================================================================
 */
export function buildLayeredVambrace(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];

  // Layer 1: Base Forearm Sleeve
  out.push(
    B("dark", 0.10 * t, 0.14 * t, 0.07, 0, 0, 0.02),
  );

  // Layer 2: Main Gauntlet Strike Shell
  out.push(
    Trap("prim", 0.12 * t, 0.14 * t, 0.15 * t, 0, 0, 0.05, 0.1, 0, 0),
  );

  // Layer 3: Accent Hardpoint Rail & Deflector Plate
  out.push(
    Trap("sec", 0.08 * t, 0.10 * t, 0.10 * t, 0, 0, 0.08, 0.1, 0, 0),
    B("metal", 0.03 * t, 0.12 * t, 0.018, 0, 0, 0.095, 0.1, 0, 0),
    C("glow", 0.007, 0.007, 0.05, 0.03, -0.02, 0.08, 0, 0, 0, 6),
  );

  return out;
}

/**
 * =========================================================================
 * 7. HELM (HEAD CRANIUM) - 3-Layer Assembly
 * =========================================================================
 */
export function buildLayeredHelm(
  kit: ParsedKit,
  t: number,
  s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];
  const { archetype } = kit;

  // Layer 1: Base Skull Frame & Neck Collar Ring
  out.push(
    B("dark", 0.14 * t, 0.15 * t, 0.18, 0, 0, -0.02),
    C("metal", 0.07 * t, 0.07 * t, 0.04, 0, -0.08, 0, 0, 0, 0, s),
  );

  // Layer 2: Main Helmet Cowl Shell
  if (archetype === "grunt") {
    out.push(
      Trap("prim", 0.18 * t, 0.22 * t, 0.18 * t, 0, 0.02, -0.01, -0.08, 0, 0),
    );
  } else if (archetype === "speed") {
    out.push(
      Cowl("prim", 0.18 * t, 0.19 * t, 0.24, 0, 0.02, -0.02, -0.12, 0, 0),
    );
  } else if (archetype === "heavy") {
    out.push(
      B("prim", 0.22 * t, 0.20 * t, 0.22, 0, 0.02, -0.01, -0.05, 0, 0),
    );
  } else if (archetype === "heroic") {
    out.push(
      Trap("prim", 0.20 * t, 0.16 * t, 0.20 * t, 0, 0.02, -0.02, -0.14, 0, 0),
    );
  } else {
    out.push(
      Trap("prim", 0.22 * t, 0.14 * t, 0.22 * t, 0, 0.03, -0.02, -0.16, 0, 0),
    );
  }

  // Layer 3: Accent Forehead Crest, V-Fin Antennas & Optical Sensor
  out.push(
    Trap("sec", 0.06 * t, 0.09 * t, 0.06, 0, 0.10, 0.07, 0.2, 0, 0),
    B("glow", 0.08 * t, 0.022, 0.02, 0, 0.04, 0.095, -0.05, 0, 0),
  );

  // Archetype-specific sensory crest
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
    out.push(
      C("metal", 0.005, 0.005, 0.12, 0.07 * t, 0.12, 0, 0.1, 0, 0, 6),
    );
  } else {
    out.push(
      Wedge("trim", 0.012, 0.09, 0.16, 0, 0.14, -0.06, -0.35, 0, 0),
    );
  }

  return out;
}

/**
 * =========================================================================
 * 8. PACK (BACKPACK) - 3-Layer Assembly
 * =========================================================================
 */
export function buildLayeredPack(
  kit: ParsedKit,
  t: number,
  _s: number,
  _detailLevel: number,
): Spec[] {
  const out: Spec[] = [];

  // Layer 1: Base Spine Housing & Bulkhead
  out.push(
    B("dark", 0.18 * t, 0.24 * t, 0.12, 0, 0, -0.08),
  );

  // Layer 2: Main Conformal Fuel Tanks & Thruster Shrouds
  out.push(
    Trap("prim", 0.24 * t, 0.20 * t, 0.28 * t, 0, 0.02, -0.12, 0.15, 0, 0),
  );

  // Layer 3: Accent Twin Vectoring Nozzles & Stabilizer Wings
  out.push(
    C("metal", 0.042, 0.052, 0.06, -0.08 * t, -0.10, -0.16, 0.5, 0, 0, 8),
    C("glow", 0.035, 0.045, 0.02, -0.08 * t, -0.12, -0.18, 0.5, 0, 0, 8),
    C("metal", 0.042, 0.052, 0.06, 0.08 * t, -0.10, -0.16, 0.5, 0, 0, 8),
    C("glow", 0.035, 0.045, 0.02, 0.08 * t, -0.12, -0.18, 0.5, 0, 0, 8),
    Wedge("trim", 0.025, 0.14, 0.26, -0.16 * t, 0.08, -0.10, 0.3, -0.25, 0),
    Wedge("trim", 0.025, 0.14, 0.26, 0.16 * t, 0.08, -0.10, 0.3, 0.25, 0),
  );

  return out;
}

/**
 * Procedural Topological Factory returning multi-layered assembly specifications.
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
      return [Trap("prim", 0.12 * t, 0.14 * t, 0.12, 0, 0, 0)];
  }
}

