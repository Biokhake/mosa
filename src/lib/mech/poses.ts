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

/** Heels together, arms at the sides — 차렷. */
export const ATTENTION_POSE: Record<string, PoseOffset> = {
  hipR: { px: -0.05 },
  hipL: { px: 0.05 },
  thighR: { px: -0.05 },
  thighL: { px: 0.05 },
  kneeR: { px: -0.05 },
  kneeL: { px: 0.05 },
  shinR: { px: -0.05 },
  shinL: { px: 0.05 },
  ankleR: { px: -0.05 },
  ankleL: { px: 0.05 },
  footR: { px: -0.05 },
  footL: { px: 0.05 },
  shoulderR: { rz: -10 },
  shoulderL: { rz: 10 },
  upperR: { rz: -2 },
  upperL: { rz: 2 },
  handR: { rz: -4 },
  handL: { rz: 4 },
};

/** Shoulder-width stance, arms slightly folded forward into a shooting rest pose. */
export const DEFAULT_POSE: Record<string, PoseOffset> = {
  helm: { rx: 4, ry: 6 },
  visor: { ry: 6 },
  brow: { ry: 6 },
  chestCore: { rx: 3, ry: 4 },
  pecR: { rx: 2, ry: 4 },
  pecL: { rx: 2, ry: 4 },
  abdomen: { rx: 2, ry: 2 },
  collar: { ry: 3 },
  pelvis: { py: -0.015 },
  pack: { rx: 5 },
  binderR: { rz: 6, rx: 6 },
  binderL: { rz: -6, rx: 6 },

  hipR: { px: 0.12, rz: 7 },
  hipL: { px: -0.12, rz: -7 },
  thighR: { px: 0.14, rz: 8, rx: -8 },
  thighL: { px: -0.14, rz: -8, rx: -6 },
  kneeR: { px: 0.14, rz: 6, rx: 6 },
  kneeL: { px: -0.14, rz: -6, rx: 4 },
  shinR: { px: 0.15, rz: 4, rx: 8 },
  shinL: { px: -0.15, rz: -4, rx: 6 },
  ankleR: { px: 0.16, rz: 2 },
  ankleL: { px: -0.16, rz: -2 },
  footR: { px: 0.18 },
  footL: { px: -0.18 },

  shoulderR: { rx: -10, rz: -8, pz: 0.02 },
  upperR: { py: 0.03, pz: 0.08, rx: -28, rz: -6 },
  elbowR: { py: 0.06, pz: 0.16, rx: -38 },
  forearmR: { py: 0.1, pz: 0.24, rx: -42 },
  vambraceR: { py: 0.12, pz: 0.28, rx: -42 },
  handR: { px: -0.04, py: 0.18, pz: 0.34, rx: -36, ry: 92 },
  weaponR: { py: 0.16, pz: 0.36 },
  extra1: { pz: 0.04, rx: -8 },
  extra9: { py: 0.1, pz: 0.26, rx: -42 },

  shoulderL: { rx: -8, rz: 8, pz: 0.02 },
  upperL: { py: 0.02, pz: 0.06, rx: -22, rz: 8 },
  elbowL: { py: 0.05, pz: 0.14, rx: -30 },
  forearmL: { py: 0.08, pz: 0.2, rx: -34 },
  vambraceL: { py: 0.1, pz: 0.24, rx: -34 },
  handL: { px: 0.03, py: 0.12, pz: 0.28, rx: -36, ry: -92 },
  weaponL: { py: 0.1, pz: 0.32 },
  shield: { py: 0.14, pz: 0.22 },
  extra2: { pz: 0.03, rx: -6 },
  extra10: { py: 0.08, pz: 0.22, rx: -34 },
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
