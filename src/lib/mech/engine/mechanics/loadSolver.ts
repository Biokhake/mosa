/**
 * Structural / load solver.
 *
 * Traces the gravitational + inertial load each joint must resist, then SIZES
 * the actuator and the structural members from it. The grammar then builds the
 * frame and shell around those sizes — so a bruiser's shin has fat drums and a
 * beefy greave because it *carries more*, not because a constant was bumped.
 *
 * Units are relative (dimensionless); the ratios are what matter until a real
 * material + actuator catalogue lands.
 */

import { clamp } from "../rng";
import type { Brief, Proportions, ActuatorSpec, MemberSpec, LoadReport } from "../types";
import { bodyMass, ROLE_ARMOUR } from "./bodyMass";

/** Dynamic amplification — how hard the frame is thrown around, by role.
 * Note the spread is deliberately modest: a heavy bruiser still needs strong
 * actuators, it just doesn't whip them as fast. */
const DYNAMIC: Record<Brief["role"], number> = {
  skirmisher: 2.1,
  recon: 1.95,
  line: 1.7,
  support: 1.6,
  artillery: 1.5,
  bruiser: 1.55,
};
const SAFETY = 1.5;

/**
 * Rotary actuator sized so peak shear stress stays fixed: r ∝ torque^(1/3),
 * expressed as a multiple of a nominal (line-role) drum radius.
 */
function sizeRotary(torqueRatio: number, nominalR: number): ActuatorSpec {
  const k = clamp(Math.cbrt(torqueRatio), 0.62, 1.95);
  return {
    drive: "rotary",
    torque: torqueRatio,
    drumRadius: nominalR * k,
    drumWidth: nominalR * k * 1.35,
    bore: 0,
    stroke: 0,
    arm: 0,
  };
}

/**
 * Linear actuator: force = torque / momentArm, bore ∝ sqrt(force). A very high
 * force upgrades to a twin cylinder rather than one absurdly fat one.
 */
function sizeLinear(torqueRatio: number, arm: number, nominalBore: number): ActuatorSpec {
  const bore1 = nominalBore * clamp(Math.sqrt(torqueRatio), 0.6, 2.6);
  const twin = bore1 > nominalBore * 1.7;
  const bore = twin ? bore1 / Math.SQRT2 : bore1;
  return {
    drive: twin ? "twin-linear" : "linear",
    torque: torqueRatio,
    drumRadius: 0,
    drumWidth: 0,
    bore,
    stroke: arm * 1.7,
    arm,
  };
}

/** Frame rails sized from the bending load they carry (as a ratio). */
function sizeRails(bendRatio: number, brief: Brief, nominalSection: number): MemberSpec {
  const section = nominalSection * clamp(Math.sqrt(bendRatio), 0.7, 2.2);
  let count = 2;
  if (brief.role === "recon" || (brief.frameExposure > 0.55 && brief.role !== "bruiser")) count = 1;
  const braced = bendRatio > 2.0 || brief.role === "bruiser";
  return { section, count, braced };
}


export function solveShinLoad(brief: Brief, prop: Proportions): LoadReport {
  const bm = bodyMass(brief, prop);
  const unit = prop.unit;
  const shinL = prop.segLength.shin! * unit;
  const footL = prop.segLength.foot! * unit;
  const dyn = DYNAMIC[brief.role];

  const mFoot = bm.seg.foot;
  const mShin = bm.seg.shin;

  // The dominant load on a leg joint is the WHOLE ROBOT's weight passing
  // through it in single-leg stance — that is what scales with role/size and
  // makes a bruiser's actuators genuinely bigger than a recon's. The distal
  // limb mass is a small correction on top.
  const bw = bm.total;
  const stance = 1.0; // worst case: one leg carries everything

  // --- knee ---
  const kneeStanceArm = shinL * 0.34; // ~20deg-flexed knee in gait
  const distalMass = mShin + mFoot;
  const distalCoM =
    (mShin * (shinL * 0.5) + mFoot * (shinL + footL * 0.3)) / Math.max(1e-6, distalMass);
  const kneeMoment = bw * stance * kneeStanceArm + distalMass * distalCoM;
  const kneeTorque = kneeMoment * dyn * SAFETY;

  // --- ankle ---
  const ankleStanceArm = footL * 0.42;
  const ankleMoment = bw * stance * ankleStanceArm + mFoot * (footL * 0.45);
  const ankleTorque = ankleMoment * dyn * SAFETY;

  // --- flexor : the linear actuator that extends the knee ---
  const flexArm = prop.segGirth.shin! * unit * 0.9;

  // --- rails : carry the shin's axial + bending stance load ---
  const bendLoad = bw * stance * shinL * 0.4;
  const kneeMass = distalMass;

  // reference scales (a canonical line/M frame). torque ∝ unit^4, bend too.
  const refTorque = 0.05 * unit ** 4;
  const refBend = 0.03 * unit ** 4;
  const nominalDrum = prop.segGirth.shin! * unit * 0.3;
  const nominalBore = prop.segGirth.shin! * unit * 0.1;
  const nominalRail = prop.segGirth.shin! * unit * 0.16;

  const actuator: Record<string, ActuatorSpec> = {
    ankle: sizeRotary(ankleTorque / refTorque, nominalDrum * 0.82),
    knee: sizeRotary(kneeTorque / refTorque, nominalDrum),
    flexor: sizeLinear(kneeTorque / refTorque, flexArm, nominalBore),
  };

  // armour allowance: role + decoration, scaled by how much the joints can
  // afford to move (heavier armour would need bigger actuators -> 1 feedback pass)
  const rawArmour = ROLE_ARMOUR[brief.role] * (0.55 + brief.decoration * 0.6);
  const armourAllowance = clamp(rawArmour, 0.4, 2.0);

  return {
    jointTorque: { ankle: ankleTorque / refTorque, knee: kneeTorque / refTorque },
    actuator,
    rails: sizeRails(bendLoad / refBend, brief, nominalRail),
    armourAllowance,
    carriedMass: kneeMass,
  };
}
