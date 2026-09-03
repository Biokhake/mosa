/**
 * Coarse whole-body mass model.
 *
 * Only the shin renders in Phase 1/2, but its joint loads depend on the mass
 * of everything distal to them AND the payload the frame is designed to carry.
 * This gives a per-segment relative mass so the load solver can trace it.
 */

import type { Brief, Proportions } from "../types";

/** How much armour shell a role wants over the bare structure. */
const ROLE_ARMOUR: Record<Brief["role"], number> = {
  skirmisher: 0.75,
  recon: 0.55,
  line: 1.0,
  support: 0.95,
  artillery: 1.15,
  bruiser: 1.6,
};

/** Payload the frame is built to carry (relative), by role — feeds joint load. */
export const ROLE_PAYLOAD: Record<Brief["role"], { back: number; armR: number; armL: number }> = {
  skirmisher: { back: 0.35, armR: 0.45, armL: 0.2 },
  recon: { back: 0.5, armR: 0.3, armL: 0.15 },
  line: { back: 0.4, armR: 0.55, armL: 0.35 },
  support: { back: 0.7, armR: 0.4, armL: 0.4 },
  artillery: { back: 0.95, armR: 1.1, armL: 0.3 },
  bruiser: { back: 0.45, armR: 0.7, armL: 0.6 },
};

const SEGMENTS = [
  "neck",
  "torso",
  "waist",
  "upperArm",
  "forearm",
  "hand",
  "thigh",
  "shin",
  "foot",
] as const;
export type Segment = (typeof SEGMENTS)[number];

export interface BodyMass {
  /** relative mass per segment (one side for limbs) */
  seg: Record<Segment, number>;
  /** relative total (2× limbs counted) */
  total: number;
  /** relative payload carried at the shoulders / back */
  payload: number;
}

/** relative mass of one segment: structure + role-scaled armour shell. */
function segmentMass(seg: Segment, prop: Proportions, brief: Brief): number {
  const L = prop.segLength[seg]! * prop.unit;
  const G = prop.segGirth[seg]! * prop.unit;
  const structVol = Math.PI * (G * 0.5) ** 2 * L * 0.55; // hollow-ish
  const shellVol = structVol * (0.22 + brief.decoration * 0.42) * ROLE_ARMOUR[brief.role];
  return structVol * 0.4 + shellVol;
}

export function bodyMass(brief: Brief, prop: Proportions): BodyMass {
  const seg = {} as Record<Segment, number>;
  for (const s of SEGMENTS) seg[s] = segmentMass(s, prop, brief);

  // payload weights are relative "modules"; scale to the same units as segment
  // mass (~ a module ≈ 1.5% of a unit cube).
  const p = ROLE_PAYLOAD[brief.role];
  const payload = (p.back + p.armR + p.armL) * 0.016 * prop.unit ** 3;

  const limbs = ["upperArm", "forearm", "hand", "thigh", "shin", "foot"] as const;
  // a head mass ≈ 1.4× the neck girth cube
  const headMass = Math.PI * (prop.segGirth.neck! * prop.unit) ** 2 * 0.12 * (1 + brief.decoration * 0.3);
  let total = headMass + seg.neck + seg.torso + seg.waist + payload;
  for (const l of limbs) total += seg[l] * 2;

  return { seg, total, payload };
}

export { ROLE_ARMOUR };
