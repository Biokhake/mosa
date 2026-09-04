/**
 * The active frame for a kit: sockets and rig rests derived from its reference
 * measurements, with the catalogue's fixed table as the fallback for kits that
 * have no measurements yet.
 *
 * This is the seam that lets two kits of genuinely different proportion live in
 * one studio. Nothing downstream needs to know whether a coordinate came from
 * a measurement or from the old table.
 */

import { SLOT_BY_ID } from "../catalog";
import { RIG_NODE_BY_ID } from "../rig";
import { deriveFrame } from "./sockets";
import type { DerivedFrame, Vec3 } from "./sockets";
import { refMeasureFor } from "./data";

const cache = new Map<string, DerivedFrame | null>();

function frameFor(variant: string): DerivedFrame | null {
  const key = (variant || "").trim().toUpperCase();
  if (cache.has(key)) return cache.get(key)!;
  const m = refMeasureFor(key);
  const f = m ? deriveFrame(m) : null;
  cache.set(key, f);
  return f;
}

/** Where a slot sits for this kit. Falls back to the catalogue socket. */
export function socketFor(slotId: string, variant: string): Vec3 {
  const f = frameFor(variant);
  const s = f?.sockets[slotId];
  if (s) return s;
  return (SLOT_BY_ID[slotId]?.socket ?? [0, 0, 0]) as Vec3;
}

/** Where a rig node rests for this kit. Falls back to the fixed rig. */
export function restFor(nodeId: string, variant: string): Vec3 {
  const f = frameFor(variant);
  const r = f?.rests[nodeId];
  if (r) return r;
  return (RIG_NODE_BY_ID[nodeId as keyof typeof RIG_NODE_BY_ID]?.rest ?? [0, 0, 0]) as Vec3;
}

/** True when this kit has measurements and is therefore self-proportioned. */
export function hasFrame(variant: string): boolean {
  return frameFor(variant) != null;
}
