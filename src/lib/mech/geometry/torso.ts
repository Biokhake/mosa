import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  Torus,
  Wedge,
  Trap,
  Capsule,
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
/**
 * Collar — the NECK ring only. Six shells: three angular (S-class), three
 * curved (R-class), picked by the kit's major axis + a DNA roll.
 *
 * RANGE-OF-MOTION BUDGET (collar-local; the neck rises along +Y, +Z is front):
 *   - nothing solid within R 0.11 of the neck axis above y = +0.045
 *   - the front stays low (y <= 0) and shallow (z <= +0.085) so a lowered chin
 *     clears it
 *   - "popped" nape / side pieces are allowed, but only OUTBOARD (|x| >= 0.09)
 *     or BEHIND (z <= -0.04) and never above y = +0.05, so head pitch-back and
 *     yaw sweep past them
 * Every element below is inside that budget — the collar wraps the base of the
 * neck, it does not shroud the head.
 */
export function collar(r: Recipe): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];
  const dna = generateKitDNA(r.code.id);
  const style = dna.hash % 3;
  const curved = r.code.major === "R";
  const rimMat: "prim" = "prim";
  const RB = -0.055; // rear-wrap Z: behind the neck axis

  // --- shared cervical mechanism (low, tucked) ---------------------------
  out.push(...makeRotaryServo("joint", "metal", 0, -0.025, 0, 0.075 * t, 0.028, 0, 0, 0, s));
  out.push(
    ...makeServoActuator("dark", "metal", 0.042 * t, -0.025, -0.025, 0.045, 0.009, 0.2, 0, 0, 8),
    ...makeServoActuator("dark", "metal", -0.042 * t, -0.025, -0.025, 0.045, 0.009, 0.2, 0, 0, 8),
  );
  // low base ring — top stays at y ~ +0.015, never in front of the chin
  out.push(
    curved
      ? Torus("dark", 0.12 * t, 0.02, 0, -0.005, 0.006, Math.PI / 2, 0, 0, Math.max(16, s))
      : C("dark", 0.125 * t, 0.135 * t, 0.04, 0, -0.005, 0.006, 0, 0, 0, Math.max(6, Math.min(10, s))),
  );

  if (!curved) {
    // ================= S-CLASS (angular) =================
    if (style === 0) {
      // S0 — standing block: a low faceted wrap around the back + sides
      out.push(
        Trap(rimMat, 0.17 * t, 0.13 * t, 0.05, 0, 0.015, RB - 0.01, -0.75, 0, 0, 0.05),
        B(rimMat, 0.045, 0.05, 0.11, 0.115 * t, 0.012, -0.02, 0, -0.5, 0.25),
        B(rimMat, 0.045, 0.05, 0.11, -0.115 * t, 0.012, -0.02, 0, 0.5, -0.25),
      );
      if (r.ornate) out.push(B("trim", 0.14 * t, 0.01, 0.05, 0, 0.04, RB - 0.02, -0.7, 0, 0));
    } else if (style === 1) {
      // S1 — split V: two angular blades at the sides, open front + back
      for (const sgn of [-1, 1] as const) {
        out.push(
          Wedge(rimMat, 0.13 * t, 0.05, 0.06, sgn * 0.1 * t, 0.02, -0.03, -0.5, sgn * 0.8, 0),
          B("dark", 0.026, 0.055, 0.045, sgn * 0.07 * t, -0.005, 0.0, 0, 0, sgn * 0.35),
        );
      }
      if (r.ornate) out.push(C("sec", 0.016, 0.016, 0.13 * t, 0, 0.0, RB, 0, 0, Math.PI / 2, 6));
    } else {
      // S2 — low gorget: chunky hex band + a short rear guard lip
      out.push(
        C(rimMat, 0.145 * t, 0.155 * t, 0.055, 0, 0.006, 0.004, 0, 0, 0, 8),
        Wedge(rimMat, 0.13 * t, 0.045, 0.05, 0, 0.028, RB, -0.5, 0, 0),
      );
      if (r.ornate) out.push(B("trim", 0.18 * t, 0.009, 0.02, 0, 0.03, -0.005));
    }
  } else {
    // ================= R-CLASS (curved) =================
    if (style === 0) {
      // R0 — rolled band: a low curved wrap, rolled-over lip, raised at the nape
      out.push(
        C(rimMat, 0.125 * t, 0.135 * t, 0.06, 0, 0.006, 0, 0, 0, 0, Math.max(16, s)),
        Torus(rimMat, 0.125 * t, 0.024, 0, 0.03, 0, Math.PI / 2, 0, 0, Math.max(18, s)),
        Capsule(rimMat, 0.05 * t, 0.16 * t, 0, 0.028, RB - 0.005, 0, 0, Math.PI / 2, Math.max(12, s)),
      );
      if (r.ornate) out.push(Torus("trim", 0.13 * t, 0.01, 0, 0.006, 0, Math.PI / 2, 0, 0, Math.max(20, s)));
    } else if (style === 1) {
      // R1 — shawl: a low rounded flare, wider + slightly raised at the back
      out.push(
        C(rimMat, 0.15 * t, 0.125 * t, 0.05, 0, 0.01, -0.012, -0.18, 0, 0, Math.max(16, s)),
        Capsule(rimMat, 0.055 * t, 0.2 * t, 0, 0.03, RB, 0, 0, Math.PI / 2, Math.max(12, s)),
      );
      if (r.ornate) out.push(Torus("sec", 0.14 * t, 0.012, 0, 0.028, -0.02, Math.PI / 2 - 0.15, 0, 0, Math.max(18, s)));
    } else {
      // R2 — soft ring: torus ring + a low rounded rear cowl
      out.push(
        Torus(rimMat, 0.125 * t, 0.03, 0, 0.006, 0.004, Math.PI / 2, 0, 0, Math.max(18, s)),
        Capsule(rimMat, 0.05 * t, 0.17 * t, 0, 0.026, RB, 0, 0, Math.PI / 2, Math.max(12, s)),
      );
      if (r.ornate) out.push(Torus("trim", 0.13 * t, 0.008, 0, 0.03, 0.004, Math.PI / 2, 0, 0, Math.max(20, s)));
    }
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
 * Chest (Left / Right thoracic side segments).
 *
 * Fills the span between the Chest Core's side and the shoulder connection.
 * Same design language as the Core — dark chassis cage, frame rails, front
 * armour plate, lateral cooling fins — seated flush against the Core, with the
 * shoulder-connection axis allowed to show through. Built canonically for +X;
 * buildPart mirrors the chestL slot.
 */
export function chest(r: Recipe, _isLeft: boolean): Spec[] {
  const t = r.thick;
  const s = r.segs;
  const out: Spec[] = [];
  const dna = generateKitDNA(r.code.id);
  const zv = dna.zVolume;

  // compact, seated inboard (was ~62% width, shifted -0.025 in X after tuning)
  const innerX = -0.056; // flush against the chest-core side
  const outerX = 0.037; // meets the shoulder-connection yoke
  const midX = (innerX + outerX) / 2;
  const spanW = outerX - innerX; // ~0.093

  // exposed shoulder-connection axis frame — allowed to peek out
  out.push(
    C("joint", 0.022 * t, 0.022 * t, spanW + 0.07, midX + 0.015, 0, -0.01, 0, 0, Math.PI / 2, Math.max(8, s)),
  );
  // dark structural chassis — echoes the core's thoracic cage
  out.push(
    B("dark", spanW, 0.14, 0.15, midX, 0, -0.01),
    B("joint", 0.024 * t, 0.16, 0.18, innerX + 0.01, 0, -0.01), // inboard rail, flush to core
  );
  // front armour plate — same primitive family as the core breastplate
  const plateD = Math.max(0.035, 0.045 * zv * (r.ornate ? 1 : 0.85));
  out.push(
    r.code.form === "R"
      ? C("prim", spanW * 0.55, spanW * 0.55, 0.12, midX, 0.006, 0.075, Math.PI / 2, 0, 0, Math.max(14, s))
      : B("prim", spanW + 0.004, 0.12, plateD, midX, 0.006, 0.075),
  );
  // lateral heat-exchanger fins — the core carries these too
  out.push(...makeCoolingFins("metal", 0.038 * t, 0.06, 0.024, midX, -0.02, 0.05, 3, "y"));
  if (r.ornate) {
    out.push(
      B("trim", spanW * 0.85, 0.014, 0.075, midX, 0.072, 0.07),
      B("sec", 0.04 * t, 0.05, 0.026, outerX - 0.012, 0.015, 0.075),
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
