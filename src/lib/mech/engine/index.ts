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
 *        → Form grammar (tiered: frame · mass · panel · detail)
 *        → Functional check (ROM sweep + mass/moment)
 *        → Metrics measurement
 *
 * Classification into the ID grammar is done at POPULATION level
 * (`classify.ts`), because a kit's letter is its decoration RANK among its
 * band-mates — it can only be known once the whole set exists.
 */

import { makeBrief, briefFromLegacyId } from "./brief";
import { resolveProportions } from "./proportions";
import { buildRig, shinView, thighView } from "./skeleton";
import { grammarShin } from "./grammar/shin";
import { grammarThigh } from "./grammar/thigh";
import { romSweepShin, romSweepThigh } from "./mechanics/romSweep";
import { massReportShin, massReportLimb } from "./mechanics/mass";
import { measureMetrics, classifyBand } from "./classify";
import type { Brief, KitArtifact, SlotArtifact, SlotId, Rig } from "./types";

export * from "./types";
export { makeBrief, briefFromLegacyId, PHILOSOPHIES } from "./brief";
export { measureMetrics, classifyBand, classifyBand as _classifyBand, assignId, bandLetters } from "./classify";
export { PHILOSOPHIES as DESIGN_PHILOSOPHIES } from "./brief";

/** Design a single slot from a brief, given an already-built whole-body rig. */
export function designSlotWithRig(slot: SlotId, brief: Brief, rig: Rig): SlotArtifact | null {
  const prop = resolveProportions(brief);

  if (slot === "shin") {
    const view = shinView(rig, "R");
    const prims = grammarShin(brief, prop, view);
    const rom = romSweepShin(prims, view);
    const mass = massReportShin(prims, view);
    return {
      slot,
      prims,
      joints: view.joints,
      hardpoints: view.hardpoints,
      functional: {
        romOk: rom.ok,
        romCollisions: rom.collisions,
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
    };
  }

  if (slot === "thigh") {
    const view = thighView(rig, "R");
    const prims = grammarThigh(brief, prop, view);
    const rom = romSweepThigh(prims, view);
    const mass = massReportLimb(prims, view.joints);
    return {
      slot,
      prims,
      joints: view.joints,
      hardpoints: view.hardpoints,
      functional: {
        romOk: rom.ok,
        romCollisions: rom.collisions,
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
    };
  }

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

/** Design a whole kit from a brief (Phase 3a: `shin` populated, rig for all). */
export function designKit(brief: Brief): KitArtifact {
  const rig = buildRig(brief, resolveProportions(brief));
  const slots: KitArtifact["slots"] = {};
  const shin = designSlotWithRig("shin", brief, rig);
  if (shin) slots.shin = shin;
  const thigh = designSlotWithRig("thigh", brief, rig);
  if (thigh) slots.thigh = thigh;

  const allPrims = Object.values(slots).flatMap((s) => s!.prims);
  const metrics = measureMetrics(allPrims);
  return { brief, slots, metrics, band: classifyBand(metrics) };
}

/** Convenience for the studio's transitional path: design from an existing ID. */
export function designSlotFromLegacyId(slot: SlotId, id: string): SlotArtifact | null {
  return designSlot(slot, briefFromLegacyId(id));
}
