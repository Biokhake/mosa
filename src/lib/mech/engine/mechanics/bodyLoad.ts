/**
 * Whole-body structural / load solver.
 *
 * Walks the bone tree, gives every bone a relative mass (structure + armour
 * shell + role payload), then for every joint traces the moment it must
 * resist — the distal sub-assembly's weight × its lever arm, plus, for the leg
 * joints, the whole robot's weight passing through one leg in stance. From that
 * it sizes the actuator (rotary drum or linear cylinder, twin past a threshold)
 * and the bone's structural members.
 *
 * Everything is relative / dimensionless until a material + actuator catalogue
 * lands; the ratios are what matter.
 */

import { clamp } from "../rng";
import type { Brief, Proportions, Bone, RigJoint, ActuatorSpec, MemberSpec, BodyLoad } from "../types";
import { ROLE_ARMOUR, ROLE_PAYLOAD } from "./bodyMass";

/** Dynamic amplification — how hard the frame throws its limbs, by role.
 * Modest spread: a heavy bruiser still needs strong actuators. */
const DYNAMIC: Record<Brief["role"], number> = {
  skirmisher: 2.1,
  recon: 1.95,
  line: 1.7,
  support: 1.6,
  artillery: 1.5,
  bruiser: 1.55,
};
const SAFETY = 1.5;

const distal: Record<string, string[]> = {}; // memoised

/** All bones distal to (below) a joint's child bone. */
function distalBones(bones: Record<string, Bone>, root: string): string[] {
  if (distal[root]) return distal[root]!;
  const out = [root];
  for (const b of Object.values(bones)) if (b.parent === root) out.push(...distalBones(bones, b.id));
  return (distal[root] = out);
}

function boneVolume(b: Bone): number {
  return Math.PI * (b.girth * 0.5) ** 2 * b.length * 0.55;
}

/** Rotary drum sized so peak shear stress stays fixed: r ∝ torque^(1/3). */
function sizeRotary(torqueRatio: number, nominalR: number): ActuatorSpec {
  const k = clamp(Math.cbrt(Math.max(0.05, torqueRatio)), 0.62, 1.95);
  return { drive: "rotary", torque: torqueRatio, drumRadius: nominalR * k, drumWidth: nominalR * k * 1.3, bore: 0, stroke: 0, arm: 0 };
}

/** Linear actuator: bore ∝ sqrt(force); upgrades to a twin past a threshold. */
function sizeLinear(torqueRatio: number, arm: number, nominalBore: number): ActuatorSpec {
  const bore1 = nominalBore * clamp(Math.sqrt(Math.max(0.05, torqueRatio)), 0.6, 2.6);
  const twin = bore1 > nominalBore * 1.7;
  return {
    drive: twin ? "twin-linear" : "linear",
    torque: torqueRatio,
    drumRadius: 0,
    drumWidth: 0,
    bore: twin ? bore1 / Math.SQRT2 : bore1,
    stroke: arm * 1.7,
    arm,
  };
}

function sizeMember(bendRatio: number, brief: Brief, nominalSection: number, exposed: boolean): MemberSpec {
  const section = nominalSection * clamp(Math.sqrt(Math.max(0.05, bendRatio)), 0.7, 2.2);
  let count = 2;
  if (brief.role === "recon" || (exposed && brief.frameExposure > 0.55 && brief.role !== "bruiser")) count = 1;
  const braced = bendRatio > 2.0 || brief.role === "bruiser";
  return { section, count, braced };
}

export function solveBodyLoad(
  brief: Brief,
  prop: Proportions,
  bones: Record<string, Bone>,
  joints: Record<string, RigJoint>,
  restPos: Record<string, [number, number, number]>,
): BodyLoad {
  for (const k of Object.keys(distal)) delete distal[k];
  const unit = prop.unit;
  const dyn = DYNAMIC[brief.role];
  const armourRole = ROLE_ARMOUR[brief.role];
  const pay = ROLE_PAYLOAD[brief.role];

  // --- per-bone mass: structure + role-scaled armour shell ---
  const boneMass: Record<string, number> = {};
  const armour: Record<string, number> = {};
  for (const b of Object.values(bones)) {
    const structVol = boneVolume(b);
    const shellFactor = 0.22 + brief.decoration * 0.42;
    // distal limb segments carry less armour (weight discipline)
    const distalLimb = /forearm|hand|shin|foot/.test(b.id) ? 0.8 : 1;
    const a = clamp(armourRole * (0.55 + brief.decoration * 0.6) * distalLimb, 0.35, 2.1);
    armour[b.id] = a;
    boneMass[b.id] = structVol * 0.4 + structVol * shellFactor * armourRole * distalLimb;
  }
  // payload lumped onto the mount bones (relative modules -> ~1.6% of a unit cube each)
  const modUnit = 0.016 * unit ** 3;
  boneMass.backpack! += pay.back * modUnit;
  boneMass.upperArmR! += pay.armR * modUnit;
  boneMass.upperArmL! += pay.armL * modUnit;

  const bodyWeight = Object.values(boneMass).reduce((s, m) => s + m, 0);
  const refTorque = 0.05 * unit ** 4;
  const refBend = 0.03 * unit ** 4;

  const jointTorque: Record<string, number> = {};
  const actuator: Record<string, ActuatorSpec> = {};
  const member: Record<string, MemberSpec> = {};

  for (const jt of Object.values(joints)) {
    const chain = distalBones(bones, jt.bone);
    let mass = 0;
    const com: [number, number, number] = [0, 0, 0];
    for (const id of chain) {
      const m = boneMass[id]!;
      mass += m;
      const p = restPos[id]!;
      com[0] += m * p[0];
      com[1] += m * p[1];
      com[2] += m * p[2];
    }
    if (mass > 0) {
      com[0] /= mass;
      com[1] /= mass;
      com[2] /= mass;
    }
    const pivotWorld = restPos[jt.parentBone]!.map((v, i) => v + jt.pivot[i]!) as [number, number, number];
    const lever = Math.hypot(com[0] - pivotWorld[0], com[1] - pivotWorld[1], com[2] - pivotWorld[2]);
    let moment = mass * lever;

    // leg joints also carry the whole robot in single-leg stance
    const isLeg = /knee|ankle|hip/.test(jt.id);
    if (isLeg) {
      const stanceArm = jt.id.startsWith("ankle")
        ? bones[jt.bone]!.length * 0.42
        : bones[jt.bone]!.length * 0.34;
      moment += bodyWeight * stanceArm;
    }

    const torque = moment * dyn * SAFETY;
    const ratio = torque / refTorque;
    jointTorque[jt.id] = ratio;

    const childBone = bones[jt.bone]!;
    const nominalDrum = childBone.girth * 0.3;
    const nominalBore = childBone.girth * 0.1;
    const nominalSection = childBone.girth * 0.16;

    if (jt.dof === "hinge") {
      actuator[jt.id] = sizeRotary(ratio, nominalDrum);
      // knees / elbows also get a linear flexor
      actuator[`${jt.id}-flexor`] = sizeLinear(ratio, childBone.girth * 0.9, nominalBore);
    } else {
      actuator[jt.id] = sizeRotary(ratio * 0.85, nominalDrum * 0.9);
    }

    // the child bone's structural members carry this joint's bending
    const bendRatio = (moment * 0.5 + bodyWeight * (isLeg ? childBone.length * 0.3 : 0)) / refBend;
    const exposed = /shin|forearm|thigh|upperArm/.test(jt.bone);
    member[jt.bone] = sizeMember(bendRatio, brief, nominalSection, exposed);
  }

  return { bodyWeight, boneMass, jointTorque, actuator, member, armour };
}
