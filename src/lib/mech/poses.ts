/**
 * Preset poses — expressed as rotations on the render-rig nodes (`rig.ts`),
 * applied with real forward kinematics and clamped to each node's rated range
 * of motion. Five presets; the studio has no per-joint UI (that is a later
 * pass), only this menu.
 *
 * `relaxed` is the default: a balanced idle stance. `attention` is the stiff
 * heels-together pose kept for checking part seams / balance.
 */

import type { Vec3 } from "./types";
import { NODE_ROM, RIG_NODES, clampNodeRotation } from "./rig";
import type { RigNodeId } from "./rig";

export type PoseId = "attention" | "relaxed" | "flight" | "shooting" | "sword";

export const POSE_IDS: PoseId[] = ["attention", "relaxed", "flight", "shooting", "sword"];

/*
 * SIGN CONVENTION (render rig; node-local frame is world-aligned in neutral;
 * limb bones hang along -Y). three.js Euler order XYZ, values in degrees.
 *
 *   rx  -x = limb swings FORWARD (+Z)   |  +x = limb swings BACK (-Z)
 *         shoulder: -x flexion (arm up-front)   hip: -x thigh forward
 *         elbow:    -x flexion (forearm up-front)
 *         knee:     +x flexion (shin folds back)
 *         ankle:    -x dorsiflexion (toe up)     +x plantarflexion (toe down)
 *   ry  +y = turn the FRONT toward +X (right).  torso +y: right shoulder back.
 *   rz  limb tip moves toward +X for +z.
 *         RIGHT limb: +z = abduction (out).   LEFT limb: -z = abduction (out).
 *         torso +z = lean right.
 */

export const DEFAULT_POSE_ID: PoseId = "relaxed";

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

  // default — balanced natural idle: feet a little apart, arms hanging almost
  // straight with a small gap from the body, knees barely broken. Subtle.
  relaxed: {
    label: "Relaxed",
    nodes: {
      shoulderR: [-2, 0, 5],
      elbowR: [-7, 0, 0],
      shoulderL: [-2, 0, -5],
      elbowL: [-7, 0, 0],
      hipR: [0, 0, 4],
      kneeR: [4, 0, 0],
      ankleR: [-2, 0, -4],
      hipL: [0, 0, -4],
      kneeL: [4, 0, 0],
      ankleL: [-2, 0, 4],
    },
  },

  // dash flight: body pitched forward, head up to look ahead, arms bent and
  // held close along the torso (slight open at the shoulder), legs streamed
  // straight behind with the toes pointed
  flight: {
    label: "Flight",
    root: { pos: [0, 0.1, 0.0], rot: [34, 0, 0] },
    nodes: {
      torso: [-6, 0, 0],
      neck: [-38, 0, 0],
      shoulderR: [6, 0, 7],
      elbowR: [-46, 0, 0],
      shoulderL: [6, 0, -7],
      elbowL: [-46, 0, 0],
      hipR: [-9, 0, 3],
      kneeR: [12, 0, 0],
      ankleR: [34, 0, 0],
      hipL: [-9, 0, -3],
      kneeL: [12, 0, 0],
      ankleL: [34, 0, 0],
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

  // classic beam-saber ready stance (RX-78 style): saber arm extended out to
  // the side near horizontal, shield arm folded across the chest, wide + deep
  // planted stance, weight low and centred, eyes down the saber line
  sword: {
    label: "Sword strike",
    root: { pos: [0, -0.07, 0.02], rot: [6, 0, 0] },
    nodes: {
      torso: [8, -6, 0],
      neck: [3, 12, 0],
      shoulderR: [-8, -4, 82],
      elbowR: [-6, 0, 0],
      wristR: [0, 0, -10],
      shoulderL: [-42, 0, 46],
      elbowL: [-78, 0, 0],
      wristL: [0, 14, 0],
      hipR: [-8, 6, 24],
      kneeR: [52, 0, 0],
      ankleR: [-6, 0, -22],
      hipL: [-8, -6, -24],
      kneeL: [52, 0, 0],
      ankleL: [-6, 0, 22],
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
