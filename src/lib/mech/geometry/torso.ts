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

  // Twin Cervical Linear Tilt Actuators — short, tucked under the armor rim
  out.push(
    ...makeServoActuator("dark", "metal", 0.045 * t, -0.01, 0.015, 0.055, 0.011, 0.25, 0, 0, 8),
    ...makeServoActuator("dark", "metal", -0.045 * t, -0.01, 0.015, 0.055, 0.011, 0.25, 0, 0, 8),
  );

  // Collar Armor Rim
  out.push(
    B("prim", 0.22 * t, 0.05, 0.18, 0, 0, 0),
  );

  // --- Clavicle struts -------------------------------------------------------
  // The arm groups are pinned to FIXED shoulder sockets (x ±0.30, y 1.48). A
  // narrow thorax otherwise leaves the pauldron hanging in space with nothing
  // joining it to the body. These struts always span from the sternum out to
  // that socket, so there is a visible load path regardless of torso width.
  {
    const SOCK_X = 0.3; // must track SLOT_BY_ID.shoulderR socket x
    const dy = 1.48 - 1.62; // shoulder socket relative to the collar socket
    const dz = 0 - 0.02;
    for (const sgn of [-1, 1] as const) {
      const innerX = sgn * 0.1;
      const outerX = sgn * SOCK_X;
      const midX = (innerX + outerX) / 2;
      const len = Math.abs(outerX - innerX) + 0.06;
      out.push(
        B("dark", len, 0.05, 0.1, midX, dy * 0.55, dz, 0, 0, sgn * 0.05),
        C("metal", 0.05, 0.07, 0.1, outerX, dy, dz, 0, 0, Math.PI / 2, s),
        Torus("joint", 0.06, 0.014, outerX, dy, dz, 0, Math.PI / 2, 0),
      );
    }
  }

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
  // A solid seated breastplate (never a lid on studs) + a sculpted central
  // mass + one framed intake. Ornate kits get a thicker layered plate.
  const plateD = Math.max(0.045, 0.05 * zv * (r.ornate ? 1 : 0.8));
  out.push(
    B("prim", (r.ornate ? 0.32 : 0.3) * t, 0.18, plateD, 0, 0.01, 0.12),
    Wedge("prim", 0.19 * t, 0.14, 0.05 * zv, 0, 0.02, 0.12 + plateD * 0.4, 0.18, 0, 0),
    // framed central intake, recessed into the plate
    C("dark", 0.052 * t, 0.052 * t, 0.06 * zv, 0, -0.03, 0.12 + plateD * 0.2, Math.PI / 2, 0, 0, 12),
    C("dark", 0.03 * t, 0.03 * t, 0.05 * zv, 0, -0.03, 0.12 + plateD * 0.2, Math.PI / 2, 0, 0, 10),
  );
  if (r.ornate) {
    out.push(B("sec", 0.24 * t, 0.12, 0.035, 0, 0.06, 0.12 + plateD * 0.55));
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
      ...lume("metal", 0.007, 0.016, 0.045, 0.05, 0.052, 0.15 + Math.PI / 2, 0, ang, 8),
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

  // Abdominal Armor Plating — a solid seated plate, thicker + layered for M~Z.
  if (r.ornate) {
    out.push(
      B("prim", 0.17 * t, abdLen * 0.7, 0.055, 0, 0, 0.055),
      B("sec", 0.13 * t, abdLen * 0.5, 0.03, 0, 0, 0.085),
    );
  } else {
    out.push(B("prim", 0.16 * t, 0.03, 0.1, 0, 0, 0.045));
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
    // rear deflector + twin thruster bells set into its underside
    out.push(
      Trap("sec", 0.15 * t, 0.1, 0.03, 0, -0.035, -0.055, 0.25, 0, 0),
      ...makeThrusterBell("metal", 0.02, 0.045, -0.045 * t, -0.055, -0.055, Math.PI - 0.35, 0, 0, 8),
      ...makeThrusterBell("metal", 0.02, 0.045, 0.045 * t, -0.055, -0.055, Math.PI - 0.35, 0, 0, 8),
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
