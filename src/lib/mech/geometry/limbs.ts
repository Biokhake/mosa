import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  Sp,
  makeServoActuator,
  makeRotaryServo,
  makeSkeletalTruss,
  makeStandoffArmor,
  makeCoolingFins,
} from "./primitives";

/**
 * Shoulder (Shoulder Gimbal & Pauldron).
 * Transformers & Servo Actuator style:
 * Exposed 2-axis gimbal actuator, twin elevation pistons, structural truss cage,
 * layered with standoff armor plates for M~Z.
 */
export function shoulder(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Main Shoulder Rotary Elevation Servo Hub
  const hubRad = 0.065 * t;
  out.push(...makeRotaryServo("joint", "metal", 0, 0, 0, hubRad, 0.08 * t, 0, 0, Math.PI / 2, s));

  // Twin Elevation Hydraulic Servo Actuators
  out.push(
    ...makeServoActuator("dark", "metal", 0.03 * t, -0.04, 0.02, 0.13, 0.015, 0.25, 0, 0, Math.max(8, s)),
    ...makeServoActuator("dark", "metal", -0.03 * t, -0.04, 0.02, 0.13, 0.015, 0.25, 0, 0, Math.max(8, s)),
  );

  // Skeletal Pauldron Frame (Exoskeleton chassis cage over the shoulder)
  out.push(
    // Primary shoulder bracket arch
    B("dark", 0.18 * t, 0.05, 0.17, 0, 0.06, 0),
    // Flange bolts
    C("metal", 0.01, 0.01, 0.19 * t, 0, 0.06, 0, 0, 0, Math.PI / 2, 6),
  );

  // Pauldron Cowl (A~L vs M~Z)
  if (r.ornate) {
    // M~Z: Multi-layered floating pauldron armor with standoffs & auxiliary thruster
    out.push(
      ...makeStandoffArmor(
        r,
        "prim",
        0.24 * t,
        0.14,
        0.18,
        0,
        0.08,
        0,
        0.035,
      ),
      // Outer deflector plate
      B("sec", 0.22 * t, 0.08, 0.2, 0, 0.09, 0),
      // Shoulder thruster nozzle / reaction control port
      C("dark", 0.026, 0.034, 0.05, 0.12 * t, 0.08, 0, 0, 0, Math.PI / 2, 10),
      C("dark", 0.015, 0.015, 0.01, 0.14 * t, 0.08, 0, 0, 0, Math.PI / 2, 8),
      B("trim", 0.25 * t, 0.016, 0.15, 0, 0.15, 0),
    );
  } else {
    // A~L: Skeletal roll-cage frame exposing the inner gimbal mechanism
    out.push(
      B("prim", 0.19 * t, 0.065, 0.16, 0, 0.07, 0),
      B("dark", 0.13 * t, 0.045, 0.18, 0, 0.07, 0),
      // Open frame lightening cutout
      C("metal", 0.009, 0.009, 0.16, 0, 0.09, 0, Math.PI / 2, 0, 0, 8),
    );
  }

  return out;
}

/**
 * Upper Arm (Bicep / Tricep Frame).
 * Transformers style:
 * Exposed structural spine beam with exposed bicep/tricep linear servo actuators.
 */
export function upper(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const h = r.height;
  const s = r.segs;
  const out: Spec[] = [];

  const armLen = 0.22 * h;

  // Central Structural Bone Chassis (Lightened frame beam)
  out.push(...makeSkeletalTruss("dark", "joint", 0.09 * t, armLen, 0.09 * t, 0, 0, 0));

  // Front Exposed Bicep Servo Actuator (Hydraulic cylinder + chrome rod)
  out.push(
    ...makeServoActuator("dark", "metal", 0, 0, 0.036 * t, armLen * 0.9, 0.018 * t, 0, 0, 0, Math.max(8, s)),
  );

  // Rear Tricep Assist Rod
  out.push(
    ...makeServoActuator("dark", "metal", 0, 0, -0.036 * t, armLen * 0.85, 0.015 * t, 0, 0, 0, Math.max(8, s)),
  );

  // Exoskeleton Hydraulic Conduit / Harness
  out.push(
    C("dark", 0.008, 0.008, armLen * 0.88, -0.048 * t, 0, 0, 0, 0, 0, 8),
    C("trim", 0.011, 0.011, 0.015, -0.048 * t, 0.04, 0, 0, 0, 0, 8),
    C("trim", 0.011, 0.011, 0.015, -0.048 * t, -0.04, 0, 0, 0, 0, 8),
  );

  // Armor Plating (A~L vs M~Z)
  if (r.ornate) {
    // M~Z: Floating bicep armor sleeve with open cutout displaying the chrome actuator inside
    out.push(
      ...makeStandoffArmor(r, "prim", 0.11 * t, armLen * 0.65, 0.05, 0, 0, 0.045 * t, 0.025),
      B("sec", 0.13 * t, armLen * 0.5, 0.08 * t, 0, 0, 0),
      B("trim", 0.135 * t, 0.014, 0.07 * t, 0, armLen * 0.26, 0),
    );
  } else {
    // A~L: Minimal skeletal retention clamps
    out.push(
      B("prim", 0.1 * t, 0.035, 0.1 * t, 0, armLen * 0.28, 0),
      B("prim", 0.1 * t, 0.035, 0.1 * t, 0, -armLen * 0.28, 0),
    );
  }

  return out;
}

/**
 * Forearm (Radius / Ulna Dual-Beam Frame).
 * Dual chassis rails, exposed wrist actuator motor, and cable guides.
 */
export function forearm(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const h = r.height;
  const s = r.segs;
  const out: Spec[] = [];

  const armLen = 0.2 * h;

  // Dual Structural Bone Rails (Radius & Ulna)
  const railSpan = 0.036 * t;
  out.push(
    C("dark", 0.02 * t, 0.02 * t, armLen, railSpan, 0, 0, 0, 0, 0, Math.max(8, s)),
    C("dark", 0.02 * t, 0.02 * t, armLen, -railSpan, 0, 0, 0, 0, 0, Math.max(8, s)),
  );

  // Center Wrist Rotary Servo Motor Drum
  out.push(...makeRotaryServo("joint", "metal", 0, -armLen * 0.38, 0, 0.042 * t, 0.065 * t, 0, 0, 0, s));

  // Exposed Forearm Flexor Actuator (Front Piston)
  out.push(
    ...makeServoActuator("dark", "metal", 0, 0, 0.032 * t, armLen * 0.85, 0.016 * t, 0, 0, 0, Math.max(8, s)),
  );

  // Armor Cowling (A~L vs M~Z)
  if (r.ornate) {
    out.push(
      ...makeStandoffArmor(r, "prim", 0.12 * t, armLen * 0.72, 0.06, 0, 0, 0.042 * t, 0.028),
      B("sec", 0.14 * t, armLen * 0.55, 0.11 * t, 0, 0.02, 0),
      ...makeCoolingFins("metal", 0.09 * t, 0.05, 0.02, 0, 0.03, -0.055 * t, 3, "y"),
      // NATO Picatinny Hardpoint Mount Rail
      B("dark", 0.025 * t, armLen * 0.45, 0.02, 0, 0, 0.065 * t),
      B("metal", 0.032 * t, 0.012, 0.025, 0, armLen * 0.15, 0.065 * t),
      B("metal", 0.032 * t, 0.012, 0.025, 0, 0, 0.065 * t),
      B("metal", 0.032 * t, 0.012, 0.025, 0, -armLen * 0.15, 0.065 * t),
    );
  } else {
    out.push(
      B("prim", 0.11 * t, armLen * 0.5, 0.09 * t, 0, 0, 0),
      // Open window revealing the inner dual rails and piston
      B("dark", 0.07 * t, armLen * 0.35, 0.11 * t, 0, 0, 0),
      // Hardpoint mount wedge
      B("metal", 0.025 * t, armLen * 0.25, 0.018, 0, 0, 0.055 * t),
    );
  }

  return out;
}

/**
 * Vambrace (Forearm Armor Cuff & Equipment Hardpoint).
 */
export function vambrace(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  if (r.ornate) {
    // M~Z: Standoff strike shield plate with equipment mounting rail
    out.push(
      B("prim", 0.13 * t, 0.14, 0.045, 0, 0, 0.04, 0.1, 0, 0),
      B("sec", 0.09 * t, 0.16, 0.035, 0, 0, 0.05, 0.1, 0, 0),
      // Equipment Hardpoint NATO / Picatinny rail slots
      B("dark", 0.03 * t, 0.12, 0.02, 0, 0, 0.07),
      B("metal", 0.04 * t, 0.015, 0.025, 0, 0.04, 0.07),
      B("metal", 0.04 * t, 0.015, 0.025, 0, -0.04, 0.07),
    );
  } else {
    // A~L: Functional clamp collar with sensor module
    out.push(
      B("prim", 0.11 * t, 0.1, 0.04, 0, 0, 0.03),
      C("metal", 0.01, 0.01, 0.12 * t, 0, 0, 0.03, 0, 0, Math.PI / 2, 6),
    );
  }

  return out;
}

/**
 * Hand (Articulated Robotic Manipulator).
 * Real robotics style:
 * Palm chassis, wrist gimbal pin, segmented thumb, and 4 individual knuckle/finger joints!
 */
export function hand(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];

  // Wrist Ball / Gimbal Coupler
  out.push(
    Sp("joint", 0.032 * t, 0, 0.04, 0, Math.max(8, s)),
    C("metal", 0.012, 0.012, 0.07 * t, 0, 0.04, 0, 0, 0, Math.PI / 2, 6),
  );

  // Central Palm Chassis (Lightweight metal core)
  out.push(
    B("dark", 0.08 * t, 0.07, 0.055, 0, 0, 0),
    // Backhand protective armor plate
    B("prim", 0.085 * t, 0.065, 0.025, 0, 0, 0.028),
  );

  // Knuckle Pivot Bar
  out.push(
    C("metal", 0.01, 0.01, 0.082 * t, 0, -0.032, 0.005, 0, 0, Math.PI / 2, 8),
  );

  // 4 Articulated Fingers (Segmented phalanxes)
  const fingerSpan = 0.02 * t;
  for (let i = 0; i < 4; i++) {
    const fx = (i - 1.5) * fingerSpan;
    // Proximal Phalanx
    out.push(
      B("joint", 0.014 * t, 0.032, 0.022, fx, -0.052, 0.005, 0.25, 0, 0),
      // Intermediate / Distal Phalanx (curled in grip)
      B("dark", 0.012 * t, 0.026, 0.018, fx, -0.068, -0.012, 0.85, 0, 0),
      // Finger Tip Contact Pad (High-friction grip)
      B("metal", 0.01 * t, 0.012, 0.014, fx, -0.078, -0.025, 0.85, 0, 0),
    );
  }

  // Articulated Opposable Thumb (Multi-axis servo base)
  out.push(
    // Thumb rotatory saddle joint
    Sp("joint", 0.012 * t, -0.042 * t, -0.01, 0.015, 8),
    // Thumb proximal segment
    B("joint", 0.014 * t, 0.03, 0.02, -0.045 * t, -0.03, 0.022, 0.35, 0, -0.45),
    // Thumb tip pad
    B("metal", 0.012 * t, 0.02, 0.016, -0.048 * t, -0.045, 0.032, 0.75, 0, -0.45),
  );

  if (r.ornate) {
    out.push(
      B("trim", 0.055 * t, 0.04, 0.015, 0, 0.005, 0.038),
    );
  }

  return out;
}

/**
 * Thigh (Femur Chassis & Quadricep Linear Actuators).
 * Transformers style:
 * Heavy structural frame with dual front hydraulic cylinders and rear assist piston.
 */
export function thigh(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const h = r.height;
  const s = r.segs;
  const out: Spec[] = [];

  const thighLen = 0.28 * h;

  // Main Femur Spine Beam (Skeletal truss with lightening holes)
  out.push(...makeSkeletalTruss("dark", "joint", 0.12 * t, thighLen, 0.13 * t, 0, 0, 0));

  // Dual Front Quadricep Hydraulic Assist Actuators (Left & Right)
  const cylSpan = 0.032 * t;
  out.push(
    ...makeServoActuator("dark", "metal", cylSpan, 0, 0.055 * t, thighLen * 0.88, 0.02 * t, 0, 0, 0, Math.max(8, s)),
    ...makeServoActuator("dark", "metal", -cylSpan, 0, 0.055 * t, thighLen * 0.88, 0.02 * t, 0, 0, 0, Math.max(8, s)),
  );

  // Rear Hamstring Assist Piston
  out.push(
    ...makeServoActuator("dark", "metal", 0, 0, -0.055 * t, thighLen * 0.82, 0.022 * t, 0, 0, 0, Math.max(8, s)),
  );

  // Hydraulic Fluid Manifold & Armor (A~L vs M~Z)
  if (r.ornate) {
    // M~Z: Floating multi-layer thigh armor plates mounted on standoffs
    out.push(
      ...makeStandoffArmor(r, "prim", 0.15 * t, thighLen * 0.75, 0.07, 0, 0, 0.065 * t, 0.032),
      B("sec", 0.17 * t, thighLen * 0.6, 0.13 * t, 0, 0.02, 0),
      // Side armor skirt plate
      B("trim", 0.016, thighLen * 0.5, 0.11 * t, 0.09 * t, 0, 0, 0, 0, 0.15),
    );
  } else {
    // A~L: Pure skeletal frame with structural bracing collars
    out.push(
      B("prim", 0.14 * t, 0.045, 0.14 * t, 0, thighLen * 0.3, 0),
      B("prim", 0.14 * t, 0.045, 0.14 * t, 0, -thighLen * 0.3, 0),
    );
  }

  return out;
}

/**
 * Shin (Tibia / Fibula Frame & Calf Thrusters).
 * Dual heavy chassis beams, exposed calf actuator pistons, and layered shinguard.
 */
export function shin(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const h = r.height;
  const s = r.segs;
  const out: Spec[] = [];

  const shinLen = 0.3 * h;

  // Dual Structural Chassis Beams (Tibia & Fibula)
  const beamSpan = 0.042 * t;
  out.push(
    C("dark", 0.025 * t, 0.025 * t, shinLen, beamSpan, 0, 0, 0, 0, 0, Math.max(8, s)),
    C("dark", 0.025 * t, 0.025 * t, shinLen, -beamSpan, 0, 0, 0, 0, 0, Math.max(8, s)),
  );

  // Center Linear Calf Servo Actuator
  out.push(
    ...makeServoActuator("dark", "metal", 0, 0, -0.045 * t, shinLen * 0.82, 0.022 * t, -0.15, 0, 0, Math.max(8, s)),
  );

  // Rear Calf Thruster Nozzle
  out.push(
    C("dark", 0.035 * t, 0.045 * t, 0.08, 0, -shinLen * 0.15, -0.07 * t, 0.35, 0, 0, 10),
    C("dark", 0.02 * t, 0.02 * t, 0.02, 0, -shinLen * 0.15, -0.075 * t, 0.35, 0, 0, 8),
  );

  // Shinguard Plating (A~L vs M~Z)
  if (r.ornate) {
    // M~Z: Multi-layered faceted shinguard with reactive armor blocks & lateral aerodynamic cowls
    out.push(
      ...makeStandoffArmor(r, "prim", 0.16 * t, shinLen * 0.8, 0.07, 0, 0, 0.065 * t, 0.035, -0.1, 0, 0),
      B("sec", 0.18 * t, shinLen * 0.65, 0.14 * t, 0, 0.02, 0),
      // Strike ridge
      B("acc", 0.04 * t, shinLen * 0.5, 0.04, 0, 0.03, 0.09 * t, -0.1, 0, 0),
      // Lateral calf winglets
      B("trim", 0.016, shinLen * 0.45, 0.12 * t, 0.11 * t, -0.02, -0.02, 0, 0, 0.2),
    );
  } else {
    // A~L: Skeletal front shin bracket exposing the twin beams inside
    out.push(
      B("prim", 0.13 * t, shinLen * 0.65, 0.05, 0, 0, 0.045 * t, -0.1, 0, 0),
      B("dark", 0.08 * t, shinLen * 0.45, 0.06, 0, 0, 0.045 * t, -0.1, 0, 0),
    );
  }

  return out;
}

/**
 * Foot (Split Articulated Suspension Foot).
 * Heavy industrial robotics style:
 * Front toe pad hinge, rear heel shock suspension, high-grip sole treads.
 */
export function foot(r: Recipe, _isLeft = false): Spec[] {
  const t = r.thick;
  const out: Spec[] = [];

  // Ankle Clevis Mount & Main Pivot Pin
  out.push(
    C("metal", 0.016, 0.016, 0.11 * t, 0, 0.03, 0.01, 0, 0, Math.PI / 2, 8),
    B("dark", 0.1 * t, 0.045, 0.08, 0, 0.025, 0.01),
  );

  // Rear Heel Shock Suspension Assembly (Twin spring/piston dampers)
  out.push(
    ...makeServoActuator("dark", "metal", 0.03 * t, 0.01, -0.08, 0.09, 0.014, 0.35, 0, 0, 8),
    ...makeServoActuator("dark", "metal", -0.03 * t, 0.01, -0.08, 0.09, 0.014, 0.35, 0, 0, 8),
    // Heel pad
    B("dark", 0.12 * t, 0.035, 0.09, 0, -0.025, -0.08),
  );

  // Front Articulated Toe Pad
  out.push(
    // Toe articulation hinge pin
    C("metal", 0.012, 0.012, 0.12 * t, 0, -0.01, 0.06, 0, 0, Math.PI / 2, 6),
    // Front foot bridge
    B("prim", 0.13 * t, 0.04, 0.12, 0, -0.015, 0.07, -0.15, 0, 0),
    // Toe tip cap
    B("dark", 0.12 * t, 0.035, 0.08, 0, -0.025, 0.15, -0.15, 0, 0),
  );

  // Industrial High-Grip Sole Treads (Bottom)
  for (let i = 0; i < 4; i++) {
    const tz = -0.1 + i * 0.075;
    out.push(
      B("joint", 0.125 * t, 0.01, 0.025, 0, -0.045, tz),
    );
  }

  if (r.ornate) {
    // Upper foot armor carapace
    out.push(
      B("sec", 0.11 * t, 0.03, 0.1, 0, 0.015, 0.05, -0.25, 0, 0),
      B("trim", 0.08 * t, 0.015, 0.08, 0, 0.028, 0.05, -0.25, 0, 0),
    );
  }

  return out;
}
