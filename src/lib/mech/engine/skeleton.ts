/**
 * Parametric skeleton — the kinematic rig a part is designed around.
 *
 * Phase 1 pilots the SHIN: it spans the knee (top) and the ankle (bottom).
 * The rig owns the joint axes + ranges of motion; the form grammar then has
 * to respect the clearances those ranges imply (e.g. the greave must stop
 * above the ankle so the foot clears at full dorsiflexion).
 */

import { lerp } from "./rng";
import type { Brief, Proportions, Joint, Hardpoint, LoadReport } from "./types";

export interface ShinRig {
  /** local length of the shin segment (knee pivot -> ankle pivot) */
  length: number;
  /** nominal girth (front-to-back / side-to-side) of the calf */
  girth: number;
  /** local y of the knee pivot (top) */
  kneeY: number;
  /** local y of the ankle pivot (bottom) */
  ankleY: number;
  /**
   * how far ABOVE the ankle pivot the rigid greave must terminate so the foot
   * clears through the ankle's range — a functional, not arbitrary, number.
   */
  ankleClearance: number;
  /** the load solution the frame + shell are sized from */
  load: LoadReport;
  joints: Joint[];
  hardpoints: Hardpoint[];
}

export function buildShinRig(brief: Brief, prop: Proportions, load: LoadReport): ShinRig {
  const length = prop.segLength.shin! * prop.unit;
  const girth = prop.segGirth.shin! * prop.unit;

  // build in a local frame centred on the segment: knee at +L/2, ankle at -L/2
  const kneeY = length * 0.5;
  const ankleY = -length * 0.5;

  // ankle dorsiflexion range widens for agile roles -> needs more clearance
  const dorsi = lerp(0.35, 0.6, brief.role === "skirmisher" || brief.role === "recon" ? 0.9 : 0.3);
  const plantar = 0.55;
  // clearance = foot swing at full dorsiflexion + safety gap, PLUS room for the
  // ankle drum, which is now sized by load (a bruiser's drum is much bigger).
  const ankleClearance =
    girth * 0.9 * Math.sin(dorsi) + length * 0.18 + load.actuator.ankle.drumRadius * 0.9;

  // a bulkier calf (heavy armour) shortens deep knee flexion slightly
  const kneeMax = lerp(2.3, 1.9, Math.min(1, (load.armourAllowance - 0.4) / 1.6));

  const joints: Joint[] = [
    {
      id: "knee",
      pivot: [0, kneeY, -girth * 0.15],
      axis: [1, 0, 0],
      range: [-0.05, kneeMax],
      neutral: 0,
    },
    {
      id: "ankle",
      pivot: [0, ankleY, 0],
      axis: [1, 0, 0],
      range: [-plantar, dorsi],
      neutral: 0,
    },
  ];

  const hardpoints: Hardpoint[] = [
    // one on the outer calf for skirt binders / boosters
    {
      id: "calf-outer",
      pos: [girth * 0.55, length * 0.05, -girth * 0.1],
      normal: [1, 0, 0],
      size: girth * 0.3,
      rating: 0.4,
    },
    // one at the shin front for shields / greave add-ons
    {
      id: "shin-front",
      pos: [0, length * 0.1, girth * 0.55],
      normal: [0, 0, 1],
      size: girth * 0.32,
      rating: 0.5,
    },
  ];

  return { length, girth, kneeY, ankleY, ankleClearance, load, joints, hardpoints };
}
