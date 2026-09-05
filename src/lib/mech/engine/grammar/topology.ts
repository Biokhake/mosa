/**
 * Limb-armour TOPOLOGY — rhythmic multi-mass first.
 *
 * Kits must differ in HOW masses interlock (heterogeneous solids), not in
 * stretch factors on one sausage shell. "shell" remains for aero briefs but
 * is no longer the default win condition in the critic.
 */

import type { Brief } from "../types";
import type { Rng } from "../rng";

export type LimbTopology =
  | "shell" // one tapered primary — allowed but critic-penalised if alone + trim-heavy
  | "tiered" // primary + forward plates (size cascade)
  | "split" // primary + L/R wing plates
  | "clamshell" // front + rear half-shells, longitudinal seam
  | "spine" // slim shell + bold keel of DIFFERENT prim kind
  | "segmented" // 2–3 length bands with gaps
  | "wedge-stack" // wedge + box + cyl stacked along limb (rhythm)
  | "block-cut" // box primary with wedge cut-ins / chamfer masses
  | "tube-plate"; // cyl core + flat plate flanges (hetero mix)

const PHIL_TOPOLOGY: Record<string, LimbTopology[]> = {
  "tactical-brick": ["block-cut", "clamshell", "segmented", "wedge-stack"],
  "faceted-knight": ["wedge-stack", "split", "tiered", "block-cut"],
  "filleted-utility": ["tube-plate", "segmented", "split", "shell"],
  "aero-runner": ["tube-plate", "spine", "shell", "segmented"],
  "organic-curve": ["tube-plate", "spine", "shell", "tiered"],
  "siege-fortress": ["tiered", "block-cut", "split", "wedge-stack"],
  "ornate-baroque": ["tiered", "split", "spine", "wedge-stack"],
  "predator-organic": ["spine", "wedge-stack", "split", "clamshell"],
};

/** Distinct topologies open to this brief. */
export function topologyPool(brief: Brief): LimbTopology[] {
  const base = PHIL_TOPOLOGY[brief.philosophy] ?? [
    "wedge-stack",
    "block-cut",
    "tube-plate",
    "tiered",
    "split",
  ];
  const withExposure: LimbTopology[] =
    brief.frameExposure > 0.5 ? [...base, "clamshell", "segmented"] : base;
  // Always offer at least one hetero multi-mass option
  return [...new Set([...withExposure, "wedge-stack", "block-cut"])];
}

export function topologyAffinity(brief: Brief, t: LimbTopology): number {
  const list = PHIL_TOPOLOGY[brief.philosophy] ?? [
    "wedge-stack",
    "block-cut",
    "tube-plate",
  ];
  return list.filter((x) => x === t).length / list.length;
}

export function pickLimbTopology(brief: Brief, rng: Rng): LimbTopology {
  const pool = topologyPool(brief);
  if (brief.frameExposure > 0.5 && rng.chance(0.35)) {
    return rng.pick(["clamshell", "segmented", "tube-plate"] as const);
  }
  return rng.pick(pool);
}

/** How many armour masses a topology yields (metric `layerDepth`). */
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
    case "wedge-stack":
      return 3;
    case "block-cut":
      return 3;
    case "tube-plate":
      return 3;
  }
}

/** True when topology is built from interlocking heterogeneous solids. */
export function topologyIsHetero(t: LimbTopology): boolean {
  return (
    t === "wedge-stack" ||
    t === "block-cut" ||
    t === "tube-plate" ||
    t === "spine" ||
    t === "segmented" ||
    t === "tiered" ||
    t === "split" ||
    t === "clamshell"
  );
}
