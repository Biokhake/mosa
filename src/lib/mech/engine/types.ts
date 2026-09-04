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

/**
 * Semantic material role. An adapter maps each to a host material.
 *
 * `light` (luminescence) is DELIBERATELY constrained: it may only be emitted
 * for head optics (eyes / visor), weapon beams + weapon-mounted scopes, or a
 * clearly-housed reactor / core gem. Never for verniers, thruster exhausts,
 * telemetry strips, or sensor dots scattered on armour — a frame standing in a
 * hangar is not firing anything.
 */
export type MatRole =
  | "armorA" // primary armour — the big masses, Part 1
  | "armorB" // secondary armour — seated sub-plates, Part 2
  | "accent" // small decorative morphemes
  | "trim" // thin edge / rail / bezel
  | "frame" // structural frame, joints
  | "mechanism" // exposed dark hardware (pistons, chassis)
  | "metal" // bright polished metal
  | "light"; // luminescent — head optics / weapon beams / housed core ONLY

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
  /**
   * Prims that together form ONE logical mass (e.g. the stacked segments of a
   * curved shell profile). The critic treats a group as a single mass so a
   * continuous profile is not mistaken for a stack of layered plates.
   */
  group?: string;
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

/** How two parts physically join at an interface. */
export type MountKind = "bolt-flange" | "ball" | "hinge" | "rail" | "collar-clamp";

/**
 * A part's connection contract. Every engine part declares the interfaces it
 * presents — one facing its parent up the kinematic chain, one facing each
 * child, plus any accessory hardpoints — and emits the physical connector
 * geometry for each, so a part is never left floating regardless of how the
 * proportions came out. All coordinates are in the PART's own local frame.
 */
export interface PartInterface {
  id: string;
  /** which way the interface faces along the kinematic chain */
  role: "parent" | "child" | "accessory";
  /** for a `parent` interface: the slot expected to sit above it */
  parentSlot?: SlotId;
  pos: [number, number, number];
  /** mating direction (unit) — the neighbour approaches along -normal */
  normal: [number, number, number];
  /** articulation axis (unit); zero vector if the joint is rigid */
  axis: [number, number, number];
  kind: MountKind;
  /** interface / bolt-circle diameter */
  size: number;
  /** relative load rating this interface must carry */
  rating: number;
}

/** One bone in the whole-body kinematic tree. */
export interface Bone {
  id: string;
  parent: string | null;
  /** origin (this bone's proximal joint) in the PARENT bone's local frame */
  origin: [number, number, number];
  /** segment length along its primary axis */
  length: number;
  /** nominal girth */
  girth: number;
  /** primary axis direction in this bone's local frame (usually -Y) */
  axis: [number, number, number];
  /** true for the mirror (left) copy of a paired limb */
  mirrored: boolean;
}

/** A joint in the whole-body tree — connects `parentBone` to `bone`. */
export interface RigJoint extends Joint {
  bone: string;
  parentBone: string;
  dof: "hinge" | "universal" | "ball";
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

/** How a joint is driven, sized from the load it must resist. */
export interface ActuatorSpec {
  drive: "rotary" | "linear" | "twin-linear";
  /** required torque (relative units) after dynamic + safety factors */
  torque: number;
  /** rotary: drum radius / width */
  drumRadius: number;
  drumWidth: number;
  /** linear: bore radius, stroke length, moment arm at neutral */
  bore: number;
  stroke: number;
  arm: number;
}

/** A structural member (frame rail / beam), sized from the load it carries. */
export interface MemberSpec {
  /** beam radius / half-section */
  section: number;
  /** how many parallel members */
  count: number;
  /** add a diagonal cross-brace under heavy load */
  braced: boolean;
}

/** The structural picture for one part — drives the frame + shell dimensions. */
export interface LoadReport {
  /** per-joint required torque (relative) */
  jointTorque: Record<string, number>;
  /** per-joint actuator spec */
  actuator: Record<string, ActuatorSpec>;
  /** the part's own structural rails */
  rails: MemberSpec;
  /** armour mass allowance for this part (relative) — governs shell bulk */
  armourAllowance: number;
  /** total moved mass this part's proximal joint carries */
  carriedMass: number;
}

/** The whole-body structural solution — every joint, every bone. */
export interface BodyLoad {
  /** relative total body weight */
  bodyWeight: number;
  /** per-bone relative mass (structure + armour shell) */
  boneMass: Record<string, number>;
  /** per-joint required torque (relative, after dynamic + safety) */
  jointTorque: Record<string, number>;
  /** per-joint actuator, sized from its torque */
  actuator: Record<string, ActuatorSpec>;
  /** per-bone structural member spec (rails / beams) */
  member: Record<string, MemberSpec>;
  /** per-bone armour bulk allowance (governs shell girth/depth) */
  armour: Record<string, number>;
}

/** The whole-body kinematic + structural rig. */
export interface Rig {
  brief: Brief;
  bones: Record<string, Bone>;
  joints: Record<string, RigJoint>;
  hardpoints: Hardpoint[];
  /** rest position of each bone's origin in body space */
  restPos: Record<string, [number, number, number]>;
  load: BodyLoad;
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
  /** the structural / load solution the part was sized from */
  load: LoadReport;
}

/** What the composition critic found, and which candidate it picked. */
export interface AestheticReport {
  /** 0..1 — 1 is a clean composition, penalties subtract */
  score: number;
  penalties: Record<string, number>;
  notes: string[];
  /** the generate-and-select candidate that won (0 = primary build) */
  variant: number;
  /** the limb-armour topology this design resolved to */
  topology: string;
  /** how many candidates were built and scored */
  attempts: number;
  /** what the repair pass fixed on the winning candidate */
  repairs?: string[];
}

/** The full output for one designed slot. */
export interface SlotArtifact {
  slot: SlotId;
  prims: Prim[];
  joints: Joint[];
  hardpoints: Hardpoint[];
  /** this part's connection contract (Phase 6) */
  interfaces: PartInterface[];
  functional: FunctionalReport;
  aesthetic?: AestheticReport;
}

/** The full output for one kit (Phase 3b: `shin` + `thigh` populated). */
export interface KitArtifact {
  brief: Brief;
  slots: Partial<Record<SlotId, SlotArtifact>>;
  /** every designed part's interfaces, prefixed by slot */
  interfaces: PartInterface[];
  metrics: MetricVector;
  /** whole-assembly composition critique (see kitCritic.ts) */
  aesthetic?: {
    score: number;
    penalties: Record<string, number>;
    notes: string[];
    accentShare: number;
  };
  /** 0..1 proportion-target agreement */
  proportion?: number;
  /** assigned only after population classification */
  id?: string;
  band?: Band;
}
