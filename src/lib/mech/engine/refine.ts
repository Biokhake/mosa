/**
 * Generate-and-select.
 *
 * A brief does not name one design — it names a small space of them. `refine`
 * builds several candidates (varying the detail salt), scores each with the
 * composition critic and the ROM sweep, and returns the best. Deterministic:
 * the candidate set is seed-derived and ties break toward the lower variant.
 */

import type { Brief, Prim } from "./types";
import { critique } from "./critic";
import type { Critique } from "./critic";

export interface Candidate {
  prims: Prim[];
  romOk: boolean;
  romCollisions: string[];
  critique: Critique;
  variant: number;
}

export interface RefineResult {
  best: Candidate;
  attempts: Candidate[];
}

export function refine(
  brief: Brief,
  build: (variant: number) => { prims: Prim[]; romOk: boolean; romCollisions: string[] },
  count = 5,
): RefineResult {
  const attempts: Candidate[] = [];
  for (let v = 0; v < count; v++) {
    const b = build(v);
    attempts.push({ ...b, critique: critique(b.prims, brief), variant: v });
  }
  const ranked = [...attempts].sort((a, z) => {
    if (a.romOk !== z.romOk) return a.romOk ? -1 : 1;
    const ds = z.critique.score - a.critique.score;
    if (Math.abs(ds) > 1e-4) return ds;
    return a.variant - z.variant;
  });
  return { best: ranked[0]!, attempts };
}
