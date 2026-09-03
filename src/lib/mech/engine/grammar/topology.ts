/**
 * Limb-armour TOPOLOGY.
 *
 * The point of Phase 3b: two kits should differ in *how the armour is
 * arranged* — how many masses, how they connect, where the seams are — not
 * just in a stretch factor on one fixed shell. A "clamshell" shin and a
 * "spine" shin read as different designs at silhouette distance.
 *
 * Topology is chosen from the brief's philosophy (weighted), so it is a
 * discrete structural decision, deterministic per kit.
 */

import type { Brief } from "../types";
import type { Rng } from "../rng";

export type LimbTopology =
  | "shell" // one tapered primary shell; minimal (aero / organic)
  | "tiered" // primary shell + 1–2 smaller plates stacked forward (siege / baroque)
  | "split" // primary shell + standoff L/R side wing plates (knight / line)
  | "clamshell" // front + rear half-shells with a visible longitudinal seam (brick)
  | "spine" // slim shell + a bold central longitudinal keel ridge (predator)
  | "segmented"; // the shell is 2–3 stacked bands along the length, gapped (recon)

const PHIL_TOPOLOGY: Record<string, LimbTopology[]> = {
  "tactical-brick": ["clamshell", "clamshell", "shell", "segmented"],
  "faceted-knight": ["split", "tiered", "spine"],
  "filleted-utility": ["shell", "segmented", "split"],
  "aero-runner": ["shell", "shell", "spine", "segmented"],
  "organic-curve": ["shell", "shell", "shell", "tiered"],
  "siege-fortress": ["tiered", "tiered", "split"],
  "ornate-baroque": ["tiered", "split", "spine"],
  "predator-organic": ["spine", "spine", "split", "clamshell"],
};

/** The distinct topologies open to this brief — the critic picks among these. */
export function topologyPool(brief: Brief): LimbTopology[] {
  const base = PHIL_TOPOLOGY[brief.philosophy] ?? ["shell", "tiered", "split"];
  const withExposure: LimbTopology[] =
    brief.frameExposure > 0.5 ? [...base, "clamshell", "segmented"] : base;
  return [...new Set(withExposure)];
}

/**
 * How strongly the philosophy wants this topology (0..1 by frequency in its
 * weighted list). Used to stop the critic's mild bias toward the simplest
 * arrangement from flattening every philosophy to shell/split.
 */
export function topologyAffinity(brief: Brief, t: LimbTopology): number {
  const list = PHIL_TOPOLOGY[brief.philosophy] ?? ["shell", "tiered", "split"];
  return list.filter((x) => x === t).length / list.length;
}

/** Pick this kit's limb-armour topology from its philosophy (fallback path). */
export function pickLimbTopology(brief: Brief, rng: Rng): LimbTopology {
  const pool = PHIL_TOPOLOGY[brief.philosophy] ?? ["shell", "tiered", "split"];
  // frame-exposed designs lean toward clamshell / segmented (you can see inside)
  if (brief.frameExposure > 0.5 && rng.chance(0.4)) {
    return rng.pick(["clamshell", "segmented"] as const);
  }
  return rng.pick(pool);
}

/** How many armour masses a topology yields (for the metric `layerDepth`). */
export function topologyMassCount(t: LimbTopology): number {
  switch (t) {
    case "shell":
      return 1;
    case "spine":
      return 2;
    case "clamshell":
      return 2;
    case "split":
      return 3;
    case "segmented":
      return 3;
    case "tiered":
      return 3;
  }
}
