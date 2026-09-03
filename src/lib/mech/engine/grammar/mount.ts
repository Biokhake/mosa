/**
 * MODULAR HARDPOINT SYSTEM (Phase 6).
 *
 * Every engine part declares the interfaces it presents (see PartInterface)
 * and emits a physical connector for each one here. Two consequences:
 *   - a part is never left visually floating — there is always hardware where
 *     it meets its neighbour, regardless of how the proportions resolved;
 *   - the interface list is a plain-data contract other tools can read to
 *     check what bolts to what.
 */

import type { Brief, Prim, PartInterface, MountKind } from "../types";

const HALF_PI = Math.PI / 2;

/** Which connector a joint should use, from the rig joint's degrees of freedom. */
export function mountKindForDof(dof: "hinge" | "universal" | "ball" | "rigid"): MountKind {
  if (dof === "ball") return "ball";
  if (dof === "hinge" || dof === "universal") return "hinge";
  return "bolt-flange";
}

/** Two unit vectors spanning the plane perpendicular to `n`. */
function faceBasis(n: [number, number, number]): [[number, number, number], [number, number, number]] {
  const up: [number, number, number] = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const u: [number, number, number] = [
    n[1] * up[2] - n[2] * up[1],
    n[2] * up[0] - n[0] * up[2],
    n[0] * up[1] - n[1] * up[0],
  ];
  const ul = Math.hypot(u[0], u[1], u[2]) || 1;
  const uu: [number, number, number] = [u[0] / ul, u[1] / ul, u[2] / ul];
  const v: [number, number, number] = [
    n[1] * uu[2] - n[2] * uu[1],
    n[2] * uu[0] - n[0] * uu[2],
    n[0] * uu[1] - n[1] * uu[0],
  ];
  return [uu, v];
}

/** Rotation that points a Y-up primitive along the axis `n`. */
function rotToAxis(n: [number, number, number]): [number, number, number] {
  if (Math.abs(n[1]) > 0.5) return [0, 0, 0];
  if (Math.abs(n[0]) > 0.5) return [0, 0, HALF_PI];
  return [HALF_PI, 0, 0];
}

/**
 * The connector geometry for one interface, in the part's local frame.
 * Tier "frame", zone "joint" — the critic treats it as rooting hardware.
 */
export function mountGeometry(iface: PartInterface, brief: Brief): Prim[] {
  const [x, y, z] = iface.pos;
  const r = Math.max(0.01, iface.size * 0.5);
  const round = brief.silhouette === "R" || brief.edge === "R";
  const sides = round ? 16 : 8;
  const rot = rotToAxis(iface.normal);
  const out: Prim[] = [];

  if (iface.kind === "ball") {
    out.push(
      { kind: "cyl", role: "frame", size: [r * 0.72, r * 0.86, r * 1.1], pos: [x, y, z], rot, sides, tier: "frame", zone: "joint", bevel: 0.4 },
      { kind: "sphere", role: "metal", size: [r * 0.9, 0, 0], pos: [x, y, z], tier: "frame", zone: "joint", bevel: 1 },
    );
  } else if (iface.kind === "hinge") {
    // a clevis — two plates flanking the pin along the hinge axis, so it wraps
    // an existing actuator drum instead of z-fighting it
    const ax = iface.axis;
    const along = Math.abs(ax[0]) > 0.5 ? 0 : Math.abs(ax[1]) > 0.5 ? 1 : 2;
    const plateSize: [number, number, number] =
      along === 0 ? [r * 0.32, r * 1.7, r * 1.7] : along === 1 ? [r * 1.7, r * 0.32, r * 1.7] : [r * 1.7, r * 1.7, r * 0.32];
    const pinRot: [number, number, number] = along === 0 ? [0, 0, HALF_PI] : along === 1 ? [0, 0, 0] : [HALF_PI, 0, 0];
    for (const sgn of [-1, 1]) {
      const p: [number, number, number] = [x, y, z];
      p[along] += sgn * r * 1.35;
      out.push({ kind: "box", role: "frame", size: plateSize, pos: p, tier: "frame", zone: "joint", bevel: 0.2 });
    }
    out.push({ kind: "cyl", role: "metal", size: [r * 0.26, r * 0.26, r * 3.1], pos: [x, y, z], rot: pinRot, sides: 8, tier: "frame", zone: "joint", bevel: 0 });
  } else if (iface.kind === "rail") {
    out.push(
      { kind: "box", role: "mechanism", size: [r * 0.6, r * 2.4, r * 0.6], pos: [x, y, z], rot, tier: "frame", zone: "frame", bevel: 0 },
      { kind: "box", role: "metal", size: [r * 0.35, r * 2.6, r * 0.2], pos: [x, y, z], rot, tier: "frame", zone: "frame", bevel: 0 },
    );
  } else if (iface.kind === "collar-clamp") {
    out.push(
      { kind: "torus", role: "frame", size: [r * 1.05, r * 0.16, 0], pos: [x, y, z], rot, sides: round ? 20 : 8, tier: "frame", zone: "joint", bevel: round ? 1 : 0.2 },
      { kind: "cyl", role: "mechanism", size: [r * 0.92, r * 0.92, r * 0.55], pos: [x, y, z], rot, sides, tier: "frame", zone: "joint", bevel: 0.2 },
    );
  } else {
    // bolt-flange — a flange, a raised boss, and a ring of bolt heads
    out.push(
      round
        ? { kind: "cyl", role: "frame", size: [r * 1.12, r * 1.12, r * 0.3], pos: [x, y, z], rot, sides, tier: "frame", zone: "joint", bevel: 0.5 }
        : { kind: "box", role: "frame", size: [r * 2.1, r * 0.3, r * 2.1], pos: [x, y, z], rot, tier: "frame", zone: "joint", bevel: 0.1 },
      { kind: "cyl", role: "metal", size: [r * 0.5, r * 0.58, r * 0.55], pos: [x, y, z], rot, sides, tier: "frame", zone: "joint", bevel: 0.2 },
    );
    const [u, v] = faceBasis(iface.normal);
    const nb = round ? 6 : 4;
    const br = r * 0.82;
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * Math.PI * 2 + (round ? 0 : Math.PI / 4);
      const c = Math.cos(a) * br;
      const d = Math.sin(a) * br;
      out.push({
        kind: "cyl",
        role: "metal",
        size: [r * 0.14, r * 0.14, r * 0.34],
        pos: [x + u[0] * c + v[0] * d, y + u[1] * c + v[1] * d, z + u[2] * c + v[2] * d],
        rot,
        sides: 6,
        tier: "frame",
        zone: "joint",
        bevel: 0,
      });
    }
  }
  return out;
}

/** Emit connectors for every interface a part declares. */
export function mountAll(ifaces: PartInterface[], brief: Brief): Prim[] {
  return ifaces.flatMap((i) => mountGeometry(i, brief));
}
