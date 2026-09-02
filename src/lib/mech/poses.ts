export type PoseOffset = {
  px?: number;
  py?: number;
  pz?: number;
  rx?: number;
  ry?: number;
  rz?: number;
};

export type PoseId = "attention" | "aim";

const ZERO: PoseOffset = {};

/** Heels together, arms at the sides — 차렷 (Attention Pose). Base sockets provide the true zero-gap A-pose. */
export const ATTENTION_POSE: Record<string, PoseOffset> = {};

/** Shoulder-width stance, arms slightly folded forward into a shooting rest pose. */
export const DEFAULT_POSE: Record<string, PoseOffset> = {
  helm: { rx: 3, ry: 5 },
  visor: { rx: 3, ry: 5 },
  brow: { rx: 3, ry: 5 },
  eyeR: { rx: 3, ry: 5 },
  eyeL: { rx: 3, ry: 5 },
  nose: { rx: 3, ry: 5 },
  mouth: { rx: 3, ry: 5 },
  jaw: { rx: 3, ry: 5 },
  chin: { rx: 3, ry: 5 },
  cheekR: { rx: 3, ry: 5 },
  cheekL: { rx: 3, ry: 5 },
  earR: { rx: 3, ry: 5 },
  earL: { rx: 3, ry: 5 },
  vfin: { rx: 3, ry: 5 },
  antennaR: { rx: 3, ry: 5 },
  antennaL: { rx: 3, ry: 5 },

  chestCore: { rx: 2, ry: 3 },
  pecR: { rx: 2, ry: 3 },
  pecL: { rx: 2, ry: 3 },
  abdomen: { rx: 2, ry: 2 },
  collar: { ry: 2 },
  pelvis: { py: -0.01 },
  pack: { rx: 3 },
  binderR: { rz: 4, rx: 4 },
  binderL: { rz: -4, rx: 4 },

  hipR: { px: 0.04, rz: 3 },
  hipL: { px: -0.04, rz: -3 },
  thighR: { px: 0.05, rz: 4, rx: -4 },
  thighL: { px: -0.05, rz: -4, rx: -3 },
  kneeR: { px: 0.05, rz: 3, rx: 4 },
  kneeL: { px: -0.05, rz: -3, rx: 3 },
  shinR: { px: 0.06, rz: 2, rx: 4 },
  shinL: { px: -0.06, rz: -2, rx: 3 },
  ankleR: { px: 0.06, rz: 1 },
  ankleL: { px: -0.06, rz: -1 },
  footR: { px: 0.06 },
  footL: { px: -0.06 },

  shoulderR: { rx: -6, rz: -4, pz: 0.01 },
  upperR: { py: 0.02, pz: 0.04, rx: -16, rz: -3 },
  elbowR: { py: 0.04, pz: 0.08, rx: -22 },
  forearmR: { py: 0.06, pz: 0.12, rx: -24 },
  vambraceR: { py: 0.07, pz: 0.14, rx: -24 },
  handR: { px: -0.02, py: 0.09, pz: 0.18, rx: -20, ry: 45 },
  weaponR: { py: 0.09, pz: 0.20 },
  extra1: { pz: 0.02, rx: -5 },
  extra9: { py: 0.06, pz: 0.13, rx: -24 },

  shoulderL: { rx: -5, rz: 4, pz: 0.01 },
  upperL: { py: 0.01, pz: 0.03, rx: -12, rz: 4 },
  elbowL: { py: 0.03, pz: 0.07, rx: -18 },
  forearmL: { py: 0.05, pz: 0.10, rx: -20 },
  vambraceL: { py: 0.06, pz: 0.12, rx: -20 },
  handL: { px: 0.02, py: 0.07, pz: 0.15, rx: -18, ry: -45 },
  weaponL: { py: 0.06, pz: 0.17 },
  shield: { py: 0.08, pz: 0.12 },
  extra2: { pz: 0.02, rx: -4 },
  extra10: { py: 0.05, pz: 0.11, rx: -20 },
};

export const POSES: Record<PoseId, Record<string, PoseOffset>> = {
  attention: ATTENTION_POSE,
  aim: DEFAULT_POSE,
};

export function poseOffsetFor(slotId: string, poseId: PoseId | Record<string, PoseOffset> = "aim"): PoseOffset {
  const parts = typeof poseId === "string" ? (POSES[poseId] ?? DEFAULT_POSE) : poseId;
  if (parts[slotId]) return parts[slotId]!;
  const base = slotId.replace(/[LR]$/, "");
  const src = parts[base];
  if (!src) return ZERO;
  if (/L$/.test(slotId) || slotId === "weaponL") {
    return {
      px: src.px != null ? -src.px : undefined,
      py: src.py,
      pz: src.pz,
      rx: src.rx,
      ry: src.ry != null ? -src.ry : undefined,
      rz: src.rz != null ? -src.rz : undefined,
    };
  }
  return src;
}
