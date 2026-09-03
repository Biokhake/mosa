/**
 * Render skeleton — the studio's kinematic hierarchy.
 *
 * Mirrors the design-engine bone tree (`engine/skeleton.ts`) but lives in the
 * studio's world frame so parts can be posed with real forward kinematics: a
 * rotation on a node carries everything distal to it. Neutral pose (all node
 * rotations zero) reproduces the exact fixed-socket layout, so nothing about
 * the un-posed model changes.
 */

import { SLOT_BY_ID } from "./catalog";
import type { Vec3 } from "./types";

export type RigNodeId =
  | "root"
  | "torso"
  | "neck"
  | "shoulderR"
  | "elbowR"
  | "wristR"
  | "shoulderL"
  | "elbowL"
  | "wristL"
  | "hipR"
  | "kneeR"
  | "ankleR"
  | "hipL"
  | "kneeL"
  | "ankleL";

export interface RigNode {
  id: RigNodeId;
  parent: RigNodeId | null;
  /** world position of this joint's pivot in the neutral pose */
  rest: Vec3;
}

/** The tree, parents before children. `rest` values track the catalog sockets. */
export const RIG_NODES: RigNode[] = [
  // R = the robot's right = -X (screen-left). L = +X.
  { id: "root", parent: null, rest: [0, 1.06, 0] },
  { id: "torso", parent: "root", rest: [0, 1.28, 0] },
  { id: "neck", parent: "torso", rest: [0, 1.55, 0] },
  { id: "shoulderR", parent: "torso", rest: [-0.3, 1.46, 0] },
  { id: "elbowR", parent: "shoulderR", rest: [-0.3, 1.08, 0] },
  { id: "wristR", parent: "elbowR", rest: [-0.3, 0.72, 0] },
  { id: "shoulderL", parent: "torso", rest: [0.3, 1.46, 0] },
  { id: "elbowL", parent: "shoulderL", rest: [0.3, 1.08, 0] },
  { id: "wristL", parent: "elbowL", rest: [0.3, 0.72, 0] },
  { id: "hipR", parent: "root", rest: [-0.14, 0.98, 0] },
  { id: "kneeR", parent: "hipR", rest: [-0.14, 0.5, 0.02] },
  { id: "ankleR", parent: "kneeR", rest: [-0.14, 0.1, 0] },
  { id: "hipL", parent: "root", rest: [0.14, 0.98, 0] },
  { id: "kneeL", parent: "hipL", rest: [0.14, 0.5, 0.02] },
  { id: "ankleL", parent: "kneeL", rest: [0.14, 0.1, 0] },
];

export const RIG_NODE_BY_ID = Object.fromEntries(RIG_NODES.map((n) => [n.id, n])) as Record<
  RigNodeId,
  RigNode
>;

export function rigChildren(id: RigNodeId): RigNode[] {
  return RIG_NODES.filter((n) => n.parent === id);
}

/** Explicit slot → node bindings; everything else falls back to its group. */
const SLOT_NODE_EXPLICIT: Record<string, RigNodeId> = {
  shoulderR: "shoulderR",
  upperR: "shoulderR",
  elbowR: "elbowR",
  forearmR: "elbowR",
  vambraceR: "elbowR",
  handR: "wristR",
  weaponR: "wristR",
  extra1: "shoulderR",
  extra9: "elbowR",
  shoulderL: "shoulderL",
  upperL: "shoulderL",
  elbowL: "elbowL",
  forearmL: "elbowL",
  vambraceL: "elbowL",
  handL: "wristL",
  weaponL: "wristL",
  shield: "wristL",
  extra2: "shoulderL",
  extra10: "elbowL",
  hipR: "hipR",
  thighR: "hipR",
  kneeR: "kneeR",
  shinR: "kneeR",
  ankleR: "ankleR",
  footR: "ankleR",
  extra3: "hipR",
  hipL: "hipL",
  thighL: "hipL",
  kneeL: "kneeL",
  shinL: "kneeL",
  ankleL: "ankleL",
  footL: "ankleL",
  extra4: "hipL",
  extra5: "neck",
  extra7: "neck",
  extra6: "root",
  extra8: "torso",
};

export function nodeForSlot(slotId: string): RigNodeId {
  const hit = SLOT_NODE_EXPLICIT[slotId];
  if (hit) return hit;
  const g = SLOT_BY_ID[slotId]?.group;
  if (g === "head") return "neck";
  if (g === "torso") return "torso";
  if (g === "back") return "torso";
  if (g === "waist") return "root";
  return "root";
}

/** Which region-transform group drives each node (for the studio's groupXform). */
export const NODE_GROUP: Partial<Record<RigNodeId, string>> = {
  root: "waist",
  torso: "torso",
  neck: "head",
  shoulderR: "armR",
  shoulderL: "armL",
  hipR: "legR",
  hipL: "legL",
};

type Range = [number, number];
export interface NodeRom {
  rx?: Range;
  ry?: Range;
  rz?: Range;
}

/**
 * Rated articulation per node, in DEGREES — the studio clamps every pose to
 * this so a preset can never ask for motion the frame does not have. Values
 * track the engine's role-neutral ranges. L-side ry/rz mirror automatically.
 */
export const NODE_ROM: Record<RigNodeId, NodeRom> = {
  root: { rx: [-8, 12], ry: [-30, 30], rz: [-8, 8] },
  torso: { rx: [-20, 35], ry: [-42, 42], rz: [-18, 18] },
  neck: { rx: [-35, 30], ry: [-65, 65], rz: [-22, 22] },
  shoulderR: { rx: [-95, 180], ry: [-95, 95], rz: [-130, 130] },
  elbowR: { rx: [-150, 3], ry: [-4, 4], rz: [-12, 12] },
  wristR: { rx: [-55, 55], ry: [-35, 35], rz: [-25, 25] },
  shoulderL: { rx: [-95, 180], ry: [-95, 95], rz: [-130, 130] },
  elbowL: { rx: [-150, 3], ry: [-4, 4], rz: [-12, 12] },
  wristL: { rx: [-55, 55], ry: [-35, 35], rz: [-25, 25] },
  hipR: { rx: [-125, 40], ry: [-45, 45], rz: [-42, 42] },
  kneeR: { rx: [-3, 155], ry: [-3, 3], rz: [-3, 3] },
  ankleR: { rx: [-40, 45], ry: [-8, 8], rz: [-22, 22] },
  hipL: { rx: [-125, 40], ry: [-45, 45], rz: [-42, 42] },
  kneeL: { rx: [-3, 155], ry: [-3, 3], rz: [-3, 3] },
  ankleL: { rx: [-40, 45], ry: [-8, 8], rz: [-22, 22] },
};

const clamp1 = (v: number, r?: Range) => (r ? Math.max(r[0], Math.min(r[1], v)) : v);

/** Clamp one node's [rx,ry,rz] (degrees) to its rated range. */
export function clampNodeRotation(id: RigNodeId, rot: Vec3): Vec3 {
  const rom = NODE_ROM[id];
  return [clamp1(rot[0], rom.rx), clamp1(rot[1], rom.ry), clamp1(rot[2], rom.rz)];
}
