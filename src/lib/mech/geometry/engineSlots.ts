/**
 * Bridge from the Mechanical Design Engine to the renderer's `Spec[]`.
 *
 * The shin is the Phase 1 pilot: Brief → Skeleton (ROM) → tiered form grammar
 * → functional check, adapted to `Spec[]` here. Other slots still run their
 * legacy generators until the engine covers them.
 */

import type { Spec } from "./types";
import { B } from "./primitives";
import { designSlotFromLegacyId } from "../engine";
import { primsToSpecs } from "../engine/adapters/toMechSpec";

const cache = new Map<string, Spec[]>();

export function engineShin(id: string): Spec[] {
  const key = (id || "SSA-001").toUpperCase();
  const hit = cache.get(key);
  if (hit) return hit;
  const art = designSlotFromLegacyId("shin", key);
  const specs = art && art.prims.length ? primsToSpecs(art.prims) : [B("prim", 0.12, 0.24, 0.1, 0, 0, 0)];
  cache.set(key, specs);
  return specs;
}
