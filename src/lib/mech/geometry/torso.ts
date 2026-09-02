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
} from "./primitives";

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

  // Front Armor (A~L vs M~Z)
  if (r.ornate) {
    out.push(
      ...makeStandoffArmor(r, "prim", 0.34 * t, 0.2, 0.06, 0, 0.01, 0.13, 0.035),
      B("sec", 0.26 * t, 0.14, 0.04, 0, 0.01, 0.18),
    );
  } else {
    out.push(
      B("prim", 0.3 * t, 0.16, 0.04, 0, 0.01, 0.13),
    );
  }

  return out;
}

/**
 * Pectoral Armor (Left / Right Breastplates).
 */
export function pec(r: Recipe, isLeft: boolean): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];
  const sign = isLeft ? -1 : 1;

  out.push(
    // Angled pectoral strike plate (Trapezoid)
    Trap("prim", 0.14 * t, 0.16, 0.06, 0, 0, 0.02, 0.15, sign * 0.18, 0),
    // Intake duct
    B("dark", 0.04 * t, 0.08, 0.05, sign * 0.03, 0, 0.03, 0.15, sign * 0.18, 0),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.1 * t, 0.12, 0.03, 0, 0.01, 0.045, 0.15, sign * 0.18, 0),
      B("trim", 0.12 * t, 0.015, 0.04, 0, 0.07, 0.045, 0.15, sign * 0.18, 0),
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
    // Blast shield visor slit / telemetry port
    B("dark", 0.08 * t, 0.035, 0.08, 0, 0.04, 0.06, 0.25, 0, 0),
    C("glow", 0.009, 0.009, 0.06, 0, 0.04, 0.08, Math.PI / 2, 0, 0, 8),
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
 */
export function skirtF(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Front Skirt Plate (Hinged at top)
  out.push(
    // Skirt Hinge Pin
    C("metal", 0.008, 0.008, 0.18 * t, 0, 0.04, 0.03, 0, 0, Math.PI / 2, 6),
    // Main Skirt Armor (Trapezoid)
    Trap("prim", 0.19 * t, 0.14, 0.035, 0, -0.03, 0.04, -0.25, 0, 0),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.13 * t, 0.09, 0.025, 0, -0.03, 0.06, -0.25, 0, 0),
      B("trim", 0.15 * t, 0.012, 0.03, 0, 0.01, 0.05, -0.25, 0, 0),
    );
  }

  return out;
}

export function skirtB(r: Recipe): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  out.push(
    C("metal", 0.008, 0.008, 0.18 * t, 0, 0.04, -0.03, 0, 0, Math.PI / 2, 6),
    B("prim", 0.2 * t, 0.15, 0.035, 0, -0.03, -0.04, 0.25, 0, 0),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.14 * t, 0.1, 0.025, 0, -0.03, -0.06, 0.25, 0, 0),
    );
  }

  return out;
}

export function skirtS(r: Recipe, isLeft: boolean): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];
  const sign = isLeft ? -1 : 1;

  out.push(
    C("metal", 0.008, 0.008, 0.08, 0, 0.03, 0, 0.2, 0, 0, 6),
    B("prim", 0.035, 0.14, 0.16 * t, sign * 0.02, -0.04, 0, 0, 0, sign * 0.25),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.025, 0.09, 0.11 * t, sign * 0.035, -0.04, 0, 0, 0, sign * 0.25),
    );
  }

  return out;
}
