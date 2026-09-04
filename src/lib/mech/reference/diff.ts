/**
 * =========================================================================
 * SILHOUETTE DIFF — the (A) half of the reconstruction loop
 * =========================================================================
 *
 * The reason the reconstruction kept missing is not perception and not the
 * primitive vocabulary. It is that authoring a part means writing numeric
 * literals with no way to see the result: restart a server, load a page,
 * screenshot, squint at a figure two hundred pixels tall. One correction every
 * couple of minutes, at a fidelity where a twenty percent proportion error is
 * invisible. A modeller with a reference on the backdrop makes that correction
 * ten times a minute.
 *
 * So this measures the built kit the same way the reference was measured, and
 * reports the difference field by field. "Does this look like the reference"
 * stops being my squint and becomes a number — the same fix the critic needed
 * when its thresholds turned out to be invented.
 *
 * It runs headless off the Spec data, so a pass costs milliseconds and the
 * loop can be run dozens of times per edit.
 */

import type { Spec } from "../geometry/types";
import type { RefMeasure } from "./types";
import { DEFAULT_DEPTHS } from "./types";

export type Vec3 = [number, number, number];

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

const EMPTY: Box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };

function merge(a: Box, b: Box): Box {
  return {
    x0: Math.min(a.x0, b.x0),
    x1: Math.max(a.x1, b.x1),
    y0: Math.min(a.y0, b.y0),
    y1: Math.max(a.y1, b.y1),
    z0: Math.min(a.z0, b.z0),
    z1: Math.max(a.z1, b.z1),
  };
}

/**
 * A primitive's extent. Rotations are ignored beyond taking the largest of the
 * affected axes — this is a silhouette measurement, not a collision test, and
 * a landmark moves by far less than the error we are hunting.
 */
function specBox(sp: Spec, origin: Vec3, mirror: boolean): Box {
  const [a, b, c] = sp.s.map(Math.abs) as [number, number, number];
  let w = a;
  let h = b;
  let d = c;
  switch (sp.t) {
    case "cyl":
    case "cone": {
      const r = Math.max(a, b);
      const rz = Math.abs(sp.r?.[2] ?? 0);
      const rx = Math.abs(sp.r?.[0] ?? 0);
      if (Math.abs(rz - Math.PI / 2) < 0.5) [w, h, d] = [c, 2 * r, 2 * r];
      else if (Math.abs(rx - Math.PI / 2) < 0.5) [w, h, d] = [2 * r, c, 2 * r];
      else [w, h, d] = [2 * r, c, 2 * r];
      break;
    }
    case "sph":
    case "hemi":
    case "octa":
      [w, h, d] = [2 * a, 2 * a, 2 * a];
      break;
    case "capsule":
      [w, h, d] = [2 * a, b + 2 * a, 2 * a];
      break;
    case "torus":
      [w, h, d] = [2 * (a + b), 2 * (a + b), 2 * b];
      break;
    case "trap":
      [w, h, d] = [Math.max(a, b), c, sp.n ?? 0.04];
      break;
    default:
      break;
  }
  const px = (mirror ? -sp.p[0] : sp.p[0]) + origin[0];
  const py = sp.p[1] + origin[1];
  const pz = sp.p[2] + origin[2];
  return { x0: px - w / 2, x1: px + w / 2, y0: py - h / 2, y1: py + h / 2, z0: pz - d / 2, z1: pz + d / 2 };
}

export interface SlotGeometry {
  id: string;
  specs: Spec[];
  socket: Vec3;
  /** true when buildPart mirrors this slot's geometry across X */
  mirror: boolean;
}

function boxOf(slots: SlotGeometry[]): Box {
  let b = EMPTY;
  for (const s of slots) for (const sp of s.specs) b = merge(b, specBox(sp, s.socket, s.mirror));
  return b;
}

function pick(all: SlotGeometry[], ids: string[]): SlotGeometry[] {
  return all.filter((s) => ids.includes(s.id) && s.specs.length > 0);
}

/** Widest row of the assembly inside a y band, sampled off the spec boxes. */
function widthIn(slots: SlotGeometry[], y0: number, y1: number): number {
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of slots) {
    for (const sp of s.specs) {
      const b = specBox(sp, s.socket, s.mirror);
      if (b.y1 < y0 || b.y0 > y1) continue;
      lo = Math.min(lo, b.x0);
      hi = Math.max(hi, b.x1);
    }
  }
  return Number.isFinite(lo) ? hi - lo : 0;
}

const HEAD = ["helm", "visor", "brow", "eyeR", "eyeL", "nose", "mouth", "jaw", "earR", "earL", "cheekR", "cheekL", "chin"];
// The collar spans the NECK. Including it made chestHigh report the top of
// the neck column instead of the top of the chest mass.
const CHEST = ["chestCore", "chestR", "chestL", "pecR", "pecL", "cockpit"];

/**
 * Measure a built kit the same way a reference thumbnail is measured, so the
 * two records can be compared field by field.
 */
export function measureBuild(all: SlotGeometry[], key: string): RefMeasure {
  const live = all.filter((s) => s.specs.length > 0);
  const whole = boxOf(live);
  const head = boxOf(pick(live, HEAD));
  const chest = boxOf(pick(live, CHEST));
  // A paired limb is measured on ONE side. Boxing both together measures the
  // separation between the limbs, not the width of one — which read as a 130%
  // error on every arm until it was caught.
  const foot = boxOf(pick(live, ["footR"]));
  const shin = boxOf(pick(live, ["shinR"]));
  const thigh = boxOf(pick(live, ["thighR"]));
  const hip = boxOf(pick(live, ["hipR"]));
  const upper = boxOf(pick(live, ["upperR"]));
  const fore = boxOf(pick(live, ["forearmR"]));
  const shoulder = boxOf(pick(live, ["shoulderR", "shoulderL"]));
  const shoulderOne = boxOf(pick(live, ["shoulderR"]));
  const sockOf = (id: string) => live.find((s) => s.id === id)?.socket;
  const skirt = boxOf(pick(live, ["skirtF", "skirtB", "skirtR", "skirtL"]));
  const abdomen = boxOf(pick(live, ["abdomen"]));

  const groundY = foot.y0 === Infinity ? whole.y0 : foot.y0;
  // crown excludes the crest, which is why the head slots are measured apart
  const crownY = head.y1 === -Infinity ? whole.y1 : head.y1;
  const H = crownY - groundY || 1;
  const f = (v: number) => (v - groundY) / H;
  const wf = (v: number) => v / H;

  const waistY = abdomen.y0 === Infinity ? (hip.y1 + chest.y0) / 2 : abdomen.y0;

  return {
    key,
    source: "measured from the built kit",
    height: H,
    groundY,
    y: {
      sole: 0,
      ankle: f(shin.y0),
      kneeLow: f(shin.y1 - (shin.y1 - shin.y0) * 0.22),
      knee: f(shin.y1),
      crotch: f(skirt.y0 === Infinity ? thigh.y1 : skirt.y0),
      hip: f(hip.y0 === Infinity ? thigh.y1 : (hip.y0 + hip.y1) / 2),
      waist: f(waistY),
      chestLow: f(chest.y0),
      chestHigh: f(chest.y1),
      shoulder: f(shoulderOne.y0 === Infinity ? chest.y1 : (shoulderOne.y0 + shoulderOne.y1) / 2),
      // the BASE of the neck, which is where the reference measures it —
      // the collar's top is the chin, since the column has to reach it
      neck: f(boxOf(pick(live, ["collar"])).y0 || chest.y1),
      chin: f(head.y0),
      crown: 1,
      crest: f(whole.y1),
      elbow: f(fore.y1 === -Infinity ? chest.y0 : fore.y1),
      wrist: f(fore.y0 === Infinity ? chest.y0 : fore.y0),
    },
    w: {
      head: wf(head.x1 - head.x0),
      shoulderSpan: wf(shoulder.x1 - shoulder.x0),
      shoulderPivot: wf(Math.abs(sockOf("shoulderR")?.[0] ?? 0) * 2),
      chest: wf(chest.x1 - chest.x0),
      waist: wf(widthIn(pick(live, ["abdomen"]), waistY, waistY + H * 0.02)),
      hip: wf(skirt.x1 - skirt.x0),
      hipPivot: wf(Math.abs(sockOf("hipR")?.[0] ?? 0) * 2),
      thigh: wf(thigh.x1 - thigh.x0),
      shin: wf(shin.x1 - shin.x0),
      foot: wf(foot.x1 - foot.x0),
      upperArm: wf(upper.x1 - upper.x0),
      forearm: wf(fore.x1 - fore.x0),
    },
    d: {
      head: wf(head.z1 - head.z0),
      chest: wf(chest.z1 - chest.z0),
      waist: DEFAULT_DEPTHS.waist,
      thigh: wf(thigh.z1 - thigh.z0),
      shin: wf(shin.z1 - shin.z0),
      foot: wf(foot.z1 - foot.z0),
      upperArm: wf(upper.z1 - upper.z0),
      forearm: wf(fore.z1 - fore.z0),
    },
  };
}

export interface FieldError {
  field: string;
  built: number;
  ref: number;
  /** signed relative error; positive means the build is larger / higher */
  err: number;
}

export interface DiffReport {
  /** 0..1, 1 is a perfect match on the compared fields */
  score: number;
  fields: FieldError[];
  worst: FieldError[];
  notes: string[];
}

/**
 * Ratios matter more than absolutes: a figure can be the right shape at any
 * size, and it is the RELATIONSHIPS a viewer reads. Everything compared here
 * is already normalised to height, so a plain relative difference is the
 * honest measure.
 */
const Y_FIELDS: Array<keyof RefMeasure["y"]> = [
  "ankle", "knee", "crotch", "hip", "waist", "chestLow", "chestHigh", "shoulder", "neck", "chin", "elbow", "wrist",
];
const W_FIELDS: Array<keyof RefMeasure["w"]> = [
  "head", "shoulderSpan", "chest", "waist", "hip", "thigh", "shin", "foot", "upperArm", "forearm",
];

export function diffMeasure(built: RefMeasure, ref: RefMeasure): DiffReport {
  const fields: FieldError[] = [];
  const push = (field: string, b: number, r: number) => {
    if (!Number.isFinite(b) || !Number.isFinite(r) || r === 0) return;
    fields.push({ field, built: b, ref: r, err: (b - r) / Math.abs(r) });
  };
  for (const k of Y_FIELDS) push(`y.${k}`, built.y[k], ref.y[k]);
  for (const k of W_FIELDS) push(`w.${k}`, built.w[k], ref.w[k]);
  // the ratio a viewer reads first
  push("headCount", 1 / (1 - built.y.chin), 1 / (1 - ref.y.chin));
  push("shoulderPerHead", built.w.shoulderSpan / built.w.head, ref.w.shoulderSpan / ref.w.head);
  push("waistPerShoulder", built.w.waist / built.w.shoulderSpan, ref.w.waist / ref.w.shoulderSpan);
  push("legShare", built.y.hip, ref.y.hip);

  const worst = [...fields].sort((a, b) => Math.abs(b.err) - Math.abs(a.err)).slice(0, 8);
  const mean = fields.reduce((s, f) => s + Math.min(1, Math.abs(f.err)), 0) / Math.max(1, fields.length);
  const notes = worst
    .filter((f) => Math.abs(f.err) > 0.08)
    .map((f) => `${f.field}: built ${f.built.toFixed(3)} vs ref ${f.ref.toFixed(3)} (${f.err > 0 ? "+" : ""}${(f.err * 100).toFixed(0)}%)`);
  return { score: Math.max(0, 1 - mean), fields, worst, notes };
}
