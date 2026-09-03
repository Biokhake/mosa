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
import { buildShinRig } from "./skeleton";
import { grammarShin } from "./grammar/shin";
import { romSweepShin } from "./mechanics/romSweep";
import { massReportShin } from "./mechanics/mass";
import { solveShinLoad } from "./mechanics/loadSolver";
import { measureMetrics, classifyBand } from "./classify";
import type { Brief, KitArtifact, SlotArtifact, SlotId } from "./types";

export * from "./types";
export { makeBrief, briefFromLegacyId, PHILOSOPHIES } from "./brief";
export { measureMetrics, classifyBand, classifyBand as _classifyBand, assignId, bandLetters } from "./classify";
export { PHILOSOPHIES as DESIGN_PHILOSOPHIES } from "./brief";

/** Design a single slot from a brief. Phase 1 implements `shin`. */
export function designSlot(slot: SlotId, brief: Brief): SlotArtifact | null {
  const prop = resolveProportions(brief);

  if (slot === "shin") {
    const load = solveShinLoad(brief, prop);
    const rig = buildShinRig(brief, prop, load);
    const prims = grammarShin(brief, prop, rig);
    const rom = romSweepShin(prims, rig);
    const mass = massReportShin(prims, rig);
    return {
      slot,
      prims,
      joints: rig.joints,
      hardpoints: rig.hardpoints,
      functional: {
        romOk: rom.ok,
        romCollisions: rom.collisions,
        jointMoment: mass.jointMoment,
        mass: mass.mass,
        com: mass.com,
        load,
      },
    };
  }

  return null; // other slots still use the legacy generators for now
}

/** Design a whole kit from a brief (Phase 1: only `shin` is populated). */
export function designKit(brief: Brief): KitArtifact {
  const slots: KitArtifact["slots"] = {};
  const shin = designSlot("shin", brief);
  if (shin) slots.shin = shin;

  const allPrims = Object.values(slots).flatMap((s) => s!.prims);
  const metrics = measureMetrics(allPrims);
  return { brief, slots, metrics, band: classifyBand(metrics) };
}

/** Convenience for the studio's transitional path: design from an existing ID. */
export function designSlotFromLegacyId(slot: SlotId, id: string): SlotArtifact | null {
  return designSlot(slot, briefFromLegacyId(id));
}
