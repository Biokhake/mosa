import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  N,
  Torus,
  Capsule,
  Wedge,
  Trap,
  makeRotaryServo,
  makeStandoffArmor,
  makeCoolingFins,
  mass,
} from "./primitives";
import { generateKitDNA } from "./dna";

/** Small helper: a stable 0..(m-1) style index for a face feature. */
function faceStyle(r: Recipe, shift: number, m: number): number {
  return ((generateKitDNA(r.code.id).hash >>> shift) % m + m) % m;
}

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
  const style = faceStyle(r, 5, 5); // 0..4 — the visor "face" of this unit
  const out: Spec[] = [];
  const vw = 0.2 * t;

  if (isCurved) {
    // --- RS & RR: full curved display screen, 5 distinct faces ---
    const seg = r.segs;
    if (style === 0) {
      // wide panoramic screen
      out.push(
        Capsule("visor", 0.11 * t, 0.07, 0, -0.004, 0.045, 0.3, 0, 0, seg),
        Torus("dark", 0.115 * t, 0.008, 0, -0.004, 0.04, 0.3, 0, 0),
        B("glow", vw * 0.78, 0.008, 0.02, 0, 0.006, 0.085, 0.3, 0, 0),
      );
    } else if (style === 1) {
      // wraparound screen with lateral wing strakes
      out.push(
        Capsule("visor", 0.1 * t, 0.085, 0, 0, 0.045, 0.35, 0, 0, seg),
        B("dark", 0.014, 0.15, 0.055, -vw * 0.56, -0.01, 0.03, 0.25, 0.22, 0),
        B("dark", 0.014, 0.15, 0.055, vw * 0.56, -0.01, 0.03, 0.25, -0.22, 0),
        C("glow", 0.011, 0.011, 0.02, -0.045 * t, 0.012, 0.08, 0.32, 0, 0, 8),
        C("glow", 0.011, 0.011, 0.02, 0.045 * t, 0.012, 0.08, 0.32, 0, 0, 8),
      );
    } else if (style === 2) {
      // slim horizon band on a matte faceplate
      out.push(
        Capsule("dark", 0.11 * t, 0.05, 0, 0, 0.05, 0.3, 0, 0, seg),
        B("visor", vw * 0.82, 0.02, 0.03, 0, 0.02, 0.075, 0.28, 0, 0),
        B("glow", vw * 0.5, 0.006, 0.02, 0, 0.02, 0.09, 0.28, 0, 0),
      );
    } else if (style === 3) {
      // domed bubble canopy
      out.push(
        { t: "hemi", m: "visor", s: [0.1 * t, 0, 0], p: [0, 0.02, 0.05], r: [0.2, 0, 0] },
        Torus("metal", 0.1 * t, 0.008, 0, 0.01, 0.03, 0.3, 0, 0),
        C("glow", 0.02, 0.02, 0.02, 0, 0.02, 0.11, Math.PI / 2, 0, 0, 12),
      );
    } else {
      // split hemispheres (twin eye pods behind one gasket)
      out.push(
        Capsule("dark", 0.11 * t, 0.055, 0, 0, 0.045, 0.28, 0, 0, seg),
        C("visor", 0.035 * t, 0.035 * t, 0.03, -0.05 * t, 0.02, 0.075, Math.PI / 2, 0, 0, seg),
        C("visor", 0.035 * t, 0.035 * t, 0.03, 0.05 * t, 0.02, 0.075, Math.PI / 2, 0, 0, seg),
        C("glow", 0.016, 0.016, 0.022, -0.05 * t, 0.02, 0.088, Math.PI / 2, 0, 0, 10),
        C("glow", 0.016, 0.016, 0.022, 0.05 * t, 0.02, 0.088, Math.PI / 2, 0, 0, 10),
      );
    }
  } else {
    // --- SS & SR: tactical armored visor, 5 distinct faces ---
    const sides = r.quad === "SS" ? 4 : 8;
    if (style === 0) {
      // single recessed band + emitter notch
      out.push(
        C("visor", 0.038 * t, 0.042 * t, 0.18 * t, 0, 0.01, 0.04, 0, 0, Math.PI / 2, sides),
        B("dark", 0.02 * t, 0.05, 0.05, 0, 0.01, 0.055),
        C("glow", 0.009, 0.009, 0.02, 0, -0.01, 0.065, Math.PI / 2, 0, 0, 8),
      );
    } else if (style === 1) {
      // twin horizontal slits split by a bridge
      out.push(
        B("dark", vw, 0.06, 0.05, 0, 0.008, 0.045, 0.12, 0, 0),
        B("visor", vw * 0.42, 0.016, 0.03, -vw * 0.26, 0.016, 0.065, 0.12, 0, 0),
        B("visor", vw * 0.42, 0.016, 0.03, vw * 0.26, 0.016, 0.065, 0.12, 0, 0),
        B("glow", vw * 0.34, 0.006, 0.02, -vw * 0.26, 0.016, 0.078, 0.12, 0, 0),
        B("glow", vw * 0.34, 0.006, 0.02, vw * 0.26, 0.016, 0.078, 0.12, 0, 0),
      );
    } else if (style === 2) {
      // aggressive V-notch visor
      out.push(
        B("dark", vw * 0.95, 0.07, 0.05, 0, 0.005, 0.04, 0.1, 0, 0),
        B("visor", vw * 0.5, 0.02, 0.03, -vw * 0.22, 0.012, 0.065, 0.1, 0, 0.32),
        B("visor", vw * 0.5, 0.02, 0.03, vw * 0.22, 0.012, 0.065, 0.1, 0, -0.32),
        C("glow", 0.01, 0.01, 0.02, 0, -0.006, 0.07, Math.PI / 2, 0, 0, 6),
      );
    } else if (style === 3) {
      // wide mono screen with a chamfered frame
      out.push(
        Trap("dark", vw * 0.8, vw, 0.07, 0, 0.006, 0.038, 0.12, 0, 0, 0.05),
        B("visor", vw * 0.82, 0.03, 0.03, 0, 0.01, 0.062, 0.12, 0, 0),
        B("glow", vw * 0.6, 0.008, 0.02, 0, 0.01, 0.076, 0.12, 0, 0),
      );
    } else {
      // stepped brow visor with a heavy hood
      out.push(
        B("sec", vw * 1.06, 0.028, 0.08, 0, 0.05, 0.05, 0.28, 0, 0),
        C("visor", 0.036 * t, 0.04 * t, 0.17 * t, 0, 0.005, 0.045, 0, 0, Math.PI / 2, sides),
        B("dark", 0.02 * t, 0.045, 0.05, 0, 0.005, 0.06),
        C("glow", 0.009, 0.009, 0.02, 0, -0.012, 0.068, Math.PI / 2, 0, 0, 8),
      );
    }
  }

  // M~Z adds one slim layered brow rail (only when the style has no hood).
  if (r.ornate && style !== 4) {
    out.push(B("trim", 0.15 * t, 0.012, 0.035, 0, 0.05, 0.062));
  }

  return out;
}

/**
 * Brow (Upper Visor Bezel / Forehead Shield).
 */
export function brow(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  // The visor already carries the hood/bezel; the brow is only a slim
  // integrated eyebrow ridge so the face doesn't double up.
  const hooded = faceStyle(r, 5, 5) === 4;
  const out: Spec[] = [];

  if (hooded) {
    // visor style already has a heavy hood — just a centre camera nub
    out.push(C("metal", 0.009, 0.009, 0.03, 0, 0.03, 0.066, 0.32, 0, 0, 8));
    return out;
  }

  if (isCurved) {
    out.push(
      // thin seamless brow ridge
      Capsule("prim", 0.095 * t, 0.02, 0, 0.02, 0.055, 0.4, 0, 0, r.segs),
      C("dark", 0.014, 0.014, 0.03, 0, 0.03, 0.068, 0.35, 0, 0, 10),
    );
  } else {
    out.push(
      // slim angled eyebrow bar (Part 1) with a Part 2 core line
      B("prim", 0.2 * t, 0.022, 0.05, 0, 0.032, 0.05, 0.3, 0, 0),
      B("sec", 0.12 * t, 0.012, 0.055, 0, 0.04, 0.055, 0.3, 0, 0),
    );
  }

  return out;
}

/**
 * Eye L / Eye R (Optical Cameras / Multi-Spectral Lenses).
 */
export function eye(r: Recipe, isLeft: boolean): Spec[] {
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const style = faceStyle(r, 9, 5); // 0..4 — the eye "identity" of this unit
  const sign = isLeft ? -1 : 1;
  const out: Spec[] = [];
  const pitch = isCurved ? 0.3 : 0.25;

  if (style === 0) {
    // round camera lens with a metallic focus bezel
    out.push(
      C("dark", 0.021, 0.019, 0.03, 0, 0, 0.012, pitch, 0, 0, isCurved ? 12 : 8),
      C("metal", 0.023, 0.023, 0.01, 0, 0, 0.024, pitch, 0, 0, 10),
      C("glow", 0.014, 0.014, 0.016, 0, 0, 0.03, pitch, 0, 0, 12),
    );
  } else if (style === 1) {
    // angular rectangular optic
    out.push(
      B("dark", 0.05, 0.03, 0.028, 0, 0, 0.012, pitch, 0, 0),
      B("glow", 0.036, 0.016, 0.016, 0, 0, 0.028, pitch, 0, 0),
    );
  } else if (style === 2) {
    // narrow vertical combat slit
    out.push(
      B("dark", 0.022, 0.05, 0.026, 0, 0, 0.012, pitch, 0, sign * 0.12),
      B("glow", 0.01, 0.04, 0.014, 0, 0, 0.028, pitch, 0, sign * 0.12),
    );
  } else if (style === 3) {
    // twin stacked micro-lenses
    out.push(
      C("dark", 0.017, 0.016, 0.026, 0, 0.012, 0.012, pitch, 0, 0, 8),
      C("dark", 0.013, 0.012, 0.024, 0, -0.014, 0.012, pitch, 0, 0, 8),
      C("glow", 0.011, 0.011, 0.016, 0, 0.012, 0.028, pitch, 0, 0, 10),
      C("glow", 0.008, 0.008, 0.014, 0, -0.014, 0.026, pitch, 0, 0, 10),
    );
  } else {
    // hex compound sensor with a telemetry node
    out.push(
      C("dark", 0.024, 0.024, 0.028, 0, 0, 0.012, pitch, 0, 0, 6),
      C("glow", 0.015, 0.015, 0.016, 0, 0, 0.028, pitch, 0, 0, 6),
      C("acc", 0.006, 0.006, 0.018, sign * 0.026, -0.016, 0.016, pitch, 0, 0, 6),
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

  // The visor and jaw already carry most of the face read; the nose is just a
  // slim bridge sliver, and half the units skip a visible one entirely.
  if (faceStyle(r, 17, 2) === 0) return out;

  if (isCurved) {
    out.push(N("prim", 0.006 * t, 0.02 * t, 0.03, 0, 0, 0.006, 0.5, 0, 0));
  } else {
    out.push(
      N("prim", 0.008 * t, 0.026 * t, 0.045, 0, 0, 0.012, 0.4, 0, 0),
      B("dark", 0.012 * t, 0.03, 0.015, 0, -0.008, 0.022, 0.4, 0, 0),
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

  // Slim vocoder detail that sits on the jaw plate — not a second faceplate.
  if (isCurved) {
    out.push(
      B("dark", 0.07 * t, 0.016, 0.03, 0, 0, 0.012),
      B("metal", 0.05 * t, 0.005, 0.035, 0, 0, 0.017),
    );
  } else {
    const bars = faceStyle(r, 21, 2) === 0 ? 2 : 3;
    out.push(B("dark", 0.09 * t, 0.03, 0.035, 0, 0, 0.008, 0.2, 0, 0));
    for (let i = 0; i < bars; i++) {
      const gy = (i - (bars - 1) / 2) * 0.012;
      out.push(B("metal", 0.07 * t, 0.005, 0.03, 0, gy, 0.022, 0.2, 0, 0));
    }
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
    // Sleek streamlined jawline: wide at the cheeks, tapering downward
    out.push(
      Trap("prim", 0.13 * t, 0.055 * t, 0.08, 0, -0.002, 0.012, 0.32, 0, 0, 0.09),
      B("dark", 0.08 * t, 0.01, 0.03, 0, 0.018, 0.028, 0.3, 0, 0),
    );
  } else {
    // Sharp angular jaw: broad mandible plate tapering to a narrow chin base
    out.push(
      Trap("prim", 0.15 * t, 0.05 * t, 0.095, 0, 0, 0.016, 0.34, 0, 0, 0.11),
      // thin under-cut shadow line so jaw + chin read as one unit
      B("dark", 0.09 * t, 0.01, 0.03, 0, 0.02, 0.03, 0.3, 0, 0),
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
  // DNA sets how far the chin juts and how sharp it is.
  const jut = 0.02 + faceStyle(r, 13, 4) * 0.01; // 0.02..0.05 forward
  const out: Spec[] = [];

  if (isCurved) {
    // Sleek chin spoiler — a soft forward point off the jawline (Part 1),
    // with a slim Part 2 accent ridge along its crest.
    out.push(
      Wedge("prim", 0.075 * t, 0.045, 0.05 + jut, 0, -0.004, 0.012 + jut * 0.4, 0.62, 0, 0),
      B("sec", 0.02 * t, 0.012, 0.05, 0, 0.006, 0.02 + jut * 0.4, 0.62, 0, 0),
    );
  } else {
    // Aggressive protruding chin blade (Part 1) + Part 2 spine accent.
    out.push(
      Wedge("prim", 0.085 * t, 0.05, 0.06 + jut, 0, 0, 0.016 + jut * 0.5, 0.7, 0, 0),
      B("sec", 0.022 * t, 0.014, 0.06, 0, 0.008, 0.024 + jut * 0.5, 0.7, 0, 0),
      // hinge pin tying it to the jaw
      C("metal", 0.007, 0.007, 0.06 * t, 0, 0.014, 0.006, 0, 0, Math.PI / 2, 6),
    );
  }

  return out;
}
