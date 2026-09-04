/**
 * PROPORTION SCORING.
 *
 * The engine has always had a proportion MODEL, but it never had an opinion
 * about it — nothing asked "are these ratios any good?". A very large part of
 * why some mecha read as designed and others as assembled lives here, before a
 * single panel is placed.
 *
 * Targets are expressed as soft ranges per design philosophy: inside the range
 * costs nothing, outside it costs in proportion to how far out it is.
 */

import type { Brief, Proportions } from "./types";

type Range = [number, number];

export interface ProportionTargets {
  /** total height measured in head heights */
  headCount: Range;
  /** shoulder span / total height */
  shoulderSpan: Range;
  /** thigh length / shin length */
  thighToShin: Range;
  /** upper arm / forearm */
  upperToFore: Range;
  /** leg length / total height */
  legShare: Range;
  /** torso girth / shoulder span */
  torsoFill: Range;
}

/**
 * A heroic mecha is NOT a scaled human: it runs long-legged, small-headed and
 * broad-shouldered. These ranges centre on that read, then shift per
 * philosophy — a siege frame is squatter, a runner is leggier.
 */
const BASE: ProportionTargets = {
  headCount: [6.8, 8.4],
  shoulderSpan: [0.26, 0.34],
  thighToShin: [0.92, 1.14],
  upperToFore: [0.94, 1.16],
  legShare: [0.46, 0.545],
  torsoFill: [0.5, 0.72],
};

const PHILOSOPHY_SHIFT: Record<string, Partial<ProportionTargets>> = {
  "siege-fortress": { headCount: [5.8, 7.2], shoulderSpan: [0.32, 0.42], legShare: [0.42, 0.5], torsoFill: [0.62, 0.84] },
  "tactical-brick": { headCount: [6.2, 7.6], shoulderSpan: [0.29, 0.38], torsoFill: [0.58, 0.8] },
  "aero-runner": { headCount: [7.4, 9.0], legShare: [0.5, 0.58], shoulderSpan: [0.23, 0.3], torsoFill: [0.44, 0.62] },
  "organic-curve": { headCount: [7.2, 8.8], legShare: [0.48, 0.56], torsoFill: [0.46, 0.66] },
  "predator-organic": { headCount: [7.4, 8.8], legShare: [0.49, 0.57], shoulderSpan: [0.24, 0.32] },
  "ornate-baroque": { headCount: [7.0, 8.4], shoulderSpan: [0.28, 0.38] },
  "faceted-knight": { headCount: [6.9, 8.2] },
  "filleted-utility": {},
};

function targetsFor(brief: Brief): ProportionTargets {
  return { ...BASE, ...(PHILOSOPHY_SHIFT[brief.philosophy] ?? {}) };
}

/** 0 inside the range, growing with the relative distance outside it. */
function miss(v: number, [lo, hi]: Range): number {
  if (v >= lo && v <= hi) return 0;
  const span = hi - lo || 1;
  return (v < lo ? lo - v : v - hi) / span;
}

export interface ProportionReport {
  /** 0..1, 1 = every ratio inside its target band */
  score: number;
  ratios: Record<keyof ProportionTargets, number>;
  offenders: string[];
}

export function scoreProportions(prop: Proportions, brief: Brief): ProportionReport {
  const L = (k: string) => (prop.segLength[k] ?? 0) * prop.unit;
  const G = (k: string) => (prop.segGirth[k] ?? 0) * prop.unit;

  const headH = Math.max(1e-4, G("neck") * 2.2);
  const legLen = L("thigh") + L("shin") + L("foot");
  const total = Math.max(1e-4, legLen + L("waist") + L("torso") + L("neck") + headH);
  const shoulder = G("torso") + G("upperArm") * 0.8;

  const ratios = {
    headCount: total / headH,
    shoulderSpan: shoulder / total,
    thighToShin: L("thigh") / Math.max(1e-4, L("shin")),
    upperToFore: L("upperArm") / Math.max(1e-4, L("forearm")),
    legShare: legLen / total,
    torsoFill: G("torso") / Math.max(1e-4, shoulder),
  } as Record<keyof ProportionTargets, number>;

  const t = targetsFor(brief);
  const weights: Record<keyof ProportionTargets, number> = {
    headCount: 0.28,
    legShare: 0.22,
    shoulderSpan: 0.2,
    thighToShin: 0.12,
    upperToFore: 0.1,
    torsoFill: 0.08,
  };

  let penalty = 0;
  const offenders: string[] = [];
  for (const k of Object.keys(weights) as (keyof ProportionTargets)[]) {
    const m = miss(ratios[k], t[k]);
    if (m > 0) {
      penalty += Math.min(1, m) * weights[k];
      offenders.push(`${k} ${ratios[k].toFixed(2)} outside [${t[k][0]}, ${t[k][1]}]`);
    }
  }

  return { score: Math.max(0, 1 - penalty), ratios, offenders };
}
