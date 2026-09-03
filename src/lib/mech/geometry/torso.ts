import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  Torus,
  Wedge,
  Trap,
  makeServoActuator,
  makeRotaryServo,
  makeStandoffArmor,
  makeCoolingFins,
  lume,
  makeThrusterBell,
} from "./primitives";
import { generateKitDNA } from "./dna";

/**
 * Collar (Neck Mount & Cervical Actuator Assembly).
 * Rotary neck bearing with twin cervical tilt pistons and cable grommet.
 */
export function collar(r: Recipe): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Main Rotary Neck Bearing Turntable
  out.push(...makeRotaryServo("joint", "metal", 0, 0, 0, 0.09 * t, 0.035, 0, 0, 0, s));

  // Twin Cervical Linear Tilt Actuators (Hydraulic neck pistons)
  out.push(
    ...makeServoActuator("dark", "metal", 0.045 * t, 0.02, 0.015, 0.09, 0.012, 0.25, 0, 0, 8),
    ...makeServoActuator("dark", "metal", -0.045 * t, 0.02, 0.015, 0.09, 0.012, 0.25, 0, 0, 8),
  );

  // Collar Armor Rim
  out.push(
    B("prim", 0.22 * t, 0.04, 0.18, 0, -0.01, 0),
  );

  if (r.ornate) {
    out.push(
      B("trim", 0.24 * t, 0.015, 0.12, 0, 0.015, 0),
      B("sec", 0.14 * t, 0.03, 0.05, 0, 0.01, 0.09),
    );
  }

  return out;
}

/**
 * Chest Core (Turbine Reactor Core & Structural Chassis Cage).
 * Heavy frame rails, exposed central energy turbine / reactor chamber, and radiator grills.
 */
export function chestCore(r: Recipe): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Main Thoracic Chassis Cage (Skeletal frame)
  out.push(
    B("dark", 0.32 * t, 0.22, 0.26, 0, 0, 0),
    // Frame rails
    B("joint", 0.04 * t, 0.24, 0.28, -0.15 * t, 0, 0),
    B("joint", 0.04 * t, 0.24, 0.28, 0.15 * t, 0, 0),
  );

  // Central Reactor Turbine Chamber
  const turbineRad = 0.075 * t;
  out.push(
    C("dark", turbineRad, turbineRad, 0.08, 0, 0.01, 0.12, Math.PI / 2, 0, 0, s),
    // Turbine containment ring
    Torus("trim", turbineRad * 1.05, 0.012, 0, 0.01, 0.15),
    // Glowing Core Plasma / Reactor Matrix
    C("glow", turbineRad * 0.55, turbineRad * 0.55, 0.09, 0, 0.01, 0.13, Math.PI / 2, 0, 0, Math.max(8, s)),
  );

  // Lateral Radiator / Heat Exchanger Fins
  out.push(
    ...makeCoolingFins("metal", 0.06 * t, 0.12, 0.04, -0.12 * t, 0.01, 0.1, 4, "y"),
    ...makeCoolingFins("metal", 0.06 * t, 0.12, 0.04, 0.12 * t, 0.01, 0.1, 4, "y"),
  );

  // Front Armor (A~L vs M~Z) — Master Prompt 8.0 묘수 2/3: real Z volume, and
  // the accent tier crosses to a different primitive than the square base.
  const dna = generateKitDNA(r.code.id);
  const zv = dna.zVolume;
  if (r.ornate) {
    out.push(
      ...makeStandoffArmor(r, "prim", 0.34 * t, 0.2, 0.06 * zv * 0.6, 0, 0.01, 0.13, 0.035),
      // central sculpted mass — wedge, not a lid
      Wedge("prim", 0.2 * t, 0.15, 0.05 * zv, 0, 0.02, 0.15, 0.2, 0, 0),
      B("sec", 0.26 * t, 0.14, 0.04, 0, 0.01, 0.18 + 0.03 * zv),
      // cross-combined cylindrical intake stack over the square plate
      C("dark", 0.05 * t, 0.05 * t, 0.06 * zv, 0, -0.03, 0.16, Math.PI / 2, 0, 0, 12),
      C("glow", 0.03 * t, 0.03 * t, 0.02, 0, -0.03, 0.16 + 0.03 * zv, Math.PI / 2, 0, 0, 10),
    );
  } else {
    out.push(
      B("prim", 0.3 * t, 0.16, 0.05 * zv * 0.7, 0, 0.01, 0.13),
      Wedge("prim", 0.18 * t, 0.13, 0.045 * zv, 0, 0.02, 0.15, 0.18, 0, 0),
      C("dark", 0.045 * t, 0.045 * t, 0.05 * zv, 0, -0.03, 0.15, Math.PI / 2, 0, 0, 10),
    );
  }

  return out;
}

/**
 * Pectoral Armor (Left / Right Breastplates).
 * Features multi-tier dimensional air intake vents and layered armor plates.
 */
export function pec(r: Recipe, _isLeft: boolean): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];
  // Built canonically (angled outward, +X); buildPart mirrors the pecL slot so
  // the breastplates are a true mirror instead of both angled the same way.
  const ang = 0.18;

  out.push(
    Trap("prim", 0.14 * t, 0.16, 0.06, 0, 0, 0.02, 0.15, ang, 0),
    B("dark", 0.045 * t, 0.085, 0.05, 0.03, 0, 0.03, 0.15, ang, 0),
  );

  // multi-tier cooling vent fins, flush on the duct housing
  out.push(
    B("metal", 0.04 * t, 0.008, 0.03, 0.03, 0.025, 0.045, 0.15, ang, 0),
    B("metal", 0.04 * t, 0.008, 0.03, 0.03, 0, 0.045, 0.15, ang, 0),
    B("metal", 0.04 * t, 0.008, 0.03, 0.03, -0.025, 0.045, 0.15, ang, 0),
  );

  if (r.ornate) {
    out.push(
      Trap("sec", 0.11 * t, 0.12, 0.03, 0, 0.01, 0.05, 0.15, ang, 0),
      B("trim", 0.12 * t, 0.015, 0.04, 0, 0.07, 0.045, 0.15, ang, 0),
      // auxiliary sensor — framed, seated on the applique
      ...lume("glow", 0.007, 0.016, 0.045, 0.05, 0.052, 0.15 + Math.PI / 2, 0, ang, 8),
    );
  }

  return out;
}

/**
 * Cockpit (Piloting Hatch / Avionics Bay).
 */
export function cockpit(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Heavy Armored Cockpit Hatch (Wedge shaped sloped armor)
  out.push(
    Wedge("prim", 0.14 * t, 0.18, 0.12, 0, 0, 0.02, 0.25, 0, 0),
    // blast-shield slit with a framed telemetry lens set into it
    B("dark", 0.08 * t, 0.035, 0.06, 0, 0.04, 0.06, 0.25, 0, 0),
    B("glow", 0.05 * t, 0.012, 0.02, 0, 0.042, 0.078, 0.25, 0, 0),
    // Emergency release latch & hinge pin
    C("metal", 0.01, 0.01, 0.12 * t, 0, -0.06, 0.03, 0, 0, Math.PI / 2, 6),
    B("acc", 0.02 * t, 0.03, 0.03, 0, -0.06, 0.05),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.1 * t, 0.12, 0.04, 0, 0.01, 0.08, 0.25, 0, 0),
    );
  }

  return out;
}

/**
 * Abdomen (Lumbar Spine & Torso Yaw/Pitch Actuators).
 * Transformers style:
 * Exposed spine vertebrae with dual heavy hydraulic lumbar pistons!
 */
export function abdomen(r: Recipe): Spec[] {
  const t = r.thick;
  const h = r.height;
  const s = r.segs;
  const out: Spec[] = [];

  const abdLen = 0.16 * h;

  // Central Vertebral Column (Articulated spine segments)
  for (let i = 0; i < 3; i++) {
    const yOff = -abdLen * 0.35 + i * (abdLen * 0.35);
    out.push(
      C("joint", 0.07 * t, 0.07 * t, 0.04, 0, yOff, 0, 0, 0, 0, Math.max(8, s)),
      B("dark", 0.09 * t, 0.03, 0.11, 0, yOff, -0.01),
    );
  }

  // Dual Heavy Hydraulic Lumbar Actuators (Left & Right pitch/roll cylinders)
  const pistonSpan = 0.065 * t;
  out.push(
    ...makeServoActuator("dark", "metal", pistonSpan, 0, 0.035, abdLen * 0.9, 0.018 * t, 0.15, 0, -0.15, Math.max(8, s)),
    ...makeServoActuator("dark", "metal", -pistonSpan, 0, 0.035, abdLen * 0.9, 0.018 * t, 0.15, 0, 0.15, Math.max(8, s)),
  );

  // Flexible Cable Conduit Loom / Hydraulic Feed Line
  out.push(
    Torus("dark", 0.08 * t, 0.01, 0, 0, -0.04, 0, Math.PI / 2, 0),
  );

  // Abdominal Armor Plating (A~L vs M~Z)
  if (r.ornate) {
    out.push(
      // Floating abdominal segmented plates
      ...makeStandoffArmor(r, "prim", 0.15 * t, abdLen * 0.7, 0.04, 0, 0, 0.07, 0.025),
      B("sec", 0.18 * t, abdLen * 0.45, 0.08, 0, 0, 0.02),
    );
  } else {
    // A~L: Bare skeletal lumbar cage
    out.push(
      B("prim", 0.16 * t, 0.03, 0.12, 0, 0, 0.04),
    );
  }

  return out;
}

/**
 * Pelvis (Pelvic Structural Girder & Hip Mounting Yokes).
 */
export function pelvis(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Heavy Pelvic Girder Base
  out.push(
    B("dark", 0.28 * t, 0.11, 0.22, 0, 0, 0),
    // Center groin strike block (Wedge)
    Wedge("prim", 0.12 * t, 0.13, 0.12, 0, -0.01, 0.05, 0.25, 0, 0),
    B("sec", 0.06 * t, 0.08, 0.05, 0, -0.02, 0.09, 0.25, 0, 0),
  );

  // Left & Right Hip Pivot Clevises
  out.push(
    C("metal", 0.018, 0.018, 0.3 * t, 0, -0.03, 0, 0, 0, Math.PI / 2, 8),
  );

  if (r.ornate) {
    out.push(
      B("trim", 0.26 * t, 0.018, 0.16, 0, 0.05, 0),
    );
  }

  return out;
}

/**
 * Skirt Armor (Front, Back, Side).
 * Layered multi-panel armor plates with articulated hinges and sub-plates.
 */
export function skirtF(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Skirt Hinge Pin Assembly
  out.push(
    C("metal", 0.008, 0.008, 0.18 * t, 0, 0.04, 0.03, 0, 0, Math.PI / 2, 6),
    // Center groin armor block
    B("dark", 0.04 * t, 0.06, 0.03, 0, 0.02, 0.04, -0.25, 0, 0),
  );

  // Dual-split Front Skirt Plates (Layer 1: Main armor flaps Left & Right)
  const flapW = 0.09 * t;
  const flapH = 0.14;
  const flapD = 0.03;
  const flapX = 0.052 * t;

  out.push(
    // Left Skirt Flap
    Trap("prim", flapW, flapH, flapD, -flapX, -0.03, 0.04, -0.25, 0, -0.05),
    // Right Skirt Flap
    Trap("prim", flapW, flapH, flapD, flapX, -0.03, 0.04, -0.25, 0, 0.05),
  );

  // Layer 2: Sub-armor reinforced strike plates
  if (r.ornate) {
    out.push(
      Trap("sec", flapW * 0.75, flapH * 0.65, 0.02, -flapX, -0.04, 0.055, -0.25, 0, -0.05),
      Trap("sec", flapW * 0.75, flapH * 0.65, 0.02, flapX, -0.04, 0.055, -0.25, 0, 0.05),
      B("trim", 0.16 * t, 0.012, 0.025, 0, 0.015, 0.045, -0.25, 0, 0),
    );
  }

  return out;
}

export function skirtB(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Rear Skirt Hinge
  out.push(
    C("metal", 0.008, 0.008, 0.18 * t, 0, 0.04, -0.03, 0, 0, Math.PI / 2, 6),
    // Main Rear Skirt Plate (Trapezoid sloped downward)
    Trap("prim", 0.20 * t, 0.15, 0.035, 0, -0.03, -0.04, 0.25, 0, 0),
  );

  if (r.ornate) {
    // rear deflector + twin thruster bells housed under the skirt lip
    out.push(
      Trap("sec", 0.15 * t, 0.1, 0.025, 0, -0.035, -0.06, 0.25, 0, 0),
      ...makeThrusterBell("metal", 0.022, 0.05, -0.05 * t, -0.05, -0.05, -0.5, 0, 0, 8),
      ...makeThrusterBell("metal", 0.022, 0.05, 0.05 * t, -0.05, -0.05, -0.5, 0, 0, 8),
    );
  }

  return out;
}

export function skirtS(r: Recipe, _isLeft: boolean): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];
  // Canonical build; buildPart mirrors the skirtL slot.
  out.push(
    C("metal", 0.008, 0.008, 0.08, 0, 0.03, 0, 0.2, 0, 0, 6),
    B("prim", 0.035, 0.14, 0.16 * t, 0.02, -0.04, 0, 0, 0, 0.25),
  );

  if (r.ornate) {
    out.push(B("sec", 0.025, 0.09, 0.11 * t, 0.035, -0.04, 0, 0, 0, 0.25));
  }

  return out;
}
