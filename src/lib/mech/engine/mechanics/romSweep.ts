/**
 * Range-of-motion sweep — the functional check that makes clearances real.
 *
 * For each joint the part spans, we sweep the *neighbouring* segment through
 * the joint's range and test it against this part's rigid armour. A design
 * whose greave fouls the foot at full dorsiflexion is rejected, not shipped.
 *
 * Collision is conservative AABB (rotation applied to the moving stand-in only).
 */

import type { Prim } from "../types";
import type { ShinRig } from "../skeleton";

type AABB = { min: [number, number, number]; max: [number, number, number] };

function primAABB(p: Prim): AABB {
  let hx: number;
  let hy: number;
  let hz: number;
  const [a, b, c] = p.size;
  switch (p.kind) {
    case "box":
    case "wedge":
      [hx, hy, hz] = [a / 2, b / 2, c / 2];
      break;
    case "trapPrism":
      [hx, hy, hz] = [Math.max(a, b) / 2, c / 2, (p.depth ?? 0.04) / 2];
      break;
    case "cyl":
    case "cone": {
      const r = Math.max(a, b);
      const rx = p.rot?.[0] ?? 0;
      const rz = p.rot?.[2] ?? 0;
      if (Math.abs(Math.abs(rz) - Math.PI / 2) < 0.4) [hx, hy, hz] = [c / 2, r, r];
      else if (Math.abs(Math.abs(rx) - Math.PI / 2) < 0.4) [hx, hy, hz] = [r, c / 2, r];
      else [hx, hy, hz] = [r, c / 2, r];
      break;
    }
    case "capsule":
      [hx, hy, hz] = [a, b / 2 + a, a];
      break;
    default: {
      const r = a || 0.05;
      [hx, hy, hz] = [r, r, r];
    }
  }
  return {
    min: [p.pos[0] - hx, p.pos[1] - hy, p.pos[2] - hz],
    max: [p.pos[0] + hx, p.pos[1] + hy, p.pos[2] + hz],
  };
}

function overlap(a: AABB, b: AABB, slack = 0): boolean {
  return (
    a.min[0] < b.max[0] - slack &&
    a.max[0] > b.min[0] + slack &&
    a.min[1] < b.max[1] - slack &&
    a.max[1] > b.min[1] + slack &&
    a.min[2] < b.max[2] - slack &&
    a.max[2] > b.min[2] + slack
  );
}

/** Rotate an AABB's 8 corners about a pivot on the X axis, return the enclosing AABB. */
function rotXAABB(box: AABB, pivot: [number, number, number], ang: number): AABB {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const xs = [box.min[0], box.max[0]];
  const ys = [box.min[1], box.max[1]];
  const zs = [box.min[2], box.max[2]];
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const x of xs)
    for (const y of ys)
      for (const z of zs) {
        const dy = y - pivot[1];
        const dz = z - pivot[2];
        const ny = pivot[1] + dy * c - dz * s;
        const nz = pivot[2] + dy * s + dz * c;
        min[0] = Math.min(min[0], x);
        max[0] = Math.max(max[0], x);
        min[1] = Math.min(min[1], ny);
        max[1] = Math.max(max[1], ny);
        min[2] = Math.min(min[2], nz);
        max[2] = Math.max(max[2], nz);
      }
  return { min, max };
}

export interface RomResult {
  ok: boolean;
  collisions: string[];
}

/**
 * Sweep the ankle (foot stand-in) and the knee (thigh stand-in) and test them
 * against this shin's rigid armour (mass + panel tiers, armour zone).
 */
export function romSweepShin(prims: Prim[], rig: ShinRig): RomResult {
  const collisions: string[] = [];
  const armour = prims
    .filter((p) => (p.tier === "mass" || p.tier === "panel") && p.zone === "armor")
    .map(primAABB);

  // ---- ankle : foot stand-in ----
  // The foot sits BELOW the ankle pivot and pitches about +X. In our sign
  // convention +pitch drives the toe DOWN (plantarflexion, away from the shin);
  // -pitch drives the toe UP (dorsiflexion) which is the tight case — the
  // foot's heel/top swings toward the shin's lower front rim.
  const ankleJ = rig.joints.find((j) => j.id === "ankle")!;
  const footW = rig.girth * 1.05;
  const footH = rig.girth * 0.42;
  const footD = rig.girth * 1.6;
  const foot0: AABB = {
    min: [-footW / 2, rig.ankleY - footH, -footD * 0.26],
    max: [footW / 2, rig.ankleY, footD * 0.76],
  };
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const dorsi = ankleJ.range[1] * (i / steps); // 0 .. maxDorsiflexion
    const swept = rotXAABB(foot0, ankleJ.pivot, -dorsi); // -pitch = toe up
    for (const arm of armour) {
      if (overlap(swept, arm, rig.girth * 0.02)) {
        collisions.push(`ankle dorsi ${dorsi.toFixed(2)}: foot fouls greave`);
        break;
      }
    }
  }

  // ---- knee : thigh stand-in (deep flexion brings calf toward thigh back) ----
  const kneeJ = rig.joints.find((j) => j.id === "knee")!;
  const thighW = rig.girth * 0.92;
  const thighH = rig.length * 0.8;
  // the thigh's own armour stops short of the knee — start the stand-in above it
  const thigh0: AABB = {
    min: [-thighW / 2, rig.kneeY + rig.girth * 0.45, -rig.girth * 0.5],
    max: [thighW / 2, rig.kneeY + thighH, rig.girth * 0.35],
  };
  // rotate the small, compact calf pod into the flexed frame (tight AABB),
  // test against the static thigh — far less conservative than rotating the
  // long thigh box.
  const calfBack = prims.filter((p) => p.zone === "vent" && p.tier === "mass").map(primAABB);
  for (let i = 0; i <= steps; i++) {
    const flex = kneeJ.range[1] * (i / steps);
    for (const cb of calfBack) {
      const rotated = rotXAABB(cb, kneeJ.pivot, flex);
      if (overlap(rotated, thigh0, rig.girth * 0.04)) {
        collisions.push(`knee flex ${flex.toFixed(2)}: calf pod fouls thigh`);
        break;
      }
    }
  }

  return { ok: collisions.length === 0, collisions };
}
