/**
 * Preset poses — expressed as rotations on the render-rig nodes (`rig.ts`),
 * applied with real forward kinematics and clamped to each node's rated range
 * of motion. Five presets; the studio has no per-joint UI (that is a later
 * pass), only this menu.
 */

import type { Vec3 } from "./types";
import { NODE_ROM, RIG_NODES, clampNodeRotation } from "./rig";
import type { RigNodeId } from "./rig";

export type PoseId = "attention" | "aim" | "flight" | "shooting" | "sword";

export const POSE_IDS: PoseId[] = ["attention", "aim", "flight", "shooting", "sword"];

export interface Pose {
  label: string;
  /** per-node [rx, ry, rz] in degrees; missing node = neutral */
  nodes: Partial<Record<RigNodeId, Vec3>>;
  /** whole-body attitude at the root */
  root?: { pos?: Vec3; rot?: Vec3 };
}

const RAW_POSES: Record<PoseId, Pose> = {
  attention: {
    label: "Attention",
    nodes: {},
  },

  aim: {
    label: "Aim",
    nodes: {
      torso: [3, 4, 0],
      neck: [3, 6, 0],
      shoulderR: [-16, 0, -6],
      elbowR: [-58, 0, 0],
      wristR: [0, 22, 0],
      shoulderL: [-14, 0, 6],
      elbowL: [-72, 0, 0],
      wristL: [0, -28, 0],
      hipR: [-8, 0, 4],
      kneeR: [16, 0, 0],
      ankleR: [-7, 0, 0],
      hipL: [-6, 0, -4],
      kneeL: [12, 0, 0],
      ankleL: [-6, 0, 0],
    },
  },

  flight: {
    label: "Flight",
    root: { pos: [0, 0.12, 0.02], rot: [26, 0, 0] },
    nodes: {
      torso: [-8, 0, 0],
      neck: [-32, 0, 0],
      shoulderR: [-38, 0, -12],
      elbowR: [-14, 0, 0],
      shoulderL: [-38, 0, 12],
      elbowL: [-14, 0, 0],
      hipR: [-12, 0, 3],
      kneeR: [8, 0, 0],
      ankleR: [30, 0, 0],
      hipL: [-12, 0, -3],
      kneeL: [8, 0, 0],
      ankleL: [30, 0, 0],
    },
  },

  shooting: {
    label: "Shooting",
    root: { pos: [0, -0.02, -0.02], rot: [3, 0, 0] },
    nodes: {
      torso: [2, 18, 0],
      neck: [0, -20, 0],
      shoulderR: [-58, -15, -18],
      elbowR: [-95, 0, 0],
      wristR: [0, 10, 0],
      shoulderL: [-72, 10, 22],
      elbowL: [-38, 0, 0],
      wristL: [0, -12, 8],
      hipR: [-8, -12, 10],
      kneeR: [22, 0, 0],
      ankleR: [-10, 0, 0],
      hipL: [-16, 12, -6],
      kneeL: [14, 0, 0],
      ankleL: [-6, 0, 0],
    },
  },

  sword: {
    label: "Sword strike",
    root: { pos: [0, -0.02, 0.03], rot: [6, -8, 3] },
    nodes: {
      torso: [6, -26, 4],
      neck: [8, 20, 0],
      shoulderR: [40, -18, -18],
      elbowR: [-30, 0, 0],
      wristR: [0, 0, -18],
      shoulderL: [-15, 0, 30],
      elbowL: [-45, 0, 0],
      wristL: [0, 16, 0],
      hipR: [-28, -10, 10],
      kneeR: [45, 0, 0],
      ankleR: [-12, 0, 0],
      hipL: [12, 8, -8],
      kneeL: [10, 0, 0],
      ankleL: [22, 0, 0],
    },
  },
};

/** Bake ROM-clamped copies once. */
export const POSES: Record<PoseId, Pose> = Object.fromEntries(
  (Object.keys(RAW_POSES) as PoseId[]).map((id) => {
    const p = RAW_POSES[id];
    const nodes: Partial<Record<RigNodeId, Vec3>> = {};
    for (const n of RIG_NODES) {
      const r = p.nodes[n.id];
      if (r) nodes[n.id] = clampNodeRotation(n.id, r);
    }
    let root = p.root;
    if (root?.rot) {
      const rom = NODE_ROM.root;
      root = {
        ...root,
        rot: [
          Math.max(-90, Math.min(90, root.rot[0])),
          root.rot[1],
          Math.max(rom.rz![0], Math.min(rom.rz![1], root.rot[2])),
        ],
      };
    }
    return [id, { ...p, nodes, root }];
  }),
) as Record<PoseId, Pose>;

const ZERO: Vec3 = [0, 0, 0];

/** This pose's rotation (degrees) for a node. */
export function poseNodeRotation(nodeId: RigNodeId, poseId: PoseId): Vec3 {
  return POSES[poseId]?.nodes[nodeId] ?? ZERO;
}

/** This pose's whole-body root attitude. */
export function poseRoot(poseId: PoseId): { pos: Vec3; rot: Vec3 } {
  const r = POSES[poseId]?.root;
  return { pos: r?.pos ?? ZERO, rot: r?.rot ?? ZERO };
}
