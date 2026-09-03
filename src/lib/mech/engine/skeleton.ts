/**
 * Whole-body kinematic + structural rig.
 *
 * `buildRig(brief, prop)` builds the entire bone/joint tree once, with real
 * ranges of motion, hardpoints, and (via the load solver) an actuator + member
 * spec for every joint and bone. Individual part grammars then work against a
 * *view* into this rig, so the shin is designed knowing what the whole leg —
 * and the whole robot — weighs and how far it moves.
 *
 * Frame: +X right, +Y up, +Z forward (matches the studio). Pelvis at origin.
 */

import { lerp, clamp } from "./rng";
import { solveBodyLoad } from "./mechanics/bodyLoad";
import type { Brief, Proportions, Bone, RigJoint, Hardpoint, Rig } from "./types";

const HALF_PI = Math.PI / 2;

function L(prop: Proportions, name: string): number {
  return (prop.segLength[name] ?? 0.2) * prop.unit;
}
function G(prop: Proportions, name: string): number {
  return (prop.segGirth[name] ?? 0.12) * prop.unit;
}

/** Build the bone tree. Bone origin is in the PARENT bone's local frame. */
function buildBones(prop: Proportions): Record<string, Bone> {
  const bones: Record<string, Bone> = {};
  const add = (b: Bone) => (bones[b.id] = b);
  const down: [number, number, number] = [0, -1, 0];
  const up: [number, number, number] = [0, 1, 0];

  const torsoL = L(prop, "torso");
  const torsoG = G(prop, "torso");
  const waistL = L(prop, "waist");
  const pelvisG = G(prop, "waist");

  add({ id: "pelvis", parent: null, origin: [0, 0, 0], length: waistL, girth: pelvisG, axis: up, mirrored: false });
  add({ id: "torso", parent: "pelvis", origin: [0, waistL, 0], length: torsoL, girth: torsoG, axis: up, mirrored: false });
  add({ id: "neck", parent: "torso", origin: [0, torsoL, 0], length: L(prop, "neck"), girth: G(prop, "neck"), axis: up, mirrored: false });
  add({ id: "head", parent: "neck", origin: [0, L(prop, "neck"), 0], length: G(prop, "neck") * 2.2, girth: G(prop, "neck") * 2.2, axis: up, mirrored: false });

  // arms — shoulder sits at the top-outer of the torso
  const shX = torsoG * 0.5 + G(prop, "upperArm") * 0.4;
  const shY = torsoL * 0.86;
  for (const s of [1, -1] as const) {
    const side = s > 0 ? "R" : "L";
    add({ id: `upperArm${side}`, parent: "torso", origin: [s * shX, shY, 0], length: L(prop, "upperArm"), girth: G(prop, "upperArm"), axis: down, mirrored: s < 0 });
    add({ id: `forearm${side}`, parent: `upperArm${side}`, origin: [0, -L(prop, "upperArm"), 0], length: L(prop, "forearm"), girth: G(prop, "forearm"), axis: down, mirrored: s < 0 });
    add({ id: `hand${side}`, parent: `forearm${side}`, origin: [0, -L(prop, "forearm"), 0], length: L(prop, "hand"), girth: G(prop, "hand"), axis: down, mirrored: s < 0 });
  }

  // legs — hip at the bottom-outer of the pelvis
  const hipX = pelvisG * 0.42;
  for (const s of [1, -1] as const) {
    const side = s > 0 ? "R" : "L";
    add({ id: `thigh${side}`, parent: "pelvis", origin: [s * hipX, 0, 0], length: L(prop, "thigh"), girth: G(prop, "thigh"), axis: down, mirrored: s < 0 });
    add({ id: `shin${side}`, parent: `thigh${side}`, origin: [0, -L(prop, "thigh"), 0], length: L(prop, "shin"), girth: G(prop, "shin"), axis: down, mirrored: s < 0 });
    add({ id: `foot${side}`, parent: `shin${side}`, origin: [0, -L(prop, "shin"), 0], length: L(prop, "foot"), girth: G(prop, "foot"), axis: [0, 0, 1], mirrored: s < 0 });
  }

  // backpack mount
  add({ id: "backpack", parent: "torso", origin: [0, torsoL * 0.62, -torsoG * 0.42], length: torsoL * 0.5, girth: torsoG * 0.7, axis: up, mirrored: false });

  return bones;
}

/** Build the joint tree with real ranges of motion, tuned by role. */
function buildJoints(brief: Brief, prop: Proportions, bones: Record<string, Bone>): Record<string, RigJoint> {
  const j: Record<string, RigJoint> = {};
  const add = (x: RigJoint) => (j[x.id] = x);
  const X: [number, number, number] = [1, 0, 0];
  const Y: [number, number, number] = [0, 1, 0];

  const agile = brief.role === "skirmisher" || brief.role === "recon";
  const heavy = brief.role === "bruiser";
  const dorsi = lerp(0.35, 0.62, agile ? 0.9 : heavy ? 0.15 : 0.4);
  const kneeMax = lerp(2.35, 1.85, heavy ? 1 : agile ? 0 : 0.4);
  const elbowMax = lerp(2.4, 2.0, heavy ? 1 : 0.3);
  const shoulderMax = agile ? 3.0 : heavy ? 2.4 : 2.7;

  add({ id: "waist", bone: "torso", parentBone: "pelvis", dof: "universal", pivot: bones.torso!.origin, axis: Y, range: [-0.9, 0.9], neutral: 0 });
  add({ id: "neck", bone: "neck", parentBone: "torso", dof: "ball", pivot: bones.neck!.origin, axis: X, range: [-0.7, 0.7], neutral: 0 });
  add({ id: "skull", bone: "head", parentBone: "neck", dof: "ball", pivot: bones.head!.origin, axis: X, range: [-0.5, 0.5], neutral: 0 });

  for (const side of ["R", "L"] as const) {
    add({ id: `shoulder${side}`, bone: `upperArm${side}`, parentBone: "torso", dof: "ball", pivot: bones[`upperArm${side}`]!.origin, axis: X, range: [-shoulderMax, 0.6], neutral: 0 });
    add({ id: `elbow${side}`, bone: `forearm${side}`, parentBone: `upperArm${side}`, dof: "hinge", pivot: bones[`forearm${side}`]!.origin, axis: X, range: [-0.05, elbowMax], neutral: 0 });
    add({ id: `wrist${side}`, bone: `hand${side}`, parentBone: `forearm${side}`, dof: "universal", pivot: bones[`hand${side}`]!.origin, axis: X, range: [-0.9, 0.9], neutral: 0 });

    add({ id: `hip${side}`, bone: `thigh${side}`, parentBone: "pelvis", dof: "ball", pivot: bones[`thigh${side}`]!.origin, axis: X, range: [-1.7, 0.5], neutral: 0 });
    add({ id: `knee${side}`, bone: `shin${side}`, parentBone: `thigh${side}`, dof: "hinge", pivot: bones[`shin${side}`]!.origin, axis: X, range: [-0.05, kneeMax], neutral: 0 });
    add({ id: `ankle${side}`, bone: `foot${side}`, parentBone: `shin${side}`, dof: "universal", pivot: bones[`foot${side}`]!.origin, axis: X, range: [-0.55, dorsi], neutral: 0 });
  }
  void prop;
  return j;
}

/** Rest position of each bone's origin in body space (accumulate origins). */
function computeRestPos(bones: Record<string, Bone>): Record<string, [number, number, number]> {
  const pos: Record<string, [number, number, number]> = {};
  const resolve = (id: string): [number, number, number] => {
    if (pos[id]) return pos[id]!;
    const b = bones[id]!;
    if (!b.parent) return (pos[id] = [...b.origin]);
    const p = resolve(b.parent);
    return (pos[id] = [p[0] + b.origin[0], p[1] + b.origin[1], p[2] + b.origin[2]]);
  };
  for (const id of Object.keys(bones)) resolve(id);
  return pos;
}

/** Standard mount interfaces across the body. */
function buildHardpoints(bones: Record<string, Bone>, rest: Record<string, [number, number, number]>): Hardpoint[] {
  const hp: Hardpoint[] = [];
  const bp = bones.backpack!;
  hp.push({ id: "back-primary", pos: [rest.backpack![0], rest.backpack![1] + bp.length * 0.4, rest.backpack![2] - bp.girth * 0.4], normal: [0, 0, -1], size: bp.girth * 0.5, rating: 1.0 });
  for (const side of ["R", "L"] as const) {
    const sh = bones[`upperArm${side}`]!;
    hp.push({ id: `shoulder-${side}`, pos: [rest[`upperArm${side}`]![0] + (side === "R" ? 1 : -1) * sh.girth * 0.6, rest[`upperArm${side}`]![1], rest[`upperArm${side}`]![2] - sh.girth * 0.2], normal: [side === "R" ? 1 : -1, 0, 0], size: sh.girth * 0.7, rating: 0.7 });
    const fa = bones[`forearm${side}`]!;
    hp.push({ id: `forearm-${side}`, pos: [rest[`forearm${side}`]![0], rest[`forearm${side}`]![1] - fa.length * 0.3, rest[`forearm${side}`]![2] + fa.girth * 0.55], normal: [0, 0, 1], size: fa.girth * 0.5, rating: 0.5 });
    const sn = bones[`shin${side}`]!;
    hp.push({ id: `calf-${side}`, pos: [rest[`shin${side}`]![0] + (side === "R" ? 1 : -1) * sn.girth * 0.55, rest[`shin${side}`]![1] - sn.length * 0.4, rest[`shin${side}`]![2] - sn.girth * 0.1], normal: [side === "R" ? 1 : -1, 0, 0], size: sn.girth * 0.35, rating: 0.4 });
  }
  return hp;
}

export function buildRig(brief: Brief, prop: Proportions): Rig {
  const bones = buildBones(prop);
  const joints = buildJoints(brief, prop, bones);
  const restPos = computeRestPos(bones);
  const hardpoints = buildHardpoints(bones, restPos);
  const load = solveBodyLoad(brief, prop, bones, joints, restPos);
  return { brief, bones, joints, hardpoints, restPos, load };
}

// ---------------------------------------------------------------------------
// Part views — localise the full rig to one part's own frame.
// ---------------------------------------------------------------------------

export interface ShinRig {
  length: number;
  girth: number;
  kneeY: number;
  ankleY: number;
  ankleClearance: number;
  load: {
    jointTorque: Record<string, number>;
    actuator: Rig["load"]["actuator"];
    rails: Rig["load"]["member"][string];
    armourAllowance: number;
    carriedMass: number;
  };
  joints: import("./types").Joint[];
  hardpoints: Hardpoint[];
}

/** A shin, framed at its own centre (knee at +L/2, ankle at -L/2). */
export function shinView(rig: Rig, side: "R" | "L" = "R"): ShinRig {
  const bone = rig.bones[`shin${side}`]!;
  const length = bone.length;
  const girth = bone.girth;
  const kneeY = length * 0.5;
  const ankleY = -length * 0.5;

  const ankleJ = rig.joints[`ankle${side}`]!;
  const dorsi = ankleJ.range[1];
  const ad = rig.load.actuator[`ankle${side}`]!;
  const ankleClearance = girth * 0.9 * Math.sin(dorsi) + length * 0.18 + ad.drumRadius * 0.9;

  const kneeMax = rig.joints[`knee${side}`]!.range[1];

  return {
    length,
    girth,
    kneeY,
    ankleY,
    ankleClearance,
    load: {
      jointTorque: {
        knee: rig.load.jointTorque[`knee${side}`]!,
        ankle: rig.load.jointTorque[`ankle${side}`]!,
      },
      actuator: {
        knee: rig.load.actuator[`knee${side}`]!,
        ankle: ad,
        flexor: rig.load.actuator[`knee${side}-flexor`] ?? rig.load.actuator[`knee${side}`]!,
      },
      rails: rig.load.member[`shin${side}`]!,
      armourAllowance: rig.load.armour[`shin${side}`]!,
      carriedMass: rig.load.boneMass[`shin${side}`]! + rig.load.boneMass[`foot${side}`]!,
    },
    joints: [
      { id: "knee", pivot: [0, kneeY, -girth * 0.15], axis: [1, 0, 0], range: [-0.05, kneeMax], neutral: 0 },
      { id: "ankle", pivot: [0, ankleY, 0], axis: [1, 0, 0], range: ankleJ.range, neutral: 0 },
    ],
    hardpoints: rig.hardpoints
      .filter((h) => h.id === `calf-${side}`)
      .map((h) => ({ ...h, pos: [(side === "R" ? 1 : -1) * girth * 0.55, 0, -girth * 0.1] as [number, number, number] })),
  };
}

export interface ThighRig {
  length: number;
  girth: number;
  hipY: number;
  kneeY: number;
  /** how far the thigh's lower armour must stop clear of the knee pivot */
  kneeClearance: number;
  load: {
    jointTorque: Record<string, number>;
    actuator: Rig["load"]["actuator"];
    rails: Rig["load"]["member"][string];
    armourAllowance: number;
    carriedMass: number;
  };
  joints: import("./types").Joint[];
  hardpoints: Hardpoint[];
}

/** A thigh, framed at its own centre (hip at +L/2, knee at -L/2). */
export function thighView(rig: Rig, side: "R" | "L" = "R"): ThighRig {
  const bone = rig.bones[`thigh${side}`]!;
  const length = bone.length;
  const girth = bone.girth;
  const hipY = length * 0.5;
  const kneeY = -length * 0.5;

  const hd = rig.load.actuator[`hip${side}`]!;
  const kd = rig.load.actuator[`knee${side}`]!;
  const kneeClearance = kd.drumRadius * 1.1 + length * 0.14;

  const hipJ = rig.joints[`hip${side}`]!;
  const kneeMax = rig.joints[`knee${side}`]!.range[1];

  return {
    length,
    girth,
    hipY,
    kneeY,
    kneeClearance,
    load: {
      jointTorque: {
        hip: rig.load.jointTorque[`hip${side}`]!,
        knee: rig.load.jointTorque[`knee${side}`]!,
      },
      actuator: {
        hip: hd,
        knee: kd,
        flexor: rig.load.actuator[`knee${side}-flexor`] ?? kd,
      },
      rails: rig.load.member[`thigh${side}`]!,
      armourAllowance: rig.load.armour[`thigh${side}`]!,
      carriedMass:
        rig.load.boneMass[`thigh${side}`]! +
        rig.load.boneMass[`shin${side}`]! +
        rig.load.boneMass[`foot${side}`]!,
    },
    joints: [
      { id: "hip", pivot: [0, hipY, 0], axis: [1, 0, 0], range: hipJ.range, neutral: 0 },
      { id: "knee", pivot: [0, kneeY, -girth * 0.15], axis: [1, 0, 0], range: [-0.05, kneeMax], neutral: 0 },
    ],
    hardpoints: [],
  };
}

export { HALF_PI, clamp };
