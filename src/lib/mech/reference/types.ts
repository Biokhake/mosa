/**
 * =========================================================================
 * REFERENCE MEASUREMENTS
 * =========================================================================
 *
 * What a single thumbnail is worth, expressed as data.
 *
 * The point of this file is that a reconstruction should not depend on me
 * hunting down blueprints per kit. One front-view thumbnail gives a silhouette,
 * and a silhouette gives landmarks: where the chin is, how wide the shoulders
 * are, where the knee breaks. Those landmarks are enough to place every socket
 * and to score every later render, which is the whole workflow.
 *
 * NORMALISATION. Every value is a fraction of the figure's HEIGHT — sole to
 * crown, crest excluded. That makes a measurement portable: the same record
 * describes a four-head walking tank and an eight-head light frame, and the
 * studio just multiplies by whatever world height it renders at.
 *
 * `y` runs UP from the sole: y.sole is 0 and y.crown is 1.
 *
 * DEPTH. A front thumbnail carries no depth, so `d` is a prior, not a
 * measurement — thicknesses relative to height that hold across most designs.
 * Depth error reads far weaker than front-view proportion error, which is the
 * trade this workflow accepts in exchange for not doing research per kit.
 */

export interface RefLandmarks {
  /** always 0 — the ground line */
  sole: number;
  ankle: number;
  /** bottom of the knee block */
  kneeLow: number;
  /** the knee pivot */
  knee: number;
  /** top of the thigh / bottom of the skirt */
  crotch: number;
  /** hip pivot */
  hip: number;
  /** the narrowest point of the torso */
  waist: number;
  /** where the chest mass starts */
  chestLow: number;
  /** the widest point of the chest */
  chestHigh: number;
  /** shoulder pivot height */
  shoulder: number;
  /** base of the neck */
  neck: number;
  /** bottom of the head */
  chin: number;
  /** top of the helmet — this is 1 by definition */
  crown: number;
  /** tip of any crest above the crown; may exceed 1 */
  crest: number;
  /** elbow pivot */
  elbow: number;
  /** wrist pivot */
  wrist: number;
}

export interface RefWidths {
  /** head width */
  head: number;
  /** outer edge to outer edge across the shoulders */
  shoulderSpan: number;
  /** shoulder pivot separation (where the arms actually hang) */
  shoulderPivot: number;
  chest: number;
  waist: number;
  hip: number;
  /** hip pivot separation (where the legs actually hang) */
  hipPivot: number;
  thigh: number;
  shin: number;
  foot: number;
  upperArm: number;
  forearm: number;
}

/** Front views carry no depth; these are priors, not measurements. */
export interface RefDepths {
  head: number;
  chest: number;
  waist: number;
  thigh: number;
  shin: number;
  /** foot LENGTH, which is the one depth a front view hints at */
  foot: number;
  upperArm: number;
  forearm: number;
}

export interface RefMeasure {
  /** the kit key this describes */
  key: string;
  /** where the numbers came from — a note for whoever reads them next */
  source: string;
  /** world height the studio renders this kit at, sole to crown */
  height: number;
  /** world y of the ground line */
  groundY: number;
  y: RefLandmarks;
  w: RefWidths;
  d: RefDepths;
}

/** Depth priors that hold across most humanoid mecha, as fractions of height. */
export const DEFAULT_DEPTHS: RefDepths = {
  head: 0.09,
  chest: 0.11,
  waist: 0.085,
  thigh: 0.065,
  shin: 0.07,
  foot: 0.115,
  upperArm: 0.055,
  forearm: 0.055,
};
