import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  N,
  Torus,
  Capsule,
  makeRotaryServo,
  makeStandoffArmor,
  makeCoolingFins,
  mass,
} from "./primitives";

/**
 * Helm (Main Cranium & Structural Skull Chassis).
 * RS/RR: Sleek aerodynamic humanoid cowl with smooth curves and rear exhaust ducts.
 * SS/SR: Angular, tactical cranium with armored plates, bolt seams, and antenna mounts.
 */
export function helm(r: Recipe): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const isSharp = r.quad === "SS" || r.quad === "RS";
  const out: Spec[] = [];

  if (isCurved) {
    // --- RS & RR: HUMANOID COWL & PEBBLE DOME ---
    if (r.quad === "RR") {
      // RR: Pure smooth pebble cranium
      out.push(
        // Main dome skull shell
        Capsule("prim", 0.155 * t, 0.08, 0, 0.02, -0.02, 0.22, 0, 0, s),
        // Rear neck collar ring
        C("joint", 0.12 * t, 0.12 * t, 0.04, 0, -0.09, -0.03, 0, 0, 0, s),
        // Smooth rear heat dissipation ring
        Torus("dark", 0.12 * t, 0.012, 0, 0.01, -0.07, 0.3, 0, 0),
      );
    } else {
      // RS: Aerodynamic swept-back cranium with sharp trailing strakes
      out.push(
        // Swept aerodynamic shell
        Capsule("prim", 0.148 * t, 0.11, 0, 0.03, -0.03, 0.35, 0, 0, s),
        // Sharp dorsal spine strake
        B("sec", 0.02 * t, 0.045, 0.22, 0, 0.11, -0.03, 0.25, 0, 0),
        // Rear exhaust nozzle ports
        C("dark", 0.025, 0.025, 0.06, -0.06 * t, -0.01, -0.12, -0.3, 0, 0, 10),
        C("dark", 0.025, 0.025, 0.06, 0.06 * t, -0.01, -0.12, -0.3, 0, 0, 10),
      );
    }
    // Inner mechanical base frame (visible under neck)
    out.push(
      C("metal", 0.09 * t, 0.09 * t, 0.05, 0, -0.07, 0, 0, 0, 0, 12),
    );
  } else {
    // --- SS & SR: TACTICAL MECHANIC CRANIUM ---
    out.push(
      // Primary angular helmet block
      mass(r, "prim", 0.31 * t, 0.24, 0.28, 0, 0.02, -0.02),
      // Armored crest plate on top
      mass(r, "sec", 0.22 * t, 0.035, 0.24, 0, 0.14, -0.01),
      // Rear tactical communications / electronics module
      B("dark", 0.24 * t, 0.16, 0.09, 0, 0.02, -0.14),
      // Cooling fin array on rear module
      ...makeCoolingFins("metal", 0.18 * t, 0.08, 0.03, 0, 0.02, -0.185, 4, "y"),
      // Exposed structural skull hinge bolts
      C("metal", 0.014, 0.014, 0.33 * t, 0, -0.02, 0.02, 0, 0, Math.PI / 2, 6),
    );

    if (isSharp) {
      // SS: Razor-sharp chamfered cheeks & antenna mounts
      out.push(
        B("trim", 0.018, 0.08, 0.12, -0.16 * t, 0.03, -0.02, 0, 0, 0.35),
        B("trim", 0.018, 0.08, 0.12, 0.16 * t, 0.03, -0.02, 0, 0, -0.35),
      );
    }
  }

  // M~Z Density Plating:
  if (r.ornate) {
    out.push(
      ...makeStandoffArmor(
        r,
        "sec",
        0.26 * t,
        0.06,
        0.18,
        0,
        0.15,
        -0.03,
        0.02,
      ),
      B("trim", 0.035 * t, 0.02, 0.14, 0, 0.175, -0.02),
    );
  }

  return out;
}

/**
 * Visor Generator.
 * RS & RR: Full Visor display screen! Expansive, smooth curved panoramic face display.
 * SS & SR: Tactical multi-slit or faceted armored visor with sensor hood.
 */
export function visor(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // --- FULL VISOR (HUMANOID ROBOT STYLE) ---
    // Smooth, expansive curved display screen covering the face
    const visorWidth = 0.23 * t;
    if (r.quad === "RR") {
      // RR: Ultra-smooth pebble full visor
      out.push(
        // The main glossy curved full visor screen
        Capsule("visor", 0.11 * t, 0.065, 0, -0.005, 0.045, 0.28, 0, 0, r.segs),
        // Visor Bezel Ring / Gasket
        Torus("dark", 0.115 * t, 0.009, 0, -0.005, 0.04, 0.28, 0, 0),
        // Internal glowing horizontal HUD horizon / status line
        B("glow", visorWidth * 0.75, 0.008, 0.02, 0, 0.005, 0.085, 0.28, 0, 0),
      );
    } else {
      // RS: Aerodynamic curved full visor with sharp perimeter chamfers
      out.push(
        // Curved panoramic visor screen
        Capsule("visor", 0.105 * t, 0.08, 0, 0, 0.045, 0.35, 0, 0, r.segs),
        // Lateral aerodynamic visor strakes (framing the visor)
        B("dark", 0.016, 0.14, 0.05, -visorWidth * 0.52, -0.01, 0.04, 0.25, 0.2, 0),
        B("dark", 0.016, 0.14, 0.05, visorWidth * 0.52, -0.01, 0.04, 0.25, -0.2, 0),
        // Internal dual glow points (eyes behind the tint)
        C("glow", 0.012, 0.012, 0.02, -0.045 * t, 0.015, 0.08, 0.35, 0, 0, 8),
        C("glow", 0.012, 0.012, 0.02, 0.045 * t, 0.015, 0.08, 0.35, 0, 0, 8),
      );
    }
  } else {
    // --- SS & SR: TACTICAL ARMORED VISOR ---
    const sides = r.quad === "SS" ? 4 : 8;
    out.push(
      // Recessed armored visor band
      C("visor", 0.038 * t, 0.042 * t, 0.19 * t, 0, 0.01, 0.04, 0, 0, Math.PI / 2, sides),
      // Armored Sunshade / Brow Hood
      B("sec", 0.22 * t, 0.025, 0.07, 0, 0.042, 0.055, 0.22, 0, 0),
      // Central Optical Sensor Divider
      B("dark", 0.022 * t, 0.048, 0.05, 0, 0.01, 0.055),
      // Tactical Aiming Reticle / Laser Emitter Notch
      C("glow", 0.009, 0.009, 0.02, 0, -0.012, 0.065, Math.PI / 2, 0, 0, 8),
    );
  }

  // M~Z Layered Visor Armor:
  if (r.ornate) {
    out.push(
      B("trim", 0.16 * t, 0.014, 0.04, 0, 0.052, 0.065),
    );
  }

  return out;
}

/**
 * Brow (Upper Visor Bezel / Forehead Shield).
 */
export function brow(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // Seamless aerodynamic brow cowl
    out.push(
      Capsule("prim", 0.11 * t, 0.05, 0, 0.015, 0.03, 0.35, 0, 0, r.segs),
      // Integrated forward LiDAR / stereoscopic camera housing
      C("dark", 0.016, 0.016, 0.04, 0, 0.025, 0.065, 0.35, 0, 0, 10),
      C("metal", 0.009, 0.009, 0.045, 0, 0.025, 0.066, 0.35, 0, 0, 8),
    );
  } else {
    // Heavy tactical brow plate with sensor slit
    out.push(
      B("prim", 0.24 * t, 0.04, 0.08, 0, 0.01, 0.04, 0.28, 0, 0),
      B("sec", 0.16 * t, 0.018, 0.09, 0, 0.025, 0.045, 0.28, 0, 0),
      // Hex mounting fasteners on brow
      C("metal", 0.007, 0.007, 0.02, -0.09 * t, 0.02, 0.07, 0.28, 0, 0, 6),
      C("metal", 0.007, 0.007, 0.02, 0.09 * t, 0.02, 0.07, 0.28, 0, 0, 6),
    );
  }

  return out;
}

/**
 * Eye L / Eye R (Optical Cameras / Multi-Spectral Lenses).
 */
export function eye(r: Recipe, isLeft: boolean): Spec[] {
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // RS/RR: Integrated micro-optics recessed inside the full visor
    out.push(
      C("metal", 0.014, 0.014, 0.03, 0, 0, 0.01, 0.3, 0, 0, 10),
      C("glow", 0.009, 0.009, 0.035, 0, 0, 0.015, 0.3, 0, 0, 8),
    );
  } else {
    // SS/SR: Heavy tactical optical canister with metallic lens bezel
    out.push(
      // Outer lens barrel housing
      C("dark", 0.022, 0.02, 0.04, 0, 0, 0.01, 0.25, 0, 0, 8),
      // Metallic focus ring
      C("metal", 0.024, 0.024, 0.012, 0, 0, 0.022, 0.25, 0, 0, 10),
      // Front optical aperture glass
      C("glow", 0.015, 0.015, 0.015, 0, 0, 0.026, 0.25, 0, 0, 12),
      // Secondary telemetry sensor node
      C("acc", 0.007, 0.007, 0.02, isLeft ? -0.025 : 0.025, -0.015, 0.015, 0.25, 0, 0, 6),
    );
  }

  return out;
}

/**
 * Nose (Sensor Bridge / Center Air Intake).
 */
export function nose(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // Smooth aerodynamic nose contour
    out.push(
      B("prim", 0.045 * t, 0.04, 0.035, 0, 0, 0.01, 0.45, 0, 0),
    );
  } else {
    // Sharp faceted nose bridge with sensor slit
    out.push(
      N("prim", 0.015 * t, 0.045 * t, 0.065, 0, 0, 0.02, 0.35, 0, 0),
      B("dark", 0.018 * t, 0.04, 0.02, 0, -0.01, 0.03, 0.35, 0, 0),
    );
  }

  return out;
}

/**
 * Mouth / Lower Faceplate.
 */
export function mouth(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // Seamless acoustic diaphragm / vocoder slot
    out.push(
      B("dark", 0.08 * t, 0.02, 0.04, 0, 0, 0.015),
      B("metal", 0.06 * t, 0.006, 0.045, 0, 0, 0.02),
    );
  } else {
    // Rugged tactical mouth grille with twin intake slats
    out.push(
      B("prim", 0.11 * t, 0.05, 0.05, 0, 0, 0.01, 0.2, 0, 0),
      B("dark", 0.08 * t, 0.01, 0.045, 0, 0.012, 0.025, 0.2, 0, 0),
      B("dark", 0.08 * t, 0.01, 0.045, 0, -0.012, 0.025, 0.2, 0, 0),
    );
  }

  return out;
}

/**
 * Jaw (Mandibular Frame & Neck Coupling Hinge).
 */
export function jaw(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  // Mandibular pivot hinge pins
  out.push(
    C("metal", 0.016, 0.016, 0.16 * t, 0, -0.01, 0, 0, 0, Math.PI / 2, 8),
  );

  if (isCurved) {
    // Sleek streamlined jawline cradling the full visor bottom
    out.push(
      Capsule("prim", 0.095 * t, 0.06, 0, 0.01, 0.01, 0.2, 0, 0, r.segs),
      B("dark", 0.07 * t, 0.035, 0.06, 0, -0.02, 0.01),
    );
  } else {
    // Heavy angular tactical jaw
    out.push(
      B("prim", 0.16 * t, 0.06, 0.11, 0, 0, 0.02, 0.25, 0, 0),
      B("dark", 0.11 * t, 0.035, 0.08, 0, -0.015, 0.03, 0.25, 0, 0),
    );
  }

  return out;
}

/**
 * Ear L / Ear R (Rotary Ear Servos & Comm Pods).
 */
export function ear(r: Recipe, isLeft: boolean): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  const earRad = 0.042 * t;
  const earThick = 0.028;

  if (isCurved) {
    // RR/RS: Sleek rotary ear servo drum with circular acoustic mesh
    out.push(
      ...makeRotaryServo("joint", "metal", 0, 0, 0, earRad, earThick, 0, 0, Math.PI / 2, r.segs),
      Torus("trim", earRad * 0.85, 0.005, 0, 0, 0, 0, Math.PI / 2, 0),
    );
  } else {
    // SS/SR: Tactical communications drum with knurled bezel and heat sink fins
    out.push(
      ...makeRotaryServo("dark", "metal", 0, 0, 0, earRad, earThick, 0, 0, Math.PI / 2, 8),
      B("metal", 0.01, earRad * 1.6, earRad * 1.4, isLeft ? -earThick * 0.6 : earThick * 0.6, 0, 0),
      // Miniature status LED
      C("glow", 0.006, 0.006, 0.01, isLeft ? -earThick * 0.7 : earThick * 0.7, 0.02, 0, 0, 0, Math.PI / 2, 6),
    );
  }

  return out;
}

/**
 * Crest / V-Fin (Cybernetic Fin, Shark Crest, or Tactical V-Fin).
 */
export function vfin(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  if (r.quad === "RS") {
    // RS: Aerodynamic swept shark fin crest
    out.push(
      B("prim", 0.018, 0.16, 0.22, 0, 0.05, 0.02, 0.5, 0, 0),
      B("acc", 0.012, 0.04, 0.14, 0, 0.09, -0.02, 0.5, 0, 0),
      C("metal", 0.008, 0.008, 0.04, 0, 0.01, 0.04, 0, 0, Math.PI / 2, 6),
    );
  } else if (r.quad === "RR") {
    // RR: Streamlined low-profile dome crest / aerodynamic ridge
    out.push(
      Capsule("prim", 0.035 * t, 0.12, 0, 0.03, 0.01, 0.45, 0, 0, r.segs),
      B("trim", 0.014 * t, 0.01, 0.14, 0, 0.05, 0.01, 0.45, 0, 0),
    );
  } else if (r.quad === "SS") {
    // SS: Razor-sharp geometric tactical V-Fin with angular chamfers
    out.push(
      // Center mounting gem / sensor bracket
      B("sec", 0.045 * t, 0.045, 0.04, 0, 0.01, 0.03),
      C("glow", 0.012, 0.012, 0.02, 0, 0.01, 0.05, Math.PI / 2, 0, 0, 4),
      // Left swept blade
      B("prim", 0.014, 0.18, 0.04, -0.11 * t, 0.07, 0.015, 0.2, 0, -0.58),
      // Right swept blade
      B("prim", 0.014, 0.18, 0.04, 0.11 * t, 0.07, 0.015, 0.2, 0, 0.58),
    );
  } else {
    // SR: Reinforced tactical command crest with dual antenna prongs
    out.push(
      B("prim", 0.08 * t, 0.06, 0.05, 0, 0.02, 0.02),
      C("metal", 0.008, 0.008, 0.16, -0.05 * t, 0.08, 0, 0.15, 0, -0.2, 8),
      C("metal", 0.008, 0.008, 0.16, 0.05 * t, 0.08, 0, 0.15, 0, 0.2, 8),
      B("acc", 0.03 * t, 0.03, 0.03, 0, 0.03, 0.04),
    );
  }

  return out;
}

/**
 * Antenna L / Antenna R (Communications Mast).
 */
export function antenna(r: Recipe, isLeft: boolean): Spec[] {
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  const sign = isLeft ? -1 : 1;

  if (isCurved) {
    // RS/RR: Aerodynamic swept strake blade
    out.push(
      B("sec", 0.008, 0.14, 0.05, 0, 0.05, -0.01, 0.45, 0, sign * 0.3),
    );
  } else {
    // SS/SR: Dual-taper tactical whip antenna with base loading coil
    out.push(
      // Base mounting cylinder
      C("dark", 0.012, 0.014, 0.03, 0, 0, 0, 0, 0, 0, 8),
      // Loading coil ring
      Torus("metal", 0.014, 0.004, 0, 0.015, 0),
      // Tapered antenna rod
      N("metal", 0.003, 0.007, 0.22, 0, 0.12, 0, 0.1, 0, sign * 0.18),
    );
  }

  return out;
}

/**
 * Cheek L / Cheek R (Side Cowls & Air Intakes).
 */
export function cheek(r: Recipe, isLeft: boolean): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  const sign = isLeft ? -1 : 1;

  if (isCurved) {
    // Smooth aerodynamic cheek cowl
    out.push(
      Capsule("prim", 0.045 * t, 0.08, 0, 0, 0.01, 0.2, 0, sign * 0.15, r.segs),
      // Recessed intake slit
      B("dark", 0.01, 0.06, 0.03, sign * 0.02, 0, 0.02),
    );
  } else {
    // Heavy tactical cheek armor with radiator vents
    out.push(
      B("prim", 0.045 * t, 0.09, 0.08, 0, 0, 0.02, 0.2, 0, sign * 0.2),
      B("dark", 0.025 * t, 0.06, 0.05, sign * 0.015, 0, 0.03, 0.2, 0, sign * 0.2),
      ...makeCoolingFins("metal", 0.02 * t, 0.05, 0.03, sign * 0.015, 0, 0.03, 3, "y"),
    );
  }

  return out;
}

/**
 * Chin (Chin Guard / Crash Spoiler).
 */
export function chin(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const out: Spec[] = [];

  if (isCurved) {
    // Sleek chin spoiler tapering from the full visor
    out.push(
      B("prim", 0.065 * t, 0.04, 0.05, 0, 0, 0.01, 0.35, 0, 0),
      B("sec", 0.035 * t, 0.02, 0.04, 0, -0.01, 0.02, 0.35, 0, 0),
    );
  } else {
    // Heavy angular tactical chin latch
    out.push(
      B("prim", 0.085 * t, 0.05, 0.07, 0, 0, 0.02, 0.3, 0, 0),
      B("dark", 0.055 * t, 0.03, 0.05, 0, -0.01, 0.03, 0.3, 0, 0),
      C("metal", 0.008, 0.008, 0.07 * t, 0, 0.01, 0.04, 0, 0, Math.PI / 2, 6),
    );
  }

  return out;
}
