/**
 * Design briefs — the discrete, bounded design intent that drives generation.
 *
 * Diversity is expressed here (divergent philosophies + role + parameters),
 * NOT by spreading a hash across a fixed topology. Two briefs that differ in
 * philosophy or role produce structurally different designs, not stretched
 * copies of one.
 */

import { makeRng, clamp } from "./rng";
import type { Brief } from "./types";

interface Philosophy {
  name: string;
  /** silhouette lean: -1 fully straight .. +1 fully curved */
  silhouette: number;
  /** edge lean: -1 razor sharp .. +1 soft round */
  edge: number;
  /** baseline decoration 0..1 */
  decoration: number;
  /** how exposed the inner frame is 0..1 */
  frameExposure: number;
  /** limb taper 0..1 */
  taper: number;
  roles: Brief["role"][];
}

/**
 * Eight design philosophies. Think of them as different design houses — each
 * has a coherent thesis about form. Not "5 archetypes with a size knob".
 */
export const PHILOSOPHIES: Philosophy[] = [
  {
    name: "tactical-brick", // utilitarian, boxy, minimal decoration, exposed frame
    silhouette: -0.9,
    edge: -0.8,
    decoration: 0.18,
    frameExposure: 0.55,
    taper: 0.2,
    roles: ["line", "bruiser"],
  },
  {
    name: "faceted-knight", // angular hero silhouette, chamfered, mid decoration
    silhouette: -0.5,
    edge: -0.5,
    decoration: 0.5,
    frameExposure: 0.25,
    taper: 0.4,
    roles: ["line", "skirmisher"],
  },
  {
    name: "filleted-utility", // straight masses, softened corners, low-mid decoration
    silhouette: -0.4,
    edge: 0.6,
    decoration: 0.32,
    frameExposure: 0.35,
    taper: 0.3,
    roles: ["support", "line"],
  },
  {
    name: "aero-runner", // swept curved silhouette, sharp trailing accents, slim
    silhouette: 0.5,
    edge: -0.4,
    decoration: 0.4,
    frameExposure: 0.3,
    taper: 0.7,
    roles: ["skirmisher", "recon"],
  },
  {
    name: "organic-curve", // fully curved, smooth, capsule/dome, minimal hard detail
    silhouette: 0.9,
    edge: 0.8,
    decoration: 0.28,
    frameExposure: 0.2,
    taper: 0.5,
    roles: ["recon", "skirmisher"],
  },
  {
    name: "siege-fortress", // heavy straight masses, layered plate, dense decoration
    silhouette: -0.7,
    edge: -0.3,
    decoration: 0.8,
    frameExposure: 0.15,
    taper: 0.1,
    roles: ["bruiser", "artillery"],
  },
  {
    name: "ornate-baroque", // curved silhouette, ornate layered, filleted
    silhouette: 0.6,
    edge: 0.4,
    decoration: 0.85,
    frameExposure: 0.1,
    taper: 0.35,
    roles: ["line", "support"],
  },
  {
    name: "predator-organic", // curved silhouette, sharp spikes/blades, sinister
    silhouette: 0.7,
    edge: -0.7,
    decoration: 0.6,
    frameExposure: 0.4,
    taper: 0.6,
    roles: ["skirmisher", "bruiser"],
  },
];

/** Build a brief from a philosophy + a seed, with bounded jitter. */
export function makeBrief(seed: string): Brief {
  const rng = makeRng(`brief:${seed}`);
  const phil = PHILOSOPHIES[rng.int(PHILOSOPHIES.length)]!;
  const jitter = (base: number, amt: number) => clamp(base + rng.range(-amt, amt), 0, 1);

  const silhouetteScalar = phil.silhouette + rng.range(-0.25, 0.25);
  const edgeScalar = phil.edge + rng.range(-0.25, 0.25);

  return {
    seed,
    philosophy: phil.name,
    silhouette: silhouetteScalar < 0 ? "S" : "R",
    edge: edgeScalar < 0 ? "S" : "R",
    decoration: jitter(phil.decoration, 0.15),
    sizeClass: rng.pick(["S", "M", "M", "L"] as const),
    role: rng.pick(phil.roles),
    taper: jitter(phil.taper, 0.15),
    frameExposure: jitter(phil.frameExposure, 0.12),
  };
}

/**
 * TEMPORARY bridge: decode an existing catalog ID (SSA-001 …) into a brief so
 * the studio keeps working while the engine is stood up part by part. Phase 5
 * replaces this — IDs become an OUTPUT of population classification, not an
 * input.
 */
export function briefFromLegacyId(id: string): Brief {
  const clean = (id || "SSA-001").trim().toUpperCase();
  const major = clean[0] === "R" ? "R" : "S";
  const form = clean[1] === "R" ? "R" : "S";
  const letter = clean.charCodeAt(2) - 65; // 0..25
  const serialM = clean.match(/\d+/);
  const serial = serialM ? parseInt(serialM[0], 10) : 1;
  const rng = makeRng(`legacy:${clean}`);

  // pick a philosophy whose lean matches the band
  const wantSil = major === "S" ? -1 : 1;
  const wantEdge = form === "S" ? -1 : 1;
  const scored = PHILOSOPHIES.map((p) => ({
    p,
    d: Math.abs(Math.sign(p.silhouette) - wantSil) + Math.abs(Math.sign(p.edge) - wantEdge),
  })).sort((a, b) => a.d - b.d);
  const phil = scored[rng.int(Math.min(3, scored.length))]!.p;

  const decoration = clamp((Math.max(0, letter) + rng.range(-1, 1)) / 24, 0.05, 0.95);

  return {
    seed: clean,
    philosophy: phil.name,
    silhouette: major,
    edge: form,
    decoration,
    sizeClass: rng.pick(["S", "M", "M", "L"] as const),
    role: rng.pick(phil.roles),
    taper: clamp(phil.taper + rng.range(-0.12, 0.12), 0, 1),
    frameExposure: clamp(phil.frameExposure + rng.range(-0.1, 0.1), 0, 1),
    // serial only nudges the seed; no structural meaning in the bridge
    ...(serial ? {} : {}),
  };
}
