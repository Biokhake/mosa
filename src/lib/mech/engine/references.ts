/**
 * =========================================================================
 * REFERENCE ARCHETYPES — the manifold the engine is calibrated against
 * =========================================================================
 *
 * Until now the engine generated from rules I invented and scored itself with
 * thresholds I also invented. Nothing anchored what "good" meant, so selection
 * converged on a bland average and a hundred kits came out as one kit with a
 * hundred sets of numbers.
 *
 * This file is the ground truth. Each archetype is a real point in the mecha
 * design space, decomposed into the engine's own vocabulary: proportions the
 * skeleton can be built to, silhouette targets the critic can be measured
 * against, and a feature vocabulary that says which grammar branches are even
 * legal for that lineage. The corpus spans deliberately far apart — a
 * four-and-a-half-head weapons platform and a seven-and-a-half-head powered
 * suit cannot converge on the same average, which is the point.
 *
 * The archetypes describe DESIGN GRAMMAR, not designs. Proportion statistics,
 * mass distribution and structural vocabulary are the reusable engineering
 * content of the genre; they are what a designer learns by studying the field.
 *
 * ------------------------------------------------------------------------
 * EXCLUSIONS — non-negotiable, do not reintroduce
 * ------------------------------------------------------------------------
 * No trademarked identifying marks or silhouette signatures. Specifically
 * excluded, and deliberately absent from every enum below:
 *
 *   - the V-shaped blade antenna / forehead crest
 *   - any faction insignia or service mark
 *   - the V-shaped cockpit chest symbol
 *   - named model designations of any published series
 *
 * `HeadType` has no crest or antenna member at all, so a V-fin cannot be
 * selected even by accident. Archetype names describe the design language
 * ("sensor-rail", "line-unit"), never a manufacturer, faction, or model.
 * If a future archetype needs a head ornament, it gets a new generic member
 * (a fin bank, a comms mast) — never a two-pronged forehead blade.
 * ------------------------------------------------------------------------
 */

import type { Brief } from "./types";

/** Which design family an archetype belongs to — groups the studio's picker. */
export type Lineage = "line" | "assault" | "variable" | "platform" | "frame" | "civil";

/**
 * Head vocabulary. Note the absence of any crest/antenna member: see the
 * exclusion block above.
 */
export type HeadType =
  | "sensor-rail" // a single optic tracking across a slot in the face
  | "visor-band" // a horizontal band over twin optics
  | "twin-optic" // two discrete eyes in a machined face
  | "sealed-block" // no visible optics; a sensor plate
  | "dome" // rounded canopy-like head, civil machines
  | "stack"; // sensor cluster stacked above the shoulders, no neck

export type ShoulderType =
  | "pauldron" // a large plate hung outboard of the joint
  | "drum" // cylindrical, the joint itself is the shape
  | "binder" // a plate that hinges and carries hardpoints
  | "intake" // aircraft intake doubling as the shoulder mass
  | "asymmetric" // deliberately different left and right
  | "bare"; // frame only, armour minimal

export type SkirtType = "plates" | "wrap" | "none" | "deep";
export type BackType = "pack" | "wings" | "nacelles" | "rack" | "bare";
export type LegType = "biped" | "reverse" | "quad" | "tracked";

/** Where a lineage spends its detail budget. Three at most; the rest stays clean. */
export type Hotspot = "head" | "shoulder" | "chest" | "back" | "knee" | "waist" | "forearm";

export interface ReferenceArchetype {
  /** stable key; this is the KIT NAME until the catalogue reaches a hundred */
  key: string;
  name: string;
  lineage: Lineage;
  /** one line on what this lineage is for — shown in the picker */
  note: string;

  /** Proportion targets. These drive the skeleton; they are not decoration. */
  proportion: {
    /** body heights per head height */
    headCount: number;
    /** shoulder width / head width */
    shoulderSpan: number;
    /** waist width / shoulder width */
    waistRatio: number;
    /** torso depth / torso width */
    torsoFill: number;
    /** leg length / total height */
    legShare: number;
    thighToShin: number;
    upperToFore: number;
    /** foot length / head height */
    footLength: number;
  };

  /** Silhouette targets — these REPLACE the invented critic thresholds. */
  silhouette: {
    /** 0 fully rounded outline .. 1 fully faceted */
    angularity: number;
    /** overall height / overall width */
    verticality: number;
    /** visual weight split top / mid / bottom; sums to 1 */
    massBias: [number, number, number];
    /** share of the bounding box left empty — the read between the legs, under the arms */
    negativeSpace: number;
    /** 0 mirror-symmetric .. 1 deliberately one-sided */
    asymmetry: number;
  };

  /** Which grammar branches are legal for this lineage. */
  features: {
    head: HeadType;
    shoulder: ShoulderType;
    skirt: SkirtType;
    back: BackType;
    leg: LegType;
    /** 0 every joint covered .. 1 bare frame at every joint */
    jointExposure: number;
  };

  /** At most three. Everything not listed here stays deliberately plain. */
  hotspots: Hotspot[];
  /** 0..1 — how much of the budget exists at all */
  decoration: number;
  /** S sharp/chamfered, R filleted/rounded */
  edge: "S" | "R";
}

/**
 * The corpus. Sixteen points chosen to span the space rather than to cover a
 * single franchise: hero proportions through weapons platforms, walking tanks,
 * transformable aircraft, and near-human powered armour.
 */
export const REFERENCES: ReferenceArchetype[] = [
  {
    key: "HERO-FRAME",
    name: "Hero Frame",
    lineage: "line",
    note: "The archetypal protagonist proportion — balanced, readable, nothing exaggerated.",
    proportion: { headCount: 7, shoulderSpan: 3.2, waistRatio: 0.55, torsoFill: 0.62, legShare: 0.5, thighToShin: 0.95, upperToFore: 1, footLength: 1.1 },
    silhouette: { angularity: 0.62, verticality: 2.6, massBias: [0.3, 0.4, 0.3], negativeSpace: 0.34, asymmetry: 0.05 },
    features: { head: "twin-optic", shoulder: "pauldron", skirt: "plates", back: "pack", leg: "biped", jointExposure: 0.35 },
    hotspots: ["chest", "shoulder", "knee"],
    decoration: 0.5,
    edge: "S",
  },
  {
    key: "LINE-UNIT",
    name: "Line Unit",
    lineage: "line",
    note: "Mass production: the hero frame with every expensive feature deleted.",
    proportion: { headCount: 6.8, shoulderSpan: 3, waistRatio: 0.58, torsoFill: 0.6, legShare: 0.49, thighToShin: 0.95, upperToFore: 1, footLength: 1.05 },
    silhouette: { angularity: 0.6, verticality: 2.5, massBias: [0.28, 0.42, 0.3], negativeSpace: 0.3, asymmetry: 0.03 },
    features: { head: "visor-band", shoulder: "pauldron", skirt: "plates", back: "pack", leg: "biped", jointExposure: 0.28 },
    hotspots: ["chest"],
    decoration: 0.2,
    edge: "S",
  },
  {
    key: "SENSOR-RAIL",
    name: "Sensor Rail",
    lineage: "line",
    note: "A single optic tracking across a face slot; rounded shell, exposed conduit at the joints.",
    proportion: { headCount: 6.6, shoulderSpan: 3.6, waistRatio: 0.62, torsoFill: 0.72, legShare: 0.48, thighToShin: 1.02, upperToFore: 1.05, footLength: 1.15 },
    silhouette: { angularity: 0.24, verticality: 2.3, massBias: [0.38, 0.36, 0.26], negativeSpace: 0.26, asymmetry: 0.4 },
    features: { head: "sensor-rail", shoulder: "asymmetric", skirt: "wrap", back: "bare", leg: "biped", jointExposure: 0.62 },
    hotspots: ["shoulder", "waist"],
    decoration: 0.35,
    edge: "R",
  },
  {
    key: "HEAVY-CORPS",
    name: "Heavy Corps",
    lineage: "assault",
    note: "Angular, dense, deep skirt. Armour first; the frame is never seen.",
    proportion: { headCount: 6.4, shoulderSpan: 3.8, waistRatio: 0.5, torsoFill: 0.68, legShare: 0.46, thighToShin: 1, upperToFore: 1.08, footLength: 1.2 },
    silhouette: { angularity: 0.82, verticality: 2.4, massBias: [0.36, 0.38, 0.26], negativeSpace: 0.22, asymmetry: 0.05 },
    features: { head: "sealed-block", shoulder: "binder", skirt: "deep", back: "pack", leg: "biped", jointExposure: 0.12 },
    hotspots: ["shoulder", "chest", "back"],
    decoration: 0.7,
    edge: "S",
  },
  {
    key: "HIGH-MOBILITY",
    name: "High Mobility",
    lineage: "assault",
    note: "Slim waist, oversized shoulders carrying racks. Everything is thrust and hardpoint.",
    proportion: { headCount: 7.4, shoulderSpan: 4.2, waistRatio: 0.42, torsoFill: 0.56, legShare: 0.52, thighToShin: 0.88, upperToFore: 0.95, footLength: 1.1 },
    silhouette: { angularity: 0.7, verticality: 2.2, massBias: [0.44, 0.32, 0.24], negativeSpace: 0.42, asymmetry: 0.1 },
    features: { head: "twin-optic", shoulder: "binder", skirt: "plates", back: "rack", leg: "biped", jointExposure: 0.45 },
    hotspots: ["shoulder", "back"],
    decoration: 0.62,
    edge: "S",
  },
  {
    key: "STRIKE-FRAME",
    name: "Strike Frame",
    lineage: "assault",
    note: "Close-quarters: forward-biased mass, heavy forearms, minimal back.",
    proportion: { headCount: 6.9, shoulderSpan: 3.4, waistRatio: 0.52, torsoFill: 0.66, legShare: 0.48, thighToShin: 0.98, upperToFore: 0.86, footLength: 1.12 },
    silhouette: { angularity: 0.74, verticality: 2.45, massBias: [0.32, 0.42, 0.26], negativeSpace: 0.3, asymmetry: 0.18 },
    features: { head: "visor-band", shoulder: "pauldron", skirt: "plates", back: "bare", leg: "biped", jointExposure: 0.4 },
    hotspots: ["forearm", "shoulder", "chest"],
    decoration: 0.45,
    edge: "S",
  },
  {
    key: "VARIABLE-BATTROID",
    name: "Variable Battroid",
    lineage: "variable",
    note: "An aircraft standing up: nose folded onto the chest, wings and nacelles carried as back mass.",
    proportion: { headCount: 7.2, shoulderSpan: 3.4, waistRatio: 0.52, torsoFill: 0.78, legShare: 0.5, thighToShin: 0.92, upperToFore: 0.98, footLength: 1.35 },
    silhouette: { angularity: 0.68, verticality: 2.15, massBias: [0.42, 0.3, 0.28], negativeSpace: 0.38, asymmetry: 0.08 },
    features: { head: "twin-optic", shoulder: "intake", skirt: "none", back: "wings", leg: "biped", jointExposure: 0.3 },
    hotspots: ["back", "chest", "shoulder"],
    decoration: 0.48,
    edge: "S",
  },
  {
    key: "LIFT-BODY",
    name: "Lift Body",
    lineage: "variable",
    note: "Aerodynamic surfaces everywhere — the legs are nacelles and the arms fair into the body.",
    proportion: { headCount: 7.6, shoulderSpan: 3.1, waistRatio: 0.6, torsoFill: 0.84, legShare: 0.52, thighToShin: 0.86, upperToFore: 1.02, footLength: 1.4 },
    silhouette: { angularity: 0.4, verticality: 2.05, massBias: [0.4, 0.34, 0.26], negativeSpace: 0.3, asymmetry: 0.04 },
    features: { head: "sealed-block", shoulder: "intake", skirt: "none", back: "nacelles", leg: "biped", jointExposure: 0.16 },
    hotspots: ["back", "chest"],
    decoration: 0.36,
    edge: "R",
  },
  {
    key: "DESTROID",
    name: "Destroid",
    lineage: "platform",
    note: "A gun emplacement that walks. No neck, box torso, weapon pods where arms would be.",
    proportion: { headCount: 4.8, shoulderSpan: 4.6, waistRatio: 0.8, torsoFill: 0.9, legShare: 0.38, thighToShin: 1.1, upperToFore: 1.2, footLength: 1.6 },
    silhouette: { angularity: 0.9, verticality: 1.5, massBias: [0.3, 0.42, 0.28], negativeSpace: 0.18, asymmetry: 0.12 },
    features: { head: "stack", shoulder: "drum", skirt: "none", back: "bare", leg: "biped", jointExposure: 0.55 },
    hotspots: ["shoulder", "chest"],
    decoration: 0.22,
    edge: "S",
  },
  {
    key: "QUAD-PLATFORM",
    name: "Quad Platform",
    lineage: "platform",
    note: "Humanoid above the waist, a four-legged carriage below it.",
    proportion: { headCount: 4.5, shoulderSpan: 4.4, waistRatio: 0.9, torsoFill: 0.86, legShare: 0.3, thighToShin: 1.2, upperToFore: 1.1, footLength: 1.5 },
    silhouette: { angularity: 0.82, verticality: 1.2, massBias: [0.22, 0.28, 0.5], negativeSpace: 0.26, asymmetry: 0.06 },
    features: { head: "stack", shoulder: "drum", skirt: "none", back: "rack", leg: "quad", jointExposure: 0.6 },
    hotspots: ["back", "waist"],
    decoration: 0.3,
    edge: "S",
  },
  {
    key: "TRACKED-HYBRID",
    name: "Tracked Hybrid",
    lineage: "platform",
    note: "A tracked base under a working humanoid torso — reach without balance problems.",
    proportion: { headCount: 4.6, shoulderSpan: 4, waistRatio: 0.88, torsoFill: 0.82, legShare: 0.32, thighToShin: 1, upperToFore: 1.05, footLength: 1.8 },
    silhouette: { angularity: 0.86, verticality: 1.15, massBias: [0.24, 0.3, 0.46], negativeSpace: 0.2, asymmetry: 0.05 },
    features: { head: "dome", shoulder: "drum", skirt: "none", back: "rack", leg: "tracked", jointExposure: 0.5 },
    hotspots: ["waist", "shoulder"],
    decoration: 0.24,
    edge: "S",
  },
  {
    key: "LIGHT-BIPED",
    name: "Light Biped",
    lineage: "frame",
    note: "Thin limbs, oversized sensor head, weapons on the shoulders rather than in the hands.",
    proportion: { headCount: 7.8, shoulderSpan: 2.8, waistRatio: 0.5, torsoFill: 0.54, legShare: 0.54, thighToShin: 0.82, upperToFore: 0.92, footLength: 1.05 },
    silhouette: { angularity: 0.72, verticality: 3, massBias: [0.34, 0.3, 0.36], negativeSpace: 0.5, asymmetry: 0.22 },
    features: { head: "sealed-block", shoulder: "bare", skirt: "none", back: "rack", leg: "biped", jointExposure: 0.78 },
    hotspots: ["head", "shoulder"],
    decoration: 0.3,
    edge: "S",
  },
  {
    key: "REVERSE-JOINT",
    name: "Reverse Joint",
    lineage: "frame",
    note: "Digitigrade legs: the whole read moves to the lower body and the stance changes everything.",
    proportion: { headCount: 7.2, shoulderSpan: 3, waistRatio: 0.5, torsoFill: 0.58, legShare: 0.55, thighToShin: 0.75, upperToFore: 0.95, footLength: 1.45 },
    silhouette: { angularity: 0.66, verticality: 2.7, massBias: [0.3, 0.28, 0.42], negativeSpace: 0.48, asymmetry: 0.1 },
    features: { head: "sensor-rail", shoulder: "bare", skirt: "none", back: "rack", leg: "reverse", jointExposure: 0.72 },
    hotspots: ["knee", "head"],
    decoration: 0.34,
    edge: "S",
  },
  {
    key: "HEAVY-BIPED",
    name: "Heavy Biped",
    lineage: "frame",
    note: "Slab armour, almost no surface incident. Mass is the statement.",
    proportion: { headCount: 5.6, shoulderSpan: 4.4, waistRatio: 0.72, torsoFill: 0.8, legShare: 0.42, thighToShin: 1.08, upperToFore: 1.15, footLength: 1.35 },
    silhouette: { angularity: 0.88, verticality: 1.7, massBias: [0.3, 0.34, 0.36], negativeSpace: 0.16, asymmetry: 0.08 },
    features: { head: "sealed-block", shoulder: "pauldron", skirt: "deep", back: "pack", leg: "biped", jointExposure: 0.1 },
    hotspots: ["shoulder"],
    decoration: 0.16,
    edge: "S",
  },
  {
    key: "COMBAT-ARMOR",
    name: "Combat Armor",
    lineage: "civil",
    note: "Utilitarian military hardware: drum joints, exposed actuators, no styling budget at all.",
    proportion: { headCount: 6, shoulderSpan: 3, waistRatio: 0.68, torsoFill: 0.72, legShare: 0.46, thighToShin: 1, upperToFore: 1.02, footLength: 1.25 },
    silhouette: { angularity: 0.76, verticality: 2, massBias: [0.28, 0.4, 0.32], negativeSpace: 0.28, asymmetry: 0.06 },
    features: { head: "sensor-rail", shoulder: "drum", skirt: "none", back: "pack", leg: "biped", jointExposure: 0.7 },
    hotspots: ["chest"],
    decoration: 0.14,
    edge: "S",
  },
  {
    key: "CIVIL-FRAME",
    name: "Civil Frame",
    lineage: "civil",
    note: "A working machine for public use — rounded, legible, a prominent chest hatch, nothing threatening.",
    proportion: { headCount: 7, shoulderSpan: 2.9, waistRatio: 0.66, torsoFill: 0.66, legShare: 0.5, thighToShin: 0.96, upperToFore: 1, footLength: 1.15 },
    silhouette: { angularity: 0.3, verticality: 2.5, massBias: [0.26, 0.44, 0.3], negativeSpace: 0.28, asymmetry: 0.03 },
    features: { head: "dome", shoulder: "drum", skirt: "wrap", back: "bare", leg: "biped", jointExposure: 0.3 },
    hotspots: ["chest"],
    decoration: 0.26,
    edge: "R",
  },
];

export const REFERENCE_BY_KEY: Record<string, ReferenceArchetype> = Object.fromEntries(
  REFERENCES.map((r) => [r.key, r]),
);

export const LINEAGES: Array<{ id: Lineage; label: string }> = [
  { id: "line", label: "Line" },
  { id: "assault", label: "Assault" },
  { id: "variable", label: "Variable" },
  { id: "platform", label: "Platform" },
  { id: "frame", label: "Frame" },
  { id: "civil", label: "Civil" },
];

/**
 * A brief derived from an archetype.
 *
 * Note which way this runs: the brief used to be the INPUT a kit was invented
 * from, with its silhouette/edge bands picked to fill a hundred-slot grid. Now
 * it is a VIEW of a reference point, so every scalar in it traces back to a
 * measured target rather than to a quota.
 */
export function briefFromReference(ref: ReferenceArchetype): Brief {
  const p = ref.proportion;
  const s = ref.silhouette;
  return {
    seed: ref.key,
    philosophy: ref.lineage,
    silhouette: s.angularity >= 0.5 ? "S" : "R",
    edge: ref.edge,
    decoration: ref.decoration,
    sizeClass: p.headCount >= 7.2 ? "S" : p.headCount >= 6.2 ? "M" : "L",
    role: roleForLineage(ref),
    // a long thigh relative to the shin reads as a tapered leg
    taper: clamp01((p.thighToShin - 0.75) / 0.5),
    frameExposure: ref.features.jointExposure,
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function roleForLineage(ref: ReferenceArchetype): Brief["role"] {
  if (ref.features.leg === "quad" || ref.features.leg === "tracked") return "artillery";
  if (ref.lineage === "platform") return "artillery";
  if (ref.lineage === "civil") return "support";
  if (ref.lineage === "frame") return ref.proportion.headCount >= 7 ? "recon" : "bruiser";
  if (ref.lineage === "assault") return ref.proportion.shoulderSpan >= 4 ? "skirmisher" : "line";
  if (ref.lineage === "variable") return "skirmisher";
  return "line";
}

/**
 * Identification numbers are assigned only once the catalogue reaches a
 * hundred entries — the ID is meant to be a measured OUTPUT ranking a kit
 * among its band-mates, and ranking sixteen kits into a hundred-slot grammar
 * would be inventing the ranks. Until then a kit is called by its reference.
 */
export const ID_ASSIGNMENT_THRESHOLD = 100;

export function idsAreAssigned(): boolean {
  return REFERENCES.length >= ID_ASSIGNMENT_THRESHOLD;
}
