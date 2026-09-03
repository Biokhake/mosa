/**
 * Proportion model — one coherent ratio family per brief.
 *
 * Every part derives its sizes from this, so limbs taper consistently and
 * detail comes in a fixed set of sizes (the "3 sizes" rule) rather than a
 * continuum that reads as mush.
 */

import { lerp, clamp } from "./rng";
import type { Brief, Proportions } from "./types";

/** Segment length ratios (of `unit`) for a neutral humanoid rig. */
const BASE_LENGTH: Record<string, number> = {
  neck: 0.06,
  torso: 0.3,
  waist: 0.09,
  upperArm: 0.19,
  forearm: 0.17,
  hand: 0.08,
  thigh: 0.26,
  shin: 0.25,
  foot: 0.12,
};

/** Segment girth ratios (of `unit`). */
const BASE_GIRTH: Record<string, number> = {
  neck: 0.07,
  torso: 0.34,
  waist: 0.22,
  upperArm: 0.11,
  forearm: 0.1,
  hand: 0.09,
  thigh: 0.14,
  shin: 0.12,
  foot: 0.16,
};

const SIZE_UNIT: Record<Brief["sizeClass"], number> = { S: 0.9, M: 1.0, L: 1.12 };

/** Role changes the ratio family — a bruiser is not a slim runner scaled up. */
const ROLE_TUNE: Record<
  Brief["role"],
  { torsoGirth: number; limbGirth: number; limbLength: number; shoulder: number }
> = {
  skirmisher: { torsoGirth: 0.88, limbGirth: 0.86, limbLength: 1.06, shoulder: 0.92 },
  line: { torsoGirth: 1.0, limbGirth: 1.0, limbLength: 1.0, shoulder: 1.0 },
  artillery: { torsoGirth: 1.05, limbGirth: 0.98, limbLength: 0.98, shoulder: 1.08 },
  bruiser: { torsoGirth: 1.16, limbGirth: 1.2, limbLength: 0.94, shoulder: 1.14 },
  recon: { torsoGirth: 0.85, limbGirth: 0.82, limbLength: 1.08, shoulder: 0.88 },
  support: { torsoGirth: 1.02, limbGirth: 1.02, limbLength: 1.0, shoulder: 1.02 },
};

export function resolveProportions(brief: Brief): Proportions {
  const unit = SIZE_UNIT[brief.sizeClass];
  const tune = ROLE_TUNE[brief.role];

  const segLength: Record<string, number> = {};
  const segGirth: Record<string, number> = {};
  for (const k of Object.keys(BASE_LENGTH)) {
    const isLimb = ["upperArm", "forearm", "thigh", "shin"].includes(k);
    segLength[k] = BASE_LENGTH[k]! * (isLimb ? tune.limbLength : 1);
    segGirth[k] = BASE_GIRTH[k]! * (isLimb ? tune.limbGirth : k === "torso" ? tune.torsoGirth : 1);
  }

  // taper: distal segments get thinner as `brief.taper` rises
  segGirth.forearm! *= lerp(1, 0.78, brief.taper);
  segGirth.shin! *= lerp(1, 0.8, brief.taper);
  segGirth.hand! *= lerp(1, 0.7, brief.taper);

  // edge: R briefs get a distinctly soft shared bevel, S briefs stay knife-hard
  const bevel = brief.edge === "R" ? clamp(0.62 + brief.taper * 0.18, 0.55, 0.95) : 0.05;

  // the 3 detail sizes, derived from unit — never a continuum
  const s = unit * 0.028;
  const detailSizes: [number, number, number] = [s * 2.4, s * 1.4, s * 0.7];

  return { unit, segLength, segGirth, bevel, detailSizes };
}
