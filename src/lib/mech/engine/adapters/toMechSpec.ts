/**
 * Adapter: engine `Prim[]` -> MOSA renderer `Spec[]`.
 *
 * This is the ONLY file in the engine tree that references host types. Any
 * other renderer writes its own adapter against `Prim` / `MatRole`.
 */

import type { Spec, SpecType } from "../../geometry/types";
import type { MatKey } from "../../palette";
import type { MatRole, Prim, PrimKind } from "../types";

const KIND: Record<PrimKind, SpecType> = {
  box: "box",
  cyl: "cyl",
  sphere: "sph",
  cone: "cone",
  capsule: "capsule",
  wedge: "wedge",
  trapPrism: "trap",
  hemi: "hemi",
  octa: "octa",
  torus: "torus",
};

const ROLE: Record<MatRole, MatKey> = {
  armorA: "prim",
  armorB: "sec",
  accent: "acc",
  trim: "trim",
  frame: "joint",
  mechanism: "dark",
  metal: "metal",
  light: "glow",
};

export function primToSpec(p: Prim): Spec {
  const t = KIND[p.kind];
  const m = ROLE[p.role];
  const r = p.rot && (p.rot[0] || p.rot[1] || p.rot[2]) ? ([...p.rot] as [number, number, number]) : undefined;

  let s: [number, number, number] = [...p.size];
  let n: number | undefined = p.sides;

  if (p.kind === "trapPrism") {
    // MOSA `trap`: s = [wTop, wBot, h], depth carried in `n`
    n = p.depth ?? 0.04;
  } else if (p.kind === "sphere") {
    s = [p.size[0], p.size[0], p.size[0]];
  } else if (p.kind === "capsule") {
    s = [p.size[0], p.size[1], 0];
  } else if (p.kind === "octa" || p.kind === "hemi") {
    s = [p.size[0], 0, 0];
  } else if (p.kind === "torus") {
    s = [p.size[0], p.size[1], 0];
  }

  return { t, m, s, p: [...p.pos] as [number, number, number], r, n };
}

export function primsToSpecs(prims: Prim[]): Spec[] {
  return prims.map(primToSpec);
}
