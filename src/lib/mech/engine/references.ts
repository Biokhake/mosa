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
 * SCOPE
 * ------------------------------------------------------------------------
 * The catalogue is currently a single entry: a hand-authored reconstruction
 * used as a shape-restoration exercise (geometry/rx78.ts). It is a study
 * asset, NOT FOR DISTRIBUTION, and it exists to find out what the generative
 * vocabulary cannot yet say.
 *
 * Anything that ships is a different question. A published catalogue carries
 * no trademarked identifying marks — no faction insignia, no service marks,
 * no published model designations — and archetype names describe a design
 * language rather than a manufacturer or a faction.
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
 * The catalogue. One entry while the reconstruction is being worked out — the
 * sixteen statistical archetypes that used to sit here were withdrawn because
 * statistics ABOUT designs turned out to be a continuation of the same
 * generated look, not a break from it.
 */
export const REFERENCES: ReferenceArchetype[] = [
  {
    key: "RX-78",
    name: "RX-78",
    lineage: "line",
    note: "Reference reconstruction. Authored by hand slot by slot; see geometry/rx78.ts.",
    proportion: { headCount: 7.2, shoulderSpan: 3.3, waistRatio: 0.56, torsoFill: 0.6, legShare: 0.5, thighToShin: 0.9, upperToFore: 0.95, footLength: 1.25 },
    silhouette: { angularity: 0.7, verticality: 2.6, massBias: [0.32, 0.38, 0.3], negativeSpace: 0.34, asymmetry: 0.02 },
    features: { head: "twin-optic", shoulder: "pauldron", skirt: "plates", back: "pack", leg: "biped", jointExposure: 0.3 },
    hotspots: ["head", "shoulder", "chest"],
    decoration: 0.45,
    edge: "S",
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
