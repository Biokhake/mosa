/**
 * =========================================================================
 * SOCKETS DERIVED FROM A REFERENCE — the (B) half of the reconstruction loop
 * =========================================================================
 *
 * The catalogue's socket map is one fixed table of coordinates. That was fine
 * while every kit was the same figure with different surface detail, and it is
 * the wrong shape the moment kits come from references: a walking weapons
 * platform and a light frame cannot share a shoulder height, a hip separation
 * or a knee break. Every reconstruction so far has been fighting the table —
 * the pauldron had to be pushed INBOARD of its own socket because the socket
 * sat at x 0.30 whatever the design wanted.
 *
 * So sockets are computed from the reference's landmarks instead. What lives
 * here is the LAYOUT RULE — where each slot sits relative to the measured
 * skeleton — while the measurements themselves come from the thumbnail. The
 * fractions below were read back off the existing catalogue, so a kit with
 * humanoid measurements lands almost exactly where the old table put it; they
 * are the layout convention made explicit rather than a new invention.
 */

import type { RefMeasure } from "./types";

export type Vec3 = [number, number, number];

/** Sockets and rig rests for one kit, keyed by slot id / rig node id. */
export interface DerivedFrame {
  sockets: Record<string, Vec3>;
  rests: Record<string, Vec3>;
  /** world y of each landmark, for anything that needs to measure against it */
  y: Record<string, number>;
}

export function deriveFrame(m: RefMeasure): DerivedFrame {
  const H = m.height;
  const G = m.groundY;
  /** landmark fraction -> world y */
  const Y = (f: number) => G + f * H;
  /** width fraction -> world half-width */
  const HX = (f: number) => (f * H) / 2;
  /** depth fraction -> world half-depth */
  const HZ = (f: number) => (f * H) / 2;

  const y = {
    sole: Y(m.y.sole),
    ankle: Y(m.y.ankle),
    kneeLow: Y(m.y.kneeLow),
    knee: Y(m.y.knee),
    crotch: Y(m.y.crotch),
    hip: Y(m.y.hip),
    waist: Y(m.y.waist),
    chestLow: Y(m.y.chestLow),
    chestHigh: Y(m.y.chestHigh),
    shoulder: Y(m.y.shoulder),
    neck: Y(m.y.neck),
    chin: Y(m.y.chin),
    crown: Y(m.y.crown),
    crest: Y(m.y.crest),
    elbow: Y(m.y.elbow),
    wrist: Y(m.y.wrist),
  };

  // --- head ---------------------------------------------------------------
  // Every head slot is placed inside the measured head box, so a tall narrow
  // head and a wide squat one both get a coherent face.
  const headH = y.crown - y.chin;
  const headHX = HX(m.w.head);
  const headHZ = HZ(m.d.head);
  /** fx: fraction of half-width, fy: fraction of head height above the chin, fz: fraction of half-depth */
  const head = (fx: number, fy: number, fz: number): Vec3 => [fx * headHX, y.chin + fy * headH, fz * headHZ];

  // --- torso --------------------------------------------------------------
  const chestH = y.chestHigh - y.chestLow;
  const chestHX = HX(m.w.chest);
  const chestHZ = HZ(m.d.chest);
  const chestCoreY = y.chestLow + 0.55 * chestH;

  // --- limbs --------------------------------------------------------------
  const shoulderX = HX(m.w.shoulderPivot);
  const hipX = HX(m.w.hipPivot);
  const upperY = y.shoulder - 0.53 * (y.shoulder - y.elbow);
  const foreY = y.elbow - 0.5 * (y.elbow - y.wrist);
  const thighY = y.hip - 0.458 * (y.hip - y.knee);
  const shinY = y.knee - 0.55 * (y.knee - y.ankle);
  const footY = y.ankle - 0.75 * (y.ankle - y.sole);

  const sockets: Record<string, Vec3> = {
    // head
    helm: head(0, 0.54, 0),
    visor: head(0, 0.5, 0.76),
    brow: head(0, 0.75, 0.71),
    eyeR: head(-0.46, 0.54, 0.82),
    eyeL: head(0.46, 0.54, 0.82),
    nose: head(0, 0.42, 0.88),
    mouth: head(0, 0.23, 0.76),
    jaw: head(0, 0, 0.47),
    // The ducts hang OFF the side of the head, so their sockets sit inboard of
    // the edge — placing them at the edge pushed the head 20% over its measured
    // width, because the duct's own vent face still reaches outward from there.
    earR: head(-0.72, 0.5, 0),
    earL: head(0.72, 0.5, 0),
    vfin: head(0, 0.92, 0.47),
    antennaR: head(-0.7, 0.83, -0.12),
    antennaL: head(0.7, 0.83, -0.12),
    cheekR: head(-0.78, 0.29, 0.41),
    cheekL: head(0.78, 0.29, 0.41),
    chin: head(0, 0.083, 0.76),

    // torso
    collar: [0, y.neck, chestHZ * 0.2],
    chestCore: [0, chestCoreY, chestHZ * 0.36],
    // same rule as the head ducts: the panel grows outward from its socket
    chestR: [-chestHX * 0.66, chestCoreY - chestH * 0.14, chestHZ * 0.18],
    chestL: [chestHX * 0.66, chestCoreY - chestH * 0.14, chestHZ * 0.18],
    pecR: [-chestHX * 0.53, y.chestHigh - chestH * 0.12, chestHZ * 0.8],
    pecL: [chestHX * 0.53, y.chestHigh - chestH * 0.12, chestHZ * 0.8],
    cockpit: [0, chestCoreY - chestH * 0.14, chestHZ * 1.25],
    abdomen: [0, y.waist + 0.42 * (y.chestLow - y.waist), chestHZ * 0.27],

    // waist
    pelvis: [0, y.hip, 0],
    skirtF: [0, y.crotch + 0.02 * H, HZ(m.d.waist) * 1.4],
    skirtB: [0, y.crotch + 0.02 * H, -HZ(m.d.waist) * 1.2],
    skirtR: [-HX(m.w.hip) * 0.9, y.crotch + 0.02 * H, 0],
    skirtL: [HX(m.w.hip) * 0.9, y.crotch + 0.02 * H, 0],

    // arms
    shoulderR: [-shoulderX, y.shoulder, 0],
    shoulderL: [shoulderX, y.shoulder, 0],
    upperR: [-shoulderX, upperY, 0],
    upperL: [shoulderX, upperY, 0],
    forearmR: [-shoulderX, foreY, 0],
    forearmL: [shoulderX, foreY, 0],
    vambraceR: [-shoulderX, foreY - 0.01 * H, HZ(m.d.forearm) * 0.5],
    vambraceL: [shoulderX, foreY - 0.01 * H, HZ(m.d.forearm) * 0.5],
    handR: [-shoulderX, y.wrist, 0],
    handL: [shoulderX, y.wrist, 0],

    // legs
    hipR: [-hipX, y.hip, 0],
    hipL: [hipX, y.hip, 0],
    thighR: [-hipX, thighY, 0],
    thighL: [hipX, thighY, 0],
    shinR: [-hipX, shinY, 0.005 * H],
    shinL: [hipX, shinY, 0.005 * H],
    footR: [-hipX, footY, 0.01 * H],
    footL: [hipX, footY, 0.01 * H],

    // back
    pack: [0, chestCoreY + chestH * 0.12, -chestHZ * 1.4],
    thrusterR: [-chestHX * 0.44, chestCoreY - chestH * 0.1, -chestHZ * 2.1],
    thrusterL: [chestHX * 0.44, chestCoreY - chestH * 0.1, -chestHZ * 2.1],
    binderR: [-chestHX * 0.76, chestCoreY + chestH * 0.28, -chestHZ * 1.6],
    binderL: [chestHX * 0.76, chestCoreY + chestH * 0.28, -chestHZ * 1.6],
    stabilizer: [0, y.waist + 0.02 * H, -chestHZ * 1.9],
  };

  // The render rig's rest positions are the same skeleton seen from the
  // articulation side, so they come from the same landmarks — otherwise posing
  // would pivot a reconstruction around joints it does not have.
  const rests: Record<string, Vec3> = {
    root: [0, y.hip, 0],
    torso: [0, y.waist + 0.42 * (y.chestLow - y.waist), 0],
    neck: [0, y.neck - 0.03 * H, 0],
    shoulderR: [-shoulderX, y.shoulder, 0],
    elbowR: [-shoulderX, y.elbow, 0],
    wristR: [-shoulderX, y.wrist, 0],
    shoulderL: [shoulderX, y.shoulder, 0],
    elbowL: [shoulderX, y.elbow, 0],
    wristL: [shoulderX, y.wrist, 0],
    hipR: [-hipX, y.hip, 0],
    kneeR: [-hipX, y.knee, 0.02 * H],
    ankleR: [-hipX, y.ankle, 0],
    hipL: [hipX, y.hip, 0],
    kneeL: [hipX, y.knee, 0.02 * H],
    ankleL: [hipX, y.ankle, 0],
  };

  return { sockets, rests, y };
}
