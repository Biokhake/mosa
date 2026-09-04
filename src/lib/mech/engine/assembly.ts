/**
 * Assembly validation (Phase 6).
 *
 * Every engine part declares its interfaces (PartInterface). This walks the
 * assembled kit and checks that each part's PARENT interface actually mates
 * with a CHILD interface from the part above it — same place, compatible
 * connector, adequate load rating. An unmet parent interface is a part that
 * would float; the report names it.
 *
 * Plain data in, plain data out — callable from any tool.
 */

import type { KitArtifact, MountKind, PartInterface, Rig, SlotId } from "./types";

/** Body-space origin of an engine slot's local frame (bone midpoint). */
export function partOrigin(slot: SlotId, rig: Rig, side: "R" | "L" = "R"): [number, number, number] | null {
  const bone = rig.bones[`${slot}${side}`];
  const rest = rig.restPos[`${slot}${side}`];
  if (!bone || !rest) return null;
  return [rest[0], rest[1] - bone.length / 2, rest[2]];
}

const COMPATIBLE: Record<MountKind, MountKind[]> = {
  "bolt-flange": ["bolt-flange", "ball", "collar-clamp"],
  ball: ["ball", "bolt-flange", "collar-clamp"],
  hinge: ["hinge", "collar-clamp"],
  rail: ["rail", "collar-clamp"],
  "collar-clamp": ["bolt-flange", "ball", "hinge", "rail", "collar-clamp"],
};

function mate(a: MountKind, b: MountKind): boolean {
  return COMPATIBLE[a].includes(b);
}

export interface MatedJoint {
  parent: string;
  child: string;
  gap: number;
}

export interface AssemblyReport {
  ok: boolean;
  /** parent-interface ↔ child-interface pairs that met */
  mated: MatedJoint[];
  /** parent interfaces whose expected parent slot IS designed but did not mate */
  floating: string[];
  /** parent interfaces whose parent slot is out of the engine's scope (e.g. pelvis) */
  boundary: string[];
  /** interfaces whose neighbour cannot carry the rated load */
  underRated: { interface: string; need: number; have: number }[];
}

interface Placed {
  slot: SlotId;
  iface: PartInterface;
  world: [number, number, number];
}

/**
 * Validate an assembled kit against its rig. Only the slots the engine
 * currently designs (shin, thigh) carry interfaces; others are skipped.
 */
export function validateAssembly(kit: KitArtifact, rig: Rig): AssemblyReport {
  const placed: Placed[] = [];
  for (const [slot, art] of Object.entries(kit.slots)) {
    if (!art?.interfaces?.length) continue;
    const origin = partOrigin(slot as SlotId, rig);
    if (!origin) continue;
    for (const iface of art.interfaces) {
      placed.push({
        slot: slot as SlotId,
        iface,
        world: [origin[0] + iface.pos[0], origin[1] + iface.pos[1], origin[2] + iface.pos[2]],
      });
    }
  }

  const parents = placed.filter((p) => p.iface.role === "parent");
  const children = placed.filter((p) => p.iface.role === "child");
  const designed = new Set(Object.keys(kit.slots));
  const mated: MatedJoint[] = [];
  const floating: string[] = [];
  const boundary: string[] = [];
  const underRated: AssemblyReport["underRated"] = [];

  for (const p of parents) {
    const tol = Math.max(0.04, p.iface.size * 0.9);
    let best: { c: Placed; gap: number } | null = null;
    for (const c of children) {
      if (c.slot === p.slot) continue;
      if (!mate(p.iface.kind, c.iface.kind)) continue;
      const gap = Math.hypot(
        p.world[0] - c.world[0],
        p.world[1] - c.world[1],
        p.world[2] - c.world[2],
      );
      if (gap <= tol && (!best || gap < best.gap)) best = { c, gap };
    }
    if (!best) {
      // out of scope if the expected parent slot isn't something the engine designs
      if (p.iface.parentSlot && !designed.has(p.iface.parentSlot)) boundary.push(p.iface.id);
      else floating.push(p.iface.id);
      continue;
    }
    mated.push({ parent: p.iface.id, child: best.c.iface.id, gap: best.gap });
    if (best.c.iface.rating + 1e-6 < p.iface.rating) {
      underRated.push({ interface: p.iface.id, need: p.iface.rating, have: best.c.iface.rating });
    }
  }

  return { ok: floating.length === 0, mated, floating, boundary, underRated };
}
