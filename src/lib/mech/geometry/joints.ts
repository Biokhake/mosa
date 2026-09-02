import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  Sp,
  Torus,
  Wedge,
  Trap,
  makeServoActuator,
  makeRotaryServo,
  makeHingeBracket,
  makeStandoffArmor,
} from "./primitives";

/**
 * Elbow Joint Generator (Transformers & Servo Actuator style).
 * Detailed multi-part interlocking mechanical hinge with exposed rotary actuator,
 * auxiliary linear servo cylinder, pivot pin, and mechanical limiters.
 */
export function elbow(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Main Rotary Servo Actuator Drum (aligned along X-axis for flexion/extension)
  const servoRad = 0.048 * t;
  const servoWidth = 0.095 * t;
  out.push(...makeRotaryServo("joint", "metal", 0, 0, 0, servoRad, servoWidth, 0, 0, Math.PI / 2, s));

  // Interlocking Clevis Hinge Brackets (flanking the servo drum)
  out.push(...makeHingeBracket("dark", "metal", 0, 0, 0, servoWidth * 1.15, servoRad * 2.1, servoRad * 2.2));

  // Auxiliary Linear Servo Piston (exposed on forearm/upper arm linkage)
  // Mounted slightly angled on the posterior/lateral side
  const pistonLen = 0.14 * r.height;
  const pistonRad = 0.016 * t;
  out.push(
    ...makeServoActuator(
      "dark",
      "metal",
      0.038 * t,
      -0.01,
      -0.025,
      pistonLen,
      pistonRad,
      0.22,
      0,
      -0.15,
      Math.max(8, s),
    ),
  );

  // Mechanical Angle Limiter / Spur (at the rear of the elbow)
  out.push(
    B("metal", 0.036 * t, 0.045, 0.055, 0, 0, -servoRad * 1.35),
    B("acc", 0.02 * t, 0.025, 0.03, 0, 0.015, -servoRad * 1.6),
  );

  // Hydraulic Hose / Cable Conduit loop running around the joint
  out.push(
    Torus("dark", servoRad * 0.95, 0.007, -0.04 * t, -0.01, 0, 0, Math.PI / 2, 0),
  );

  // A~L vs M~Z Armor Plating rule:
  // A~L: Bare functional frame with exposed cylinder and hinge
  // M~Z: Standoff armor plate hovering over the front/top of the elbow
  if (r.ornate) {
    out.push(
      ...makeStandoffArmor(
        r,
        "prim",
        0.075 * t,
        0.08,
        0.05,
        0,
        0.02,
        servoRad * 1.1,
        0.025,
      ),
    );
    // Additional lateral deflection fin
    out.push(
      B("trim", 0.012, 0.065, 0.07, 0.055 * t, 0.01, 0, 0.15, 0, 0.2),
    );
  } else {
    // Subtle structural bracket lip for A~L
    out.push(
      B("prim", 0.06 * t, 0.025, 0.065, 0, servoRad * 0.9, 0.01),
    );
  }

  return out;
}

/**
 * Knee Joint Generator (Transformers & Servo Actuator style).
 * Heavy-duty dual-hinge assembly with dual concentric rotary actuator drums,
 * twin linear hydraulic assist cylinders, articulated patella bracket,
 * and exposed structural chassis hardware.
 */
export function knee(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Dual Concentric Rotary Actuator Drums (left & right power hubs)
  const drumRad = 0.058 * t;
  const drumWidth = 0.042 * t;
  const drumSpan = 0.046 * t;

  out.push(
    ...makeRotaryServo("joint", "metal", drumSpan, 0, 0, drumRad, drumWidth, 0, 0, Math.PI / 2, s),
    ...makeRotaryServo("joint", "metal", -drumSpan, 0, 0, drumRad, drumWidth, 0, 0, Math.PI / 2, s),
  );

  // Central Structural Knuckle linking the drums
  out.push(
    B("dark", 0.055 * t, drumRad * 1.8, drumRad * 1.6, 0, 0, 0),
    // Heavy thru-axle bearing pin
    C("metal", drumRad * 0.32, drumRad * 0.32, drumSpan * 2.8, 0, 0, 0, 0, 0, Math.PI / 2, 12),
  );

  // Dual Rear Hydraulic / Servo Assist Actuators (visible from side & rear)
  const cylLen = 0.17 * r.height;
  const cylRad = 0.018 * t;
  out.push(
    ...makeServoActuator(
      "dark",
      "metal",
      drumSpan * 0.85,
      -0.02,
      -0.038,
      cylLen,
      cylRad,
      -0.28,
      0,
      0.08,
      Math.max(8, s),
    ),
    ...makeServoActuator(
      "dark",
      "metal",
      -drumSpan * 0.85,
      -0.02,
      -0.038,
      cylLen,
      cylRad,
      -0.28,
      0,
      -0.08,
      Math.max(8, s),
    ),
  );

  // Articulated Patella Frame Bracket (Front knee plate mounting linkage)
  // Dual linkage arms connecting thigh hinge to patella
  out.push(
    C("metal", 0.009, 0.009, 0.09, drumSpan * 0.7, 0.02, drumRad * 0.6, 0.65, 0, 0, 8),
    C("metal", 0.009, 0.009, 0.09, -drumSpan * 0.7, 0.02, drumRad * 0.6, 0.65, 0, 0, 8),
  );

  // Patella Guard (Front Knee Armor / Sensor)
  if (r.ornate) {
    // M~Z: Multi-layered geometric armor plate with reactive armor facets & standoffs
    out.push(
      ...makeStandoffArmor(
        r,
        "prim",
        0.11 * t,
        0.12,
        0.05,
        0,
        0.02,
        drumRad * 1.05,
        0.035,
        0.18,
        0,
        0,
      ),
      // Heavy center strike ridge (Wedge facet)
      Wedge("sec", 0.045 * t, 0.08, 0.065, 0, 0.02, drumRad * 1.45, 0.25, 0, 0),
      B("acc", 0.025 * t, 0.04, 0.035, 0, 0.06, drumRad * 1.5),
    );
  } else {
    // A~L: Practical skeletal frame knee cap with exposed bolts and recessed vents
    out.push(
      B("prim", 0.095 * t, 0.085, 0.04, 0, 0.015, drumRad * 0.95, 0.2, 0, 0),
      B("dark", 0.065 * t, 0.035, 0.03, 0, 0.015, drumRad * 1.1, 0.2, 0, 0),
      C("metal", 0.008, 0.008, 0.085 * t, 0, 0.05, drumRad * 0.85, 0, 0, Math.PI / 2, 8),
    );
  }

  // Flexible hydraulic line conduit running across joint side
  out.push(
    Torus("dark", drumRad * 0.85, 0.008, drumSpan + drumWidth * 0.5, 0, 0, 0, Math.PI / 2, 0),
  );

  return out;
}

/**
 * Hip Joint Generator.
 * 2-Axis rotary servo gimbal with universal joint yoke, cross-axis pins,
 * and elevation tilt cylinders.
 */
export function hip(r: Recipe, _isLeft = false): Spec[] {
  const h = r.hip;
  const s = r.segs;
  const out: Spec[] = [];

  // Main Turntable / Rotary Servo Housing
  const turnRad = 0.065 * h;
  out.push(...makeRotaryServo("joint", "metal", 0, 0, 0, turnRad, 0.08, 0, 0, Math.PI / 2, s));

  // Universal Joint Yoke Bracket
  out.push(
    B("dark", 0.11 * h, 0.09, 0.12, 0, 0.02, 0),
    // Flange mount bolts
    C("metal", 0.01, 0.01, 0.13, 0, 0.02, 0, Math.PI / 2, 0, 0, 6),
  );

  // Hip Linear Tilt Actuator
  out.push(
    ...makeServoActuator(
      "dark",
      "metal",
      0.035 * h,
      -0.02,
      0.02,
      0.14,
      0.016,
      0.2,
      0,
      0.15,
      Math.max(8, s),
    ),
  );

  // Skeletal pelvic socket cup
  out.push(
    B("prim", 0.12 * h, 0.08, 0.14, 0, 0.04, 0),
  );

  if (r.ornate) {
    out.push(
      B("sec", 0.08 * h, 0.04, 0.15, 0, 0.07, 0.02),
      B("trim", 0.13 * h, 0.018, 0.1, 0, 0.09, 0),
    );
  }

  return out;
}

/**
 * Ankle Joint Generator.
 * Dual-rocker universal hinge with twin shock absorbers and articulated clevis mount.
 */
export function ankle(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Spherical Rocker Pivot / Universal Ball Joint
  const ballRad = 0.042 * t;
  out.push(
    Sp("joint", ballRad, 0, 0, 0, Math.max(10, s)),
    // Cross-axis pivot hinge pin
    C("metal", 0.016, 0.016, 0.09 * t, 0, 0, 0, 0, 0, Math.PI / 2, 8),
  );

  // Twin Side Shock Absorber Struts (Left & Right)
  const strutRad = 0.012;
  const strutLen = 0.11;
  out.push(
    ...makeServoActuator("dark", "metal", 0.032 * t, 0.02, 0, strutLen, strutRad, 0.15, 0, -0.15, 8),
    ...makeServoActuator("dark", "metal", -0.032 * t, 0.02, 0, strutLen, strutRad, 0.15, 0, 0.15, 8),
  );

  // Base Ankle Clevis Bracket (anchoring to foot)
  out.push(
    B("dark", 0.085 * t, 0.04, 0.075, 0, -0.025, 0.01),
    C("metal", 0.012, 0.012, 0.08 * t, 0, -0.025, 0.01, 0, 0, Math.PI / 2, 6),
  );

  if (r.ornate) {
    // Front ankle shield plate (Trapezoid)
    out.push(
      Trap("prim", 0.08 * t, 0.06, 0.03, 0, 0.03, 0.045, -0.3, 0, 0),
      B("sec", 0.04 * t, 0.04, 0.02, 0, 0.04, 0.055, -0.3, 0, 0),
    );
  }

  return out;
}
