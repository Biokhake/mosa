/**
 * Generate-and-select, then REPAIR.
 *
 * A brief does not name one design — it names a small space of them. `refine`
 * builds several candidates (varying the detail salt), scores each with the
 * composition critic and the ROM sweep, then hands the critic's diagnosis to
 * the repair operators and keeps the repair only if it actually scored better.
 * Deterministic: the candidate set is seed-derived and ties break toward the
 * lower variant.
 */

import type { Brief, Prim } from "./types";
import { critique } from "./critic";
import type { Critique } from "./critic";
import { repair } from "./repair";

export interface Candidate {
  prims: Prim[];
  romOk: boolean;
  romCollisions: string[];
  critique: Critique;
  variant: number;
  /** what the repair pass changed, if anything */
  repairs: string[];
}

export interface RefineResult {
  best: Candidate;
  attempts: Candidate[];
}

/** How many repair rounds to attempt on the winner. */
const REPAIR_ROUNDS = 2;

export function refine(
  brief: Brief,
  build: (variant: number) => { prims: Prim[]; romOk: boolean; romCollisions: string[] },
  count = 5,
  /** re-check ROM after a repair, since removing geometry can change clearance */
  recheck?: (prims: Prim[]) => { romOk: boolean; romCollisions: string[] },
): RefineResult {
  const attempts: Candidate[] = [];
  for (let v = 0; v < count; v++) {
    const b = build(v);
    attempts.push({ ...b, critique: critique(b.prims, brief), variant: v, repairs: [] });
  }
  const ranked = [...attempts].sort((a, z) => {
    if (a.romOk !== z.romOk) return a.romOk ? -1 : 1;
    const ds = z.critique.score - a.critique.score;
    if (Math.abs(ds) > 1e-4) return ds;
    return a.variant - z.variant;
  });

  // ---- repair the winner ---------------------------------------------------
  let best = ranked[0]!;
  for (let round = 0; round < REPAIR_ROUNDS; round++) {
    const { prims, applied } = repair(best.prims, best.critique.penalties, brief);
    if (!applied.length || prims === best.prims) break;
    const crit = critique(prims, brief);
    const rom = recheck ? recheck(prims) : { romOk: best.romOk, romCollisions: best.romCollisions };
    // only accept a repair that does not trade a functional failure for a
    // cosmetic gain, and that genuinely improved the score
    const betterFunction = rom.romOk || !best.romOk;
    if (!betterFunction || crit.score <= best.critique.score + 1e-4) break;
    best = {
      prims,
      romOk: rom.romOk,
      romCollisions: rom.romCollisions,
      critique: crit,
      variant: best.variant,
      repairs: [...best.repairs, ...applied],
    };
  }

  return { best, attempts };
}
