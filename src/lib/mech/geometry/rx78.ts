/**
 * =========================================================================
 * REFERENCE RECONSTRUCTION — RX-78
 * =========================================================================
 *
 * A shape-restoration exercise, not a product asset. The generative engine had
 * been calibrated against nothing: I invented the grammar and then invented the
 * thresholds that scored it, so a hundred kits came out as one kit with a
 * hundred sets of numbers. Statistics ABOUT designs turned out to be no
 * substitute for reconstructing one, because only the reconstruction tells you
 * what the vocabulary cannot say.
 *
 * So this is a single kit, authored by hand, slot by slot, in the studio's own
 * part system. What it is for:
 *
 *   1. Proving the slot map can carry a real design at all.
 *   2. Finding the missing vocabulary. Every place the reconstruction needs a
 *      form the grammar has no way to produce is a gap worth writing down —
 *      those gaps are the actual backlog for the generative side.
 *   3. Giving the critic something true to be measured against, instead of
 *      thresholds I picked.
 *
 * NOT FOR DISTRIBUTION. Study reconstruction only.
 *
 * Authoring conventions
 * ---------------------
 * Coordinates are LOCAL to each slot's socket (see catalog.ts). Paired slots
 * are authored once for +X — the robot's LEFT — and `buildPart` mirrors the
 * `/R$/` side, so never write a left and a right by hand.
 *
 * Colour blocking, which is half of this design's identity:
 *   prim  white shell        sec   deep blue
 *   acc   red                trim  yellow
 *   dark  near-black frame   metal bare mechanism
 *   visor eye green          joint articulation hardware
 */

import { B, C, Sp, Torus, Trap, Wedge } from "./primitives";
import type { Spec } from "./types";

const PI2 = Math.PI / 2;

/* ============================== HEAD ================================== */

/** Helmet shell. The face opening is left empty for the mask in `visor`. */
function helm(): Spec[] {
  // socket 1.79 — cranium 1.725..1.868, crown block to 1.888. Width 0.175.
  return [
    B("prim", 0.175, 0.143, 0.165, 0, 0.006, -0.012),
    Trap("prim", 0.125, 0.175, 0.03, 0, 0.092, -0.012, 0, 0, 0, 0.155),
    // the raised block on the crown centreline
    B("prim", 0.05, 0.022, 0.06, 0, 0.107, 0.005),
    // brow shelf the crest hub seats against
    B("prim", 0.14, 0.03, 0.05, 0, 0.062, 0.06),
    Trap("prim", 0.118, 0.16, 0.085, 0, -0.008, -0.09, -0.1, 0, 0, 0.055),
  ];
}

/** The black face mask: the whole front of the head is a dark recess. */
function visorMask(): Spec[] {
  // socket 1.78 — the mask fills the face opening 1.706..1.852
  return [
    B("dark", 0.115, 0.146, 0.03, 0, -0.001, 0),
    B("dark", 0.12, 0.016, 0.036, 0, 0.058, 0.004),
    // centre ridge: brow to chin
    Wedge("prim", 0.022, 0.085, 0.028, 0, -0.012, 0.018),
    // projecting chin block at the base of the ridge
    Trap("prim", 0.03, 0.024, 0.03, 0, -0.056, 0.02, 0, 0, 0, 0.03),
  ];
}

/** One optic. Authored for +X; the R slot is mirrored. */
function eye(): Spec[] {
  return [
    B("visor", 0.036, 0.018, 0.016, 0, 0.004, 0, 0, 0, 0.14),
    B("dark", 0.043, 0.028, 0.009, 0, 0.004, -0.009),
  ];
}

/** Forehead sensor under the crest. */
function brow(): Spec[] {
  return [
    B("prim", 0.115, 0.024, 0.032, 0, -0.008, -0.01),
    B("acc", 0.028, 0.015, 0.016, 0, -0.002, 0.014),
  ];
}

/**
 * The crest. Two blades sweeping up and out from a central hub — authored
 * whole here because the crest slot is on the centreline and is not mirrored.
 */
function crest(): Spec[] {
  // socket 1.88 — hub at the forehead, blade tips out to x +/-0.132, level with
  // the crown at 1.90. Span is ~1.5 head widths, which is what makes it read.
  const blade = (s: number): Spec[] => [
    B("trim", 0.085, 0.012, 0.016, s * 0.045, 0.006, -0.008, 0, 0, s * 0.2),
    B("trim", 0.062, 0.009, 0.013, s * 0.105, 0.018, -0.008, 0, 0, s * 0.28),
  ];
  return [
    B("acc", 0.03, 0.022, 0.026, 0, -0.014, 0.004),
    Wedge("acc", 0.026, 0.03, 0.02, 0, -0.03, 0.014, 0, 0, Math.PI),
    ...blade(1),
    ...blade(-1),
  ];
}

/** Side vent covers. Authored for +X. */
function ear(): Spec[] {
  // socket +/-0.115, 1.78 — the side duct block
  return [
    B("prim", 0.026, 0.078, 0.088, 0, -0.004, -0.008),
    B("trim", 0.012, 0.056, 0.062, 0.015, -0.004, -0.005),
    ...[0, 1, 2].map((i) => B("dark", 0.007, 0.007, 0.056, 0.022, 0.014 - i * 0.018, -0.005)),
    C("joint", 0.018, 0.018, 0.022, -0.013, -0.004, -0.008, 0, 0, PI2, 10),
  ];
}

/** Cheek plate below the temple. Authored for +X. */
function cheek(): Spec[] {
  // socket +/-0.095, 1.73 — a stack of vertical louvres beside the mask
  return [
    B("prim", 0.026, 0.078, 0.05, 0, 0.004, -0.004),
    B("dark", 0.014, 0.07, 0.03, 0.009, 0.004, 0.016),
    ...[0, 1, 2, 3].map((i) => B("metal", 0.016, 0.008, 0.032, 0.009, 0.026 - i * 0.017, 0.017)),
  ];
}

/** The chin block that closes the mask from below. */
function chin(): Spec[] {
  // socket 1.68 — closes the mask, 1.640..1.706
  return [
    Trap("prim", 0.07, 0.115, 0.066, 0, -0.007, -0.016, 0.2, 0, 0, 0.062),
    B("dark", 0.062, 0.018, 0.024, 0, -0.03, 0.01),
  ];
}

/** The vent slit under the optics. */
function mouth(): Spec[] {
  return [
    B("dark", 0.078, 0.024, 0.028, 0, 0, 0),
    ...[0, 1].map((i) => B("metal", 0.064, 0.006, 0.03, 0, 0.005 - i * 0.012, 0.002)),
  ];
}

function jaw(): Spec[] {
  // socket 1.66 — the head bottoms out at 1.640 and the neck takes over
  return [
    B("prim", 0.112, 0.05, 0.1, 0, -0.005, -0.005),
    C("dark", 0.038, 0.04, 0.04, 0, -0.032, -0.02, 0, 0, 0, 10),
  ];
}

/* ============================== TORSO ================================= */

/** Neck column plus the collar the head sits in. */
function collar(): Spec[] {
  // socket 1.58 — neck column 1.552..1.646, plus the ribbed guard across the
  // front of the throat, which reads from any distance and was missing
  return [
    C("dark", 0.032, 0.036, 0.094, 0, 0.019, -0.01, 0, 0, 0, 12),
    Torus("joint", 0.038, 0.009, 0, 0.056, -0.01, PI2, 0, 0, 14),
    B("prim", 0.145, 0.03, 0.095, 0, -0.018, -0.004),
    // ribbed throat guard, pitched forward
    Trap("prim", 0.1, 0.135, 0.055, 0, 0.014, 0.052, 0.42, 0, 0, 0.05),
    ...[0, 1, 2, 3].map((i) =>
      B("dark", 0.104 - i * 0.008, 0.006, 0.05, 0, 0.034 - i * 0.014, 0.058 + i * 0.006, 0.42),
    ),
    Wedge("prim", 0.135, 0.045, 0.038, 0, 0.012, -0.058, -0.35),
  ];
}

/**
 * The chest block. This design's chest is one wide mass with a strong
 * horizontal break, not a stack of plates — the intakes and the side panels
 * are separate slots that seat against it.
 */
function chestCore(): Spec[] {
  return [
    B("prim", 0.24, 0.17, 0.19, 0, 0.0, -0.015),
    // upper chest, wider and pitched forward over the abdomen
    Trap("prim", 0.3, 0.24, 0.09, 0, 0.075, 0.01, 0, 0, 0, 0.185),
    // the dark undercut that separates chest from waist
    B("dark", 0.21, 0.045, 0.15, 0, -0.098, -0.01),
    // shoulder sockets
    C("joint", 0.038, 0.038, 0.1, 0.135, 0.055, -0.01, 0, 0, PI2, 12),
    C("joint", 0.038, 0.038, 0.1, -0.135, 0.055, -0.01, 0, 0, PI2, 12),
    // neck seat
    C("dark", 0.042, 0.048, 0.05, 0, 0.115, -0.01, 0, 0, 0, 12),
  ];
}

/** The twin intakes on the upper chest. Authored for +X. */
function pec(): Spec[] {
  // socket +/-0.13, 1.46, 0.09 — a canted louvre stack, taller than it is wide
  return [
    B("prim", 0.062, 0.095, 0.05, 0, 0.004, 0, 0, 0, -0.22),
    B("dark", 0.048, 0.082, 0.024, 0.002, 0.004, 0.02, 0, 0, -0.22),
    ...[0, 1, 2, 3, 4].map((i) =>
      B("metal", 0.05, 0.006, 0.028, 0.002, 0.032 - i * 0.016, 0.022, 0, 0, -0.22),
    ),
  ];
}

/** Blue side-chest panel. Authored for +X. */
function chest(): Spec[] {
  return [
    B("sec", 0.085, 0.155, 0.16, -0.012, 0.005, 0),
    Trap("sec", 0.06, 0.085, 0.05, -0.012, 0.09, 0.005, 0, 0, 0, 0.15),
    B("dark", 0.02, 0.12, 0.14, -0.056, 0.0, 0),
  ];
}

/** The chest hatch. Form only — no insignia. */
function cockpit(): Spec[] {
  return [
    B("prim", 0.125, 0.135, 0.045, 0, 0, 0),
    B("trim", 0.105, 0.018, 0.016, 0, 0.052, 0.026),
    B("dark", 0.09, 0.008, 0.012, 0, -0.05, 0.026),
    C("metal", 0.007, 0.007, 0.02, 0.048, -0.05, 0.022, PI2, 0, 0, 6),
    C("metal", 0.007, 0.007, 0.02, -0.048, -0.05, 0.022, PI2, 0, 0, 6),
  ];
}

function abdomen(): Spec[] {
  return [
    C("dark", 0.05, 0.055, 0.055, 0, 0.05, -0.012, 0, 0, 0, 12),
    B("prim", 0.155, 0.095, 0.135, 0, -0.025, -0.012),
    B("acc", 0.05, 0.05, 0.028, 0, -0.02, 0.058),
    B("trim", 0.13, 0.014, 0.02, 0, -0.068, 0.05),
  ];
}

function pelvis(): Spec[] {
  return [
    B("prim", 0.185, 0.085, 0.15, 0, 0, -0.005),
    Trap("trim", 0.05, 0.095, 0.055, 0, -0.01, 0.072, 0, 0, 0, 0.03),
    // hip yokes
    C("joint", 0.032, 0.032, 0.08, 0.1, -0.03, 0, 0, 0, PI2, 12),
    C("joint", 0.032, 0.032, 0.08, -0.1, -0.03, 0, 0, 0, PI2, 12),
  ];
}

/* ============================== SKIRTS ================================ */

/** Two hinged plates, not one apron. */
function skirtF(): Spec[] {
  // socket 1.02, z 0.12 — the dominant plate of the waist
  return [
    B("prim", 0.2, 0.15, 0.055, 0, -0.06, 0, 0.1),
    // the big central recess
    B("dark", 0.115, 0.09, 0.02, 0, -0.058, 0.03, 0.1),
    B("prim", 0.09, 0.068, 0.014, 0, -0.058, 0.04, 0.1),
    // the marker at the top edge of the plate
    Wedge("trim", 0.036, 0.026, 0.018, 0, 0.008, 0.026, 0, 0, Math.PI),
    Trap("prim", 0.16, 0.2, 0.03, 0, -0.142, 0.004, 0.1, 0, 0, 0.05),
  ];
}

function skirtSide(): Spec[] {
  // socket +/-0.16, 1.02 — a rounded plate hung off the hip
  return [
    B("prim", 0.05, 0.145, 0.115, 0.014, -0.058, -0.005, 0, 0, -0.08),
    B("dark", 0.02, 0.045, 0.09, -0.012, 0.012, -0.005),
    B("trim", 0.028, 0.016, 0.045, 0.026, -0.108, 0.008),
  ];
}

function skirtB(): Spec[] {
  return [B("prim", 0.165, 0.145, 0.045, 0, -0.058, 0, -0.12), B("dark", 0.13, 0.03, 0.03, 0, 0.008, 0.01)];
}

/* =============================== ARMS ================================= */

/**
 * The pauldron: a large box hung outboard of the joint, drawn in at the top,
 * with a red band near the crown and an angled cut on the outer bottom.
 */
function shoulder(): Spec[] {
  // socket 1.46, x 0.30 — pauldron spans x 0.205..0.355, i.e. a shoulder span
  // of about 3.9 head widths against the ~3.5 measured off the reference
  return [
    B("prim", 0.15, 0.145, 0.15, -0.02, -0.004, 0),
    Trap("prim", 0.105, 0.15, 0.038, -0.02, 0.088, 0, 0, 0, 0, 0.145),
    B("acc", 0.144, 0.016, 0.144, -0.02, 0.07, 0),
    Wedge("prim", 0.14, 0.048, 0.05, -0.02, -0.086, 0.0, -0.2),
    B("dark", 0.06, 0.095, 0.095, -0.115, -0.005, 0),
    C("joint", 0.034, 0.034, 0.07, -0.125, -0.005, 0, 0, 0, PI2, 12),
  ];
}

function upperArm(): Spec[] {
  // socket y 1.26 — spans 1.100..1.400, meeting the pauldron above and the
  // elbow (which lives on the forearm) below
  return [
    C("prim", 0.052, 0.049, 0.3, 0, -0.01, 0, 0, 0, 0, 14),
    B("prim", 0.036, 0.19, 0.095, 0.04, -0.02, 0),
    C("dark", 0.04, 0.04, 0.05, 0, 0.135, 0, 0, 0, 0, 12),
    B("dark", 0.075, 0.05, 0.085, 0, -0.15, 0),
  ];
}

/** Forearm, with the elbow module riding at its top — the joint is not a slot. */
function forearm(): Spec[] {
  // socket y 0.90 — the elbow module sits at 1.06 (its own slot is gone) and
  // the shell runs 0.800..1.040 down to the wrist
  return [
    C("joint", 0.038, 0.038, 0.085, 0, 0.16, 0, 0, 0, PI2, 12),
    B("dark", 0.07, 0.06, 0.08, 0, 0.16, 0),
    B("prim", 0.1, 0.2, 0.1, 0, 0.02, 0),
    Trap("prim", 0.08, 0.1, 0.05, 0, -0.1, 0, 0, 0, 0, 0.095),
    B("prim", 0.04, 0.155, 0.09, 0.052, 0.025, 0),
    B("trim", 0.015, 0.032, 0.052, 0.066, 0.082, 0.005),
    C("dark", 0.032, 0.034, 0.035, 0, -0.13, 0, 0, 0, 0, 12),
  ];
}

function vambrace(): Spec[] {
  return [B("prim", 0.05, 0.055, 0.055, 0.03, -0.05, -0.02), B("acc", 0.03, 0.012, 0.03, 0.04, -0.028, -0.02)];
}

function hand(): Spec[] {
  // socket y 0.72 — palm 0.685..0.775, fingers to 0.655
  const finger = (i: number): Spec[] => [
    B("prim", 0.014, 0.052, 0.017, -0.022 + i * 0.015, -0.06, 0.012),
    B("dark", 0.012, 0.012, 0.015, -0.022 + i * 0.015, -0.036, 0.012),
  ];
  return [
    B("prim", 0.074, 0.09, 0.08, 0, -0.01, 0),
    B("dark", 0.055, 0.022, 0.065, 0, 0.04, 0),
    ...[0, 1, 2, 3].flatMap(finger),
    B("prim", 0.017, 0.045, 0.019, 0.042, -0.03, 0.022, 0, 0, -0.5),
  ];
}

/* =============================== LEGS ================================= */

function hip(): Spec[] {
  // socket y 0.98 — the joint the thigh hangs from
  return [
    C("joint", 0.04, 0.04, 0.08, 0, 0, 0, 0, 0, PI2, 12),
    B("dark", 0.065, 0.075, 0.085, 0, -0.015, 0),
    Sp("metal", 0.03, 0, 0.012, 0, 10),
  ];
}

function thigh(): Spec[] {
  // socket y 0.76 — runs 0.560..0.945, hip joint to knee
  return [
    B("prim", 0.115, 0.34, 0.12, 0, -0.005, 0),
    Trap("prim", 0.085, 0.115, 0.055, 0, -0.185, 0, 0, 0, 0, 0.105),
    B("dark", 0.08, 0.045, 0.095, 0, 0.2, 0),
    B("prim", 0.022, 0.22, 0.105, 0.058, -0.01, 0),
  ];
}

/**
 * Shin, carrying the knee at its top. The front centre ridge is the feature
 * that makes this leg read from a distance; the ankle guard closes it below.
 */
function shin(): Spec[] {
  // socket y 0.28 — knee 0.460..0.560, shell 0.140..0.460, ankle at 0.100
  return [
    C("joint", 0.04, 0.04, 0.095, 0, 0.235, 0.012, 0, 0, PI2, 12),
    B("sec", 0.095, 0.075, 0.1, 0, 0.235, 0.03),
    Wedge("prim", 0.108, 0.062, 0.07, 0, 0.268, 0.032, -0.1),
    B("prim", 0.122, 0.32, 0.125, 0, 0.02, 0.0),
    Wedge("prim", 0.07, 0.3, 0.052, 0, 0.02, 0.068),
    Trap("prim", 0.1, 0.122, 0.055, 0, -0.152, 0.0, 0, 0, 0, 0.12),
    B("sec", 0.088, 0.17, 0.038, 0, 0.03, -0.068),
    // ankle guard — the ankle slot is gone, this owns it
    B("prim", 0.105, 0.06, 0.1, 0, -0.185, 0.005),
    C("joint", 0.03, 0.03, 0.08, 0, -0.205, 0, 0, 0, PI2, 12),
    B("trim", 0.058, 0.018, 0.022, 0, -0.16, 0.055),
  ];
}

function foot(): Spec[] {
  // socket y 0.04 — sole at 0.018, top of the boot at 0.105
  return [
    B("prim", 0.12, 0.062, 0.18, 0, 0.022, 0.025),
    Wedge("prim", 0.112, 0.055, 0.058, 0, 0.018, 0.135),
    B("dark", 0.12, 0.024, 0.18, 0, -0.014, 0.025),
    Trap("prim", 0.075, 0.1, 0.055, 0, 0.025, -0.078, 0, 0, 0, 0.055),
    B("trim", 0.052, 0.015, 0.019, 0, 0.048, 0.11),
  ];
}

/* =============================== BACK ================================= */

function pack(): Spec[] {
  return [
    B("prim", 0.225, 0.2, 0.09, 0, -0.01, 0),
    Trap("prim", 0.16, 0.225, 0.05, 0, 0.12, 0, 0, 0, 0, 0.085),
    B("dark", 0.19, 0.04, 0.06, 0, -0.105, 0.005),
    // saber racks
    C("dark", 0.019, 0.019, 0.115, 0.055, 0.115, -0.03, 0, 0, 0, 10),
    C("dark", 0.019, 0.019, 0.115, -0.055, 0.115, -0.03, 0, 0, 0, 10),
    C("metal", 0.015, 0.015, 0.03, 0.055, 0.185, -0.03, 0, 0, 0, 10),
    C("metal", 0.015, 0.015, 0.03, -0.055, 0.185, -0.03, 0, 0, 0, 10),
  ];
}

/** Main thruster. Authored for +X. */
function thruster(): Spec[] {
  return [
    C("dark", 0.052, 0.044, 0.1, 0, 0, -0.01, PI2, 0, 0, 16),
    C("metal", 0.055, 0.052, 0.03, 0, 0, -0.062, PI2, 0, 0, 16),
    Torus("joint", 0.05, 0.008, 0, 0, 0.036, 0, 0, 0, 16),
  ];
}

/* ============================ DISPATCH ================================ */

/**
 * Every slot this reconstruction defines. A slot not listed here renders
 * nothing — which is itself information: it marks a slot the design does not
 * use, and the studio should not be offering it for this kit.
 */
const BUILD: Record<string, () => Spec[]> = {
  helm,
  visor: visorMask,
  brow,
  eye,
  vfin: crest,
  ear,
  cheek,
  chin,
  mouth,
  jaw,
  collar,
  chestCore,
  chest,
  pec,
  cockpit,
  abdomen,
  pelvis,
  skirtF,
  skirtB,
  skirt: skirtSide,
  shoulder,
  upper: upperArm,
  forearm,
  vambrace,
  hand,
  hip,
  thigh,
  shin,
  foot,
  pack,
  thruster,
};

/** The reference key this build answers to. */
export const RX78_KEY = "RX-78";

/**
 * `slotBase` is the slot id with its trailing L/R removed, and side slots are
 * authored for +X only — `buildPart` mirrors the R side.
 */
export function rx78(slotBase: string): Spec[] | null {
  const f = BUILD[slotBase];
  return f ? f() : null;
}
