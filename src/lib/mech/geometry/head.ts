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
  const dna = generateKitDNA(r.code.id);
  const hh = dna.hash;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  const seg = r.quad === "SS" ? 4 : r.quad === "SR" ? 8 : Math.max(12, r.segs);
  const form = hh % 12; // 12 base faces
  const skew = (((hh >>> 4) % 7) - 3) * 0.14; // -0.42..0.42 roll
  const bw = (0.052 + ((hh >>> 7) % 6) * 0.006) * t; // lens half-width unit
  const bh = 0.018 + ((hh >>> 10) % 5) * 0.006; // lens height unit
  const framed = ((hh >>> 14) & 1) === 1;
  const pitch = isCurved ? 0.24 : 0.13;
  const zc = isCurved ? 0.052 : 0.046;
  const V = "visor" as const;
  const out: Spec[] = [];

  // Recessed dark socket — EVERY visor form is seated in this, never floating.
  out.push(B("dark", bw * 2.5, bh * 3 + 0.03, 0.05, 0, 0.004, zc - 0.03, pitch, 0, 0));
  const eye = (x: number) =>
    out.push(C("glow", bh * 0.55, bh * 0.55, 0.018, x, 0.004, zc + 0.008, Math.PI / 2, 0, 0, 8));

  switch (form) {
    case 0: // single horizontal band
      out.push(
        B(V, bw * 2, bh, 0.03, 0, 0.006, zc, pitch, 0, skew * 0.4),
        B("glow", bw * 1.3, bh * 0.4, 0.02, 0, 0.006, zc + 0.008, pitch, 0, skew * 0.4),
      );
      break;
    case 1: // twin stacked bands
      out.push(
        B(V, bw * 1.9, bh * 0.5, 0.03, 0, bh * 0.7, zc, pitch, 0, skew * 0.3),
        B(V, bw * 1.5, bh * 0.42, 0.03, 0, -bh * 0.7, zc, pitch, 0, skew * 0.3),
      );
      break;
    case 2: // V / chevron
      out.push(
        B(V, bw * 1.3, bh, 0.03, -bw * 0.55, 0.004, zc, pitch, 0, 0.5 + skew),
        B(V, bw * 1.3, bh, 0.03, bw * 0.55, 0.004, zc, pitch, 0, -0.5 - skew),
        B("glow", bw * 0.5, bh * 0.4, 0.018, 0, -bh * 0.4, zc + 0.006, pitch, 0, 0),
      );
      break;
    case 3: // inverted triangle 역삼각형
      out.push(Trap(V, bw * 2.2, bw * 0.3, bh * 3.4, 0, 0, zc, pitch, 0, skew * 0.3, 0.03));
      break;
    case 4: // diamond
      out.push(
        B(V, bw * 1.15, bw * 1.15, 0.03, 0, 0.004, zc, pitch, 0, Math.PI / 4 + skew * 0.3),
        B("glow", bw * 0.5, bw * 0.5, 0.018, 0, 0.004, zc + 0.008, pitch, 0, Math.PI / 4),
      );
      break;
    case 5: // X cross
      out.push(
        B(V, bw * 2.3, bh * 0.7, 0.028, 0, 0.004, zc, pitch, 0, 0.62),
        B(V, bw * 2.3, bh * 0.7, 0.028, 0, 0.004, zc, pitch, 0, -0.62),
      );
      break;
    case 6: // plus cross
      out.push(
        B(V, bw * 2, bh * 0.6, 0.028, 0, 0.004, zc, pitch, 0, skew * 0.3),
        B(V, bh * 1.4, bh * 3.6, 0.028, 0, 0.004, zc, pitch, 0, skew * 0.3),
      );
      break;
    case 7: // single cyclops eye
      out.push(C(V, bw * 0.8, bw * 0.8, 0.032, 0, 0.004, zc, Math.PI / 2, 0, 0, seg));
      eye(0);
      break;
    case 8: // dual round eyes
      out.push(
        C(V, bw * 0.55, bw * 0.55, 0.032, -bw * 0.72, 0.004, zc, Math.PI / 2, 0, 0, seg),
        C(V, bw * 0.55, bw * 0.55, 0.032, bw * 0.72, 0.004, zc, Math.PI / 2, 0, 0, seg),
      );
      eye(-bw * 0.72);
      eye(bw * 0.72);
      break;
    case 9: // wraparound curved screen
      out.push(
        B(V, bw * 2.1, bh * 1.5, 0.034, 0, 0.004, zc, pitch, 0, 0),
        B("glow", bw * 1.5, bh * 0.4, 0.02, 0, 0.004, zc + 0.01, pitch, 0, 0),
      );
      break;
    case 10: // hex mono screen
      out.push(
        C(V, bw * 1, bw * 1, 0.032, 0, 0.004, zc, Math.PI / 2, 0, skew * 0.3, 6),
        B("glow", bw * 0.9, bh * 0.35, 0.02, 0, 0.004, zc + 0.012, pitch, 0, 0),
      );
      break;
    default: // 11 — asymmetric angled slash
      out.push(
        B(V, bw * 2, bh * 0.9, 0.03, 0, 0.004, zc, pitch, 0, 0.28 + skew),
        B("glow", bw * 1, bh * 0.3, 0.02, bw * 0.3, 0.004, zc + 0.01, pitch, 0, 0.28 + skew),
      );
      break;
  }

  if (framed) {
    out.push(Torus("metal", bw * 1.5, 0.005, 0, 0.004, zc - 0.006, pitch, 0, 0));
  }
  if (r.ornate) {
    out.push(B("trim", bw * 2.3, 0.01, 0.03, 0, bh * 2 + 0.016, zc - 0.004, pitch, 0, 0));
  }

  return out;
}

/**
 * Brow (Upper Visor Bezel / Forehead Shield).
 */
export function brow(r: Recipe): Spec[] {
  const t = r.thick;
  const isCurved = r.quad === "RS" || r.quad === "RR";
  // The visor socket carries the bezel; the brow is only a slim integrated
  // eyebrow ridge so the face never doubles up.
  const out: Spec[] = [];

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
  const hh = generateKitDNA(r.code.id).hash;
  const kind = (hh >>> 3) % 8; // 8 crest archetypes
  const sweep = 0.14 + ((hh >>> 6) % 6) * 0.1; // 0.14..0.64
  const ht = 0.1 + ((hh >>> 9) % 6) * 0.028; // 0.1..0.24
  const asym = ((hh >>> 12) & 1) === 1;
  const out: Spec[] = [];

  // Base mount — the crest ALWAYS grows out of this, sunk into the helm top.
  out.push(B("sec", 0.055 * t, 0.03, 0.05, 0, -0.004, 0.012));

  switch (kind) {
    case 0: // classic twin V-fin
      out.push(
        B("prim", 0.014, ht, 0.045, -0.05 * t, ht * 0.42, 0.004, 0.16, 0, -sweep),
        B("prim", 0.014, ht, 0.045, 0.05 * t, ht * 0.42, 0.004, 0.16, 0, sweep),
        B("acc", 0.02 * t, 0.02, 0.03, 0, 0.008, 0.03),
      );
      break;
    case 1: // twin comm antenna prongs
      out.push(
        C("metal", 0.005, 0.008, ht * 1.4, -0.028 * t, ht * 0.6, 0, 0.1, 0, -sweep * 0.55, 8),
        C("metal", 0.005, 0.008, ht * 1.4, 0.028 * t, ht * 0.6, 0, 0.1, 0, sweep * 0.55, 8),
      );
      break;
    case 2: // horn pair
      out.push(
        N("prim", 0.003, 0.017, ht, -0.032 * t, ht * 0.4, 0, 0.12, 0, -sweep),
        N("prim", 0.003, 0.017, ht, 0.032 * t, ht * 0.4, 0, 0.12, 0, sweep),
      );
      break;
    case 3: // single dorsal shark blade
      out.push(B("prim", 0.016, ht * 1.3, 0.15, 0, ht * 0.5, -0.03, sweep * 0.9, 0, 0));
      break;
    case 4: {
      // crown of short spikes
      const n = 3 + ((hh >>> 15) % 3);
      for (let i = 0; i < n; i++) {
        const f = n === 1 ? 0 : i / (n - 1) - 0.5;
        out.push(
          N("prim", 0.003, 0.012, ht * (1 - Math.abs(f) * 0.5), f * 0.12 * t, ht * 0.3, 0, 0.12, 0, f * sweep * 2.2),
        );
      }
      break;
    }
    case 5: // mono centre spike
      out.push(N("prim", 0.004, 0.026, ht * 1.7, 0, ht * 0.7 + 0.01, 0, 0.04, 0, 0));
      break;
    case 6: // halo ring behind the head
      out.push(Torus("trim", 0.085 * t, 0.007, 0, 0.09, -0.03, 0.25, 0, 0));
      break;
    default: // 7 — single swept comm blade (asymmetric flair)
      out.push(
        B("prim", 0.014, ht * 1.2, 0.06, (asym ? 0.045 : 0) * t, ht * 0.5, 0, 0.18, 0, sweep * (asym ? 1 : 0.55)),
      );
  }

  if (asym && kind === 0) {
    // one blade grows longer — breaks the strict symmetry
    out.push(B("acc", 0.01, ht * 0.55, 0.03, 0.055 * t, ht * 0.75, 0, 0.16, 0, sweep * 1.3));
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
