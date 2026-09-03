/**
 * Lightweight mass model — relative units, for balance / load judgement.
 * Phase 1 is qualitative (is it top-heavy? which joint carries most moment?);
 * real N·m waits on a material + actuator catalogue.
 */

import type { Joint, MatRole, Prim } from "../types";
import type { ShinRig } from "../skeleton";

/** Relative density by material role. */
const DENSITY: Record<MatRole, number> = {
  armorA: 1,
  armorB: 0.9,
  accent: 0.7,
  trim: 0.6,
  frame: 1.4,
  mechanism: 1.6,
  metal: 2.0,
  light: 0.3,
};

function vol(p: Prim): number {
  const [a, b, c] = p.size;
  switch (p.kind) {
    case "box":
      return Math.abs(a * b * c);
    case "wedge":
      return Math.abs(a * b * c) * 0.5;
    case "trapPrism":
      return ((a + b) / 2) * c * (p.depth ?? 0.04);
    case "cyl":
      return Math.PI * ((a + b) / 2) ** 2 * c;
    case "cone":
      return (Math.PI / 3) * b ** 2 * c;
    case "capsule":
      return Math.PI * a ** 2 * b + (4 / 3) * Math.PI * a ** 3;
    case "sphere":
      return (4 / 3) * Math.PI * a ** 3;
    case "hemi":
      return (2 / 3) * Math.PI * a ** 3;
    case "octa":
      return (4 / 3) * a ** 3;
    default:
      return a * a * a;
  }
}

export interface MassReport {
  mass: number;
  com: [number, number, number];
  jointMoment: Record<string, number>;
}

export function massReportShin(prims: Prim[], rig: ShinRig): MassReport {
  return massReportLimb(prims, rig.joints);
}

/** Generic limb mass model — any part that exposes a list of local joints. */
export function massReportLimb(prims: Prim[], joints: Joint[]): MassReport {
  let m = 0;
  const c: [number, number, number] = [0, 0, 0];
  const items = prims.map((p) => {
    const w = vol(p) * DENSITY[p.role];
    m += w;
    c[0] += w * p.pos[0];
    c[1] += w * p.pos[1];
    c[2] += w * p.pos[2];
    return { w, y: p.pos[1] };
  });
  if (m > 0) {
    c[0] /= m;
    c[1] /= m;
    c[2] /= m;
  }

  // moment about each joint = Σ mass below-the-joint * lever arm
  const jointMoment: Record<string, number> = {};
  for (const j of joints) {
    let moment = 0;
    for (const it of items) {
      if (it.y < j.pivot[1]) moment += it.w * (j.pivot[1] - it.y);
    }
    jointMoment[j.id] = moment;
  }

  return { mass: m, com: c, jointMoment };
}
