/**
 * =========================================================================
 * MOSA Mechanical Design Engine — core types (framework-agnostic)
 * =========================================================================
 *
 * Nothing in `engine/` imports three.js, React, or any MOSA runtime module.
 * It is a pure, deterministic library: feed it a Brief, get back a KitArtifact
 * (geometry as plain data + a functional model + measured metrics). Any tool
 * — this studio, a CLI, another renderer — can consume it.
 *
 * The engine speaks in SEMANTIC roles ("armorA", "frame", "light"), not in a
 * host's material palette. Adapters map these to a concrete renderer.
 */

/** Band silhouette / edge grammar — the classification target, never an input. */
export type Band = "SS" | "SR" | "RS" | "RR";

/** A part slot the engine can design. Phase 1 pilots `shin`. */
export type SlotId =
  | "helm"
  | "collar"
  | "chest"
  | "cockpit"
  | "pec"
  | "abdomen"
  | "pelvis"
  | "skirtF"
  | "skirtS"
  | "shoulder"
  | "upperArm"
  | "elbow"
  | "forearm"
  | "vambrace"
  | "hand"
  | "hip"
  | "thigh"
  | "knee"
  | "shin"
  | "ankle"
  | "foot"
  | "backpack";

/** Semantic material role. An adapter maps each to a host material. */
export type MatRole =
  | "armorA" // primary armour — the big masses, Part 1
  | "armorB" // secondary armour — seated sub-plates, Part 2
  | "accent" // small decorative morphemes
  | "trim" // thin edge / rail / bezel
  | "frame" // structural frame, joints
  | "mechanism" // exposed dark hardware (pistons, chassis)
  | "metal" // bright polished metal
  | "light"; // luminescent

/** Primitive vocabulary. Kept close to what any renderer can build. */
export type PrimKind =
  | "box"
  | "cyl"
  | "sphere"
  | "cone"
  | "capsule"
  | "wedge" // triangular prism, apex +z
  | "trapPrism" // trapezoid extrusion (wTop, wBot, h) x depth
  | "hemi"
  | "octa"
  | "torus";

/** Which design tier a primitive belongs to — governs where detail may sit. */
export type Tier = "frame" | "mass" | "panel" | "detail";

/** The zone a surface belongs to — detail is only ever allowed in non-armour zones. */
export type Zone = "armor" | "joint" | "vent" | "frame";

export interface Prim {
  kind: PrimKind;
  role: MatRole;
  /** kind-specific: box/wedge=[w,h,d]; cyl/cone=[rTop,rBot,len]; sphere/hemi/octa=[r,,]; capsule=[r,len,]; trapPrism=[wTop,wBot,h]; torus=[r,tube,] */
  size: [number, number, number];
  pos: [number, number, number];
  rot?: [number, number, number];
  /** radial segments for cyl/cone/prism; ring segments for torus */
  sides?: number;
  /** trapPrism extrusion depth (its `size` carries wTop/wBot/h) */
  depth?: number;
  tier: Tier;
  zone: Zone;
  /** 0 sharp .. 1 fully rounded — advisory for the renderer's bevel */
  bevel?: number;
}

/** A hinge in the kinematic rig. Axis is a unit vector in the part's local frame. */
export interface Joint {
  id: string;
  /** local position of the pivot */
  pivot: [number, number, number];
  /** unit rotation axis */
  axis: [number, number, number];
  /** [min, max] in radians */
  range: [number, number];
  /** neutral pose angle */
  neutral: number;
}

/** A standard mount interface — where modules bolt on. */
export interface Hardpoint {
  id: string;
  pos: [number, number, number];
  /** outward normal */
  normal: [number, number, number];
  /** nominal bolt-circle / interface diameter */
  size: number;
  /** rated load (relative units) */
  rating: number;
}

/** The bounded, DISCRETE design intent. Diversity lives here, not in a hash. */
export interface Brief {
  /** stable id for determinism; not the kit ID */
  seed: string;
  /** one of the design philosophies */
  philosophy: string;
  /** S = straight silhouette, R = curved */
  silhouette: "S" | "R";
  /** S = sharp edges/accents, R = filleted/round */
  edge: "S" | "R";
  /** 0..1 — how much decoration to spend */
  decoration: number;
  /** size class — governs cross-kit mixing compatibility */
  sizeClass: "S" | "M" | "L";
  /** role bias — affects proportions & function */
  role: "skirmisher" | "line" | "artillery" | "bruiser" | "recon" | "support";
  /** 0..1 taper aggressiveness of limbs */
  taper: number;
  /** 0..1 how much inner frame is exposed (negative space) */
  frameExposure: number;
}

/** Proportions resolved from a brief — every part derives its sizes from this. */
export interface Proportions {
  /** overall height reference */
  unit: number;
  /** limb length ratios keyed by segment */
  segLength: Record<string, number>;
  /** limb girth ratios keyed by segment */
  segGirth: Record<string, number>;
  /** shared edge bevel 0..1 */
  bevel: number;
  /** detail size steps: [L, M, S] absolute sizes */
  detailSizes: [number, number, number];
}

export interface MetricVector {
  /** 0..1 — straight-silhouette-ness */
  silhouetteStraightness: number;
  /** 0..1 — sharp edge / accent-ness */
  edgeSharpness: number;
  /** 0..1 — decoration weight */
  decorationWeight: number;
  /** number of stacked armour tiers */
  layerDepth: number;
  /** 0..1 — bilateral symmetry error (0 = perfect) */
  symmetryError: number;
  /** bounding volume of the silhouette relative to primitive volume */
  compactness: number;
  /** fraction of `detail`-tier prims that sit in a non-armour zone (1 = all compliant) */
  detailZoneCompliance: number;
}

export interface FunctionalReport {
  /** ROM sweep found no self-collision */
  romOk: boolean;
  romCollisions: string[];
  /** relative supported moment at each joint */
  jointMoment: Record<string, number>;
  /** relative mass of this part */
  mass: number;
  /** local centre of mass */
  com: [number, number, number];
}

/** The full output for one designed slot. */
export interface SlotArtifact {
  slot: SlotId;
  prims: Prim[];
  joints: Joint[];
  hardpoints: Hardpoint[];
  functional: FunctionalReport;
}

/** The full output for one kit (Phase 1: only `shin` is populated). */
export interface KitArtifact {
  brief: Brief;
  slots: Partial<Record<SlotId, SlotArtifact>>;
  metrics: MetricVector;
  /** assigned only after population classification */
  id?: string;
  band?: Band;
}
