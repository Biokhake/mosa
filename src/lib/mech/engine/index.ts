/**
 * =========================================================================
 * MOSA Mechanical Design Engine — public API
 * =========================================================================
 *
 * Framework-agnostic. `import { designSlot, designKit } from ".../engine"`
 * from the studio, a CLI, or any other tool. Output is plain data
 * (`SlotArtifact` / `KitArtifact`); use an adapter to render it.
 *
 * PIPELINE (per slot):
 *   Brief → Proportions → Skeleton (joints + ROM + hardpoints)
 *        → pick limb topology (critic-scored)
 *        → Form grammar (tiered: frame · mass · panel · detail)
 *        → generate-and-select (refine): N candidates, ROM + critic, keep best
 *        → Functional check + Metrics measurement
 *
 * Classification into the ID grammar is done at POPULATION level
 * (`classify.ts`), because a kit's letter is its decoration RANK among its
 * band-mates — it can only be known once the whole set exists.
 */

import { makeBrief, briefFromLegacyId } from "./brief";
import { resolveProportions } from "./proportions";
import { buildRig, shinView, thighView } from "./skeleton";
import type { ShinRig } from "./skeleton";
import { grammarShin, shinInterfaces } from "./grammar/shin";
import { grammarThigh, thighInterfaces } from "./grammar/thigh";
import { validateAssembly } from "./assembly";
import { topologyPool, topologyAffinity } from "./grammar/topology";
import type { LimbTopology } from "./grammar/topology";
import { romSweepShin, romSweepThigh } from "./mechanics/romSweep";
import { massReportShin, massReportLimb } from "./mechanics/mass";
import { measureMetrics, classifyBand } from "./classify";
import { critique } from "./critic";
import { refine } from "./refine";
import { generatePopulation } from "./population";
import type { Population } from "./population";
import type { Brief, KitArtifact, Proportions, SlotArtifact, SlotId, Rig } from "./types";

export * from "./types";
export { makeBrief, briefFromLegacyId, PHILOSOPHIES } from "./brief";
export { measureMetrics, classifyBand, classifyBand as _classifyBand, assignId, bandLetters } from "./classify";
export { PHILOSOPHIES as DESIGN_PHILOSOPHIES } from "./brief";
export { critique } from "./critic";
export type { Critique } from "./critic";
export { generatePopulation } from "./population";
export type { Population, PopulationEntry } from "./population";
export { validateAssembly } from "./assembly";
export type { AssemblyReport } from "./assembly";
export { mountGeometry, mountAll, mountKindForDof } from "./grammar/mount";

/** How many candidates the generate-and-select loop builds per slot. */
const REFINE_COUNT = 5;

/**
 * The leg's armour topology. Both shin and thigh call this with the SAME
 * inputs so they always agree — the leg reads as one design. "Best" = highest
 * critic score on a probe shin, ROM failure lightly penalised.
 */
function chooseLegTopology(brief: Brief, prop: Proportions, shin: ShinRig): LimbTopology {
  const pool = topologyPool(brief);
  if (pool.length < 2) return pool[0] ?? "shell";
  let best = pool[0]!;
  let bestScore = -Infinity;
  for (const t of pool) {
    const prims = grammarShin(brief, prop, shin, { topology: t });
    const rom = romSweepShin(prims, shin);
    // critic quality + how much the philosophy wants this arrangement, so the
    // critic's slight bias toward the simplest shell can't flatten every kit.
    const score = critique(prims, brief).score - (rom.ok ? 0 : 0.2) + topologyAffinity(brief, t) * 0.18;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

function shinArtifact(brief: Brief, prop: Proportions, view: ShinRig): SlotArtifact {
  const topology = chooseLegTopology(brief, prop, view);
  const { best, attempts } = refine(
    brief,
    (variant) => {
      const prims = grammarShin(brief, prop, view, { topology, variant });
      const rom = romSweepShin(prims, view);
      return { prims, romOk: rom.ok, romCollisions: rom.collisions };
    },
    REFINE_COUNT,
  );
  const mass = massReportShin(best.prims, view);
  return {
    slot: "shin",
    prims: best.prims,
    joints: view.joints,
    hardpoints: view.hardpoints,
    interfaces: shinInterfaces(view),
    functional: {
      romOk: best.romOk,
      romCollisions: best.romCollisions,
      jointMoment: mass.jointMoment,
      mass: mass.mass,
      com: mass.com,
      load: {
        jointTorque: view.load.jointTorque,
        actuator: view.load.actuator,
        rails: view.load.rails,
        armourAllowance: view.load.armourAllowance,
        carriedMass: view.load.carriedMass,
      },
    },
    aesthetic: {
      score: best.critique.score,
      penalties: best.critique.penalties,
      notes: best.critique.notes,
      variant: best.variant,
      topology,
      attempts: attempts.length,
    },
  };
}

function thighArtifact(brief: Brief, prop: Proportions, rig: Rig): SlotArtifact {
  const view = thighView(rig, "R");
  const topology = chooseLegTopology(brief, prop, shinView(rig, "R"));
  const { best, attempts } = refine(
    brief,
    (variant) => {
      const prims = grammarThigh(brief, prop, view, { topology, variant });
      const rom = romSweepThigh(prims, view);
      return { prims, romOk: rom.ok, romCollisions: rom.collisions };
    },
    REFINE_COUNT,
  );
  const mass = massReportLimb(best.prims, view.joints);
  return {
    slot: "thigh",
    prims: best.prims,
    joints: view.joints,
    hardpoints: view.hardpoints,
    interfaces: thighInterfaces(view),
    functional: {
      romOk: best.romOk,
      romCollisions: best.romCollisions,
      jointMoment: mass.jointMoment,
      mass: mass.mass,
      com: mass.com,
      load: {
        jointTorque: view.load.jointTorque,
        actuator: view.load.actuator,
        rails: view.load.rails,
        armourAllowance: view.load.armourAllowance,
        carriedMass: view.load.carriedMass,
      },
    },
    aesthetic: {
      score: best.critique.score,
      penalties: best.critique.penalties,
      notes: best.critique.notes,
      variant: best.variant,
      topology,
      attempts: attempts.length,
    },
  };
}

/** Design a single slot from a brief, given an already-built whole-body rig. */
export function designSlotWithRig(slot: SlotId, brief: Brief, rig: Rig): SlotArtifact | null {
  const prop = resolveProportions(brief);
  if (slot === "shin") return shinArtifact(brief, prop, shinView(rig, "R"));
  if (slot === "thigh") return thighArtifact(brief, prop, rig);
  return null; // other slots still use the legacy generators for now
}

/** Design a single slot from a brief. Builds a fresh whole-body rig. */
export function designSlot(slot: SlotId, brief: Brief): SlotArtifact | null {
  const rig = buildRig(brief, resolveProportions(brief));
  return designSlotWithRig(slot, brief, rig);
}

/** Build the whole-body rig for a brief (exposed for tools / inspection). */
export function designRig(brief: Brief): Rig {
  return buildRig(brief, resolveProportions(brief));
}

/**
 * A lighter kit measurement for population generation — builds shin + thigh
 * once and returns just the aggregate metrics + band (no per-slot artifacts,
 * no rig echo).
 */
function measureKit(brief: Brief): { brief: Brief; metrics: ReturnType<typeof measureMetrics>; band: ReturnType<typeof classifyBand> } {
  const prop = resolveProportions(brief);
  const rig = buildRig(brief, prop);
  const prims = [
    ...shinArtifact(brief, prop, shinView(rig, "R")).prims,
    ...thighArtifact(brief, prop, rig).prims,
  ];
  const metrics = measureMetrics(prims);
  return { brief, metrics, band: classifyBand(metrics) };
}

let _population: Population | null = null;

/**
 * The 100-kit population. Built once (deterministic), then reused. IDs are
 * assigned here as an OUTPUT of measurement — see `population.ts`.
 */
export function getPopulation(): Population {
  if (!_population) _population = generatePopulation(measureKit);
  return _population;
}

/** Design a whole kit from a brief (Phase 3b: `shin` + `thigh` populated). */
export function designKit(brief: Brief): KitArtifact {
  const rig = buildRig(brief, resolveProportions(brief));
  const slots: KitArtifact["slots"] = {};
  const shin = designSlotWithRig("shin", brief, rig);
  if (shin) slots.shin = shin;
  const thigh = designSlotWithRig("thigh", brief, rig);
  if (thigh) slots.thigh = thigh;

  const allPrims = Object.values(slots).flatMap((s) => s!.prims);
  const interfaces = Object.entries(slots).flatMap(([slot, s]) =>
    (s!.interfaces ?? []).map((i) => ({ ...i, id: `${slot}:${i.id}` })),
  );
  const metrics = measureMetrics(allPrims);
  return { brief, slots, interfaces, metrics, band: classifyBand(metrics) };
}

/**
 * Check that every designed part is actually connected — no floating parts.
 * Returns which parent interfaces met a mating child interface and which did
 * not. Callable from any tool with a `KitArtifact`.
 */
export function checkKitAssembly(brief: Brief) {
  const rig = buildRig(brief, resolveProportions(brief));
  return validateAssembly(designKit(brief), rig);
}

/**
 * Resolve a catalog ID to its brief. The ID now names a POPULATION member
 * (its brief was chosen and measured, then handed this ID); the legacy decoder
 * is only a fallback for IDs outside the generated set.
 */
export function briefForId(id: string): Brief {
  const entry = getPopulation().byId[(id || "").trim().toUpperCase()];
  return entry ? entry.brief : briefFromLegacyId(id);
}

/** Convenience for the studio's path: design a slot from a catalog ID. */
export function designSlotFromLegacyId(slot: SlotId, id: string): SlotArtifact | null {
  return designSlot(slot, briefForId(id));
}
