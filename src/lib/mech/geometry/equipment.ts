import type { Recipe } from "../recipes";
import type { Spec } from "./types";
import {
  B,
  C,
  Sp,
  N,
  mass,
  lume,
  makeThrusterBell,
} from "./primitives";
import { ACC_IDS, EXTRA_LEGACY, MOD_IDS, WPN_IDS, WING_IDS } from "../catalog";
import { generateKitDNA } from "./dna";

export function pack(r: Recipe): Spec[] {
  const s = r.segs;
  const span = 0.85;
  switch (r.pack) {
    case "wing":
      return [
        B("prim", 0.16, 0.15, 0.11, 0, 0, 0),
        B("sec", 0.06 * span, 0.28, 0.34, 0.14, 0.04, -0.06, 0.3, 0.2, 0),
        B("sec", 0.06 * span, 0.28, 0.34, -0.14, 0.04, -0.06, 0.3, -0.2, 0),
      ];
    case "tank":
      return [
        C("prim", 0.09 * span, 0.09 * span, 0.28, 0.1, 0, 0, Math.PI / 2, 0, 0, s),
        C("prim", 0.09 * span, 0.09 * span, 0.28, -0.1, 0, 0, Math.PI / 2, 0, 0, s),
        B("metal", 0.24, 0.09, 0.11, 0, 0.1, 0),
      ];
    case "spine":
      return [
        B("prim", 0.09, 0.36, 0.09, 0, 0.04, 0),
        B("sec", 0.065, 0.08, 0.2, 0, 0.14, -0.08),
        B("sec", 0.065, 0.08, 0.14, 0, -0.1, -0.06),
      ];
    case "halo":
      return [
        C("trim", 0.17, 0.17, 0.03, 0, 0.08, -0.04, Math.PI / 2, 0, 0, s),
        B("prim", 0.13, 0.11, 0.09, 0, 0, 0),
      ];
    case "twin":
      return [
        B("prim", 0.08, 0.22, 0.13, 0.12, 0, 0),
        B("prim", 0.08, 0.22, 0.13, -0.12, 0, 0),
        C("dark", 0.03, 0.04, 0.09, 0.12, -0.1, -0.08, Math.PI / 2, 0, 0, s),
        C("dark", 0.03, 0.04, 0.09, -0.12, -0.1, -0.08, Math.PI / 2, 0, 0, s),
      ];
    case "mast":
      return [
        B("prim", 0.12, 0.13, 0.1, 0, 0, 0),
        B("metal", 0.03, 0.38, 0.03, 0, 0.22, -0.04),
        B("visor", 0.05, 0.045, 0.05, 0, 0.42, -0.04),
      ];
    case "shell":
      return [
        C("prim", 0.14, 0.12, 0.2, 0, 0, 0, Math.PI / 2, 0, 0, s),
        B("sec", 0.22, 0.065, 0.13, 0, 0.1, 0),
      ];
    case "brick":
      return [
        B("prim", 0.26, 0.12, 0.14, 0, 0.06, 0),
        B("prim", 0.22, 0.12, 0.14, 0, -0.06, 0),
      ];
    case "fin":
      return [
        B("prim", 0.12, 0.12, 0.1, 0, 0, 0),
        B("trim", 0.03, 0.28, 0.16, 0, 0.1, -0.04, 0.2, 0, 0),
      ];
    case "rack":
      return [
        B("metal", 0.2, 0.04, 0.16, 0, 0.08, 0),
        B("metal", 0.2, 0.04, 0.16, 0, -0.04, 0),
        B("dark", 0.04, 0.16, 0.04, 0.08, 0.02, 0),
        B("dark", 0.04, 0.16, 0.04, -0.08, 0.02, 0),
      ];
    case "plate":
      return [
        B("prim", 0.28, 0.22, 0.06, 0, 0, 0),
        B("sec", 0.16, 0.12, 0.05, 0, 0.04, 0.03),
      ];
    case "booster":
      return [
        C("metal", 0.07, 0.09, 0.22, 0.08, 0, 0, Math.PI / 2, 0, 0, s),
        C("metal", 0.07, 0.09, 0.22, -0.08, 0, 0, Math.PI / 2, 0, 0, s),
        C("dark", 0.05, 0.06, 0.07, 0.08, 0, -0.14, Math.PI / 2, 0, 0, s),
        C("dark", 0.05, 0.06, 0.07, -0.08, 0, -0.14, Math.PI / 2, 0, 0, s),
      ];
    case "scythe":
      return [
        B("prim", 0.12, 0.12, 0.1, 0, 0, 0),
        B("acc", 0.04, 0.1, 0.32, 0.1, 0.06, -0.08, 0.4, 0.3, 0),
        B("acc", 0.04, 0.1, 0.32, -0.1, 0.06, -0.08, 0.4, -0.3, 0),
      ];
    case "ring":
      return [
        { t: "torus", m: "trim", s: [0.16, 0.025, 0], p: [0, 0.06, -0.04], r: [Math.PI / 2, 0, 0] },
        B("prim", 0.12, 0.1, 0.1, 0, 0, 0),
      ];
    case "pod":
      return [
        Sp("prim", 0.1, 0.08, 0.04, 0, s),
        Sp("prim", 0.1, -0.08, 0.04, 0, s),
        B("metal", 0.2, 0.08, 0.1, 0, 0.1, 0),
      ];
    case "sail":
      return [
        B("prim", 0.1, 0.1, 0.1, 0, 0, 0),
        B("sec", 0.05, 0.32, 0.22, 0.12, 0.08, -0.06, 0.15, 0.35, 0),
        B("sec", 0.05, 0.32, 0.22, -0.12, 0.08, -0.06, 0.15, -0.35, 0),
      ];
    case "turret":
      return [
        B("prim", 0.16, 0.12, 0.14, 0, 0, 0),
        C("metal", 0.03, 0.025, 0.22, 0, 0.1, 0.08, Math.PI / 2, 0, 0, s),
        B("dark", 0.08, 0.08, 0.08, 0, 0.12, 0),
      ];
    case "canopy":
      return [
        mass(r, "prim", 0.22, 0.1, 0.16, 0, 0.04, 0, -0.25, 0, 0),
        B("dark", 0.14, 0.08, 0.1, 0, -0.04, 0),
      ];
    case "claw":
      return [
        B("prim", 0.12, 0.1, 0.1, 0, 0, 0),
        N("acc", 0.01, 0.03, 0.16, 0.1, 0.06, -0.06, 0.6, 0.3, 0),
        N("acc", 0.01, 0.03, 0.16, -0.1, 0.06, -0.06, 0.6, -0.3, 0),
      ];
    case "fold":
      return [
        B("prim", 0.1, 0.2, 0.08, 0.08, 0, 0, 0, 0, 0.3),
        B("prim", 0.1, 0.2, 0.08, -0.08, 0, 0, 0, 0, -0.3),
        B("metal", 0.16, 0.06, 0.1, 0, 0.1, 0),
      ];
    case "disc":
      return [
        C("prim", 0.16, 0.16, 0.04, 0, 0.06, 0, 0, 0, 0, s),
        B("sec", 0.1, 0.1, 0.1, 0, -0.04, 0),
      ];
    case "arch":
      return [
        C("trim", 0.14, 0.14, 0.04, 0, 0.12, 0, Math.PI / 2, 0, 0, s),
        B("prim", 0.08, 0.16, 0.08, 0.1, 0, 0),
        B("prim", 0.08, 0.16, 0.08, -0.1, 0, 0),
      ];
    case "stack": {
      const n = 2 + Math.floor(r.density / 4);
      const out: Spec[] = [];
      for (let i = 0; i < n; i++) {
        out.push(mass(r, i % 2 ? "sec" : "prim", 0.22 - i * 0.03, 0.07, 0.14, 0, 0.1 - i * 0.08, 0));
      }
      return out;
    }
    case "crystal":
      return [
        B("prim", 0.12, 0.1, 0.1, 0, 0, 0),
        { t: "octa", m: "acc", s: [0.07, 0, 0], p: [0, 0.14, -0.04] },
        { t: "octa", m: "trim", s: [0.04, 0, 0], p: [0.1, 0.06, 0] },
      ];
    default:
      return [
        mass(r, "prim", 0.26, 0.22, 0.14, 0, 0, 0),
        C("metal", 0.05, 0.07, 0.11, 0.09, -0.04, -0.08, Math.PI / 2, 0, 0, s),
        C("metal", 0.05, 0.07, 0.11, -0.09, -0.04, -0.08, Math.PI / 2, 0, 0, s),
      ];
  }
}

export function thruster(r: Recipe): Spec[] {
  const rad = r.curve > 0.5 ? 0.07 : 0.06;
  return [
    // mount block bolting to the socket
    B("prim", 0.08, 0.1, 0.08, 0, 0.04, 0.02),
    // the bell + contained exhaust glow
    ...makeThrusterBell("metal", rad, 0.15, 0, -0.03, 0, Math.PI / 2, 0, 0, r.segs),
  ];
}

/**
 * Binder (back-mounted wing / thruster pod).
 *
 * Rebuilt so every segment is attached: a base mount plate that bolts to the
 * back socket, one main arm that grows out of it, and any nozzle / light
 * housed on that arm — nothing hanging in mid-air.
 */
export function binder(r: Recipe): Spec[] {
  const s = r.segs;
  const dna = generateKitDNA(r.code.id);
  const kind = dna.hash % 5;
  const len = 0.22 + ((dna.hash >>> 4) % 5) * 0.035;
  const lean = ((r.code.serial % 7) - 3) * 0.05;
  const out: Spec[] = [];

  // BASE MOUNT — always present; this is the only thing touching the socket
  out.push(
    B("dark", 0.085, 0.15, 0.075, 0, 0, 0.015),
    C("joint", 0.02, 0.02, 0.1, 0, 0.045, 0, 0, 0, Math.PI / 2, s),
    B("metal", 0.05, 0.05, 0.05, 0, 0.045, -0.01),
  );

  if (kind === 0) {
    // swept wing binder — spar rooted in the mount, skin + tip light on the spar
    const rx = 0.3;
    out.push(
      B("prim", 0.05, len, 0.14, 0, len * 0.42, -0.02, rx, 0.12 + lean, 0),
      B("sec", 0.035, len * 0.66, 0.09, 0.006, len * 0.5, -0.03, rx, 0.12 + lean, 0),
      B("trim", 0.02, len * 0.3, 0.05, 0.01, len * 0.82, -0.01, rx, 0.12 + lean, 0),
      ...lume("acc", 0.01, 0.03, 0.004, len * 0.86, -0.06, rx + Math.PI / 2, 0, 0, 8),
    );
  } else if (kind === 1) {
    // twin thruster binder — a short arm with two housed bells at its end
    out.push(
      B("prim", 0.11, 0.12, 0.14, 0, 0.02, -0.06),
      B("dark", 0.09, 0.09, 0.1, 0, -0.02, -0.14),
      ...makeThrusterBell("metal", 0.04, 0.1, -0.045, -0.05, -0.18, 0.4, 0, 0, s),
      ...makeThrusterBell("metal", 0.04, 0.1, 0.045, -0.05, -0.18, 0.4, 0, 0, s),
    );
  } else if (kind === 2) {
    // shield binder — a flat armour panel bracketed off the mount
    out.push(
      B("metal", 0.03, 0.1, 0.06, 0.02, 0.06, -0.02, 0, 0, 0.3),
      B("prim", 0.05, len * 1.1, 0.2, 0.06, len * 0.4, -0.04, 0.1, 0.18 + lean, 0),
      B("sec", 0.03, len * 0.7, 0.13, 0.07, len * 0.45, -0.05, 0.1, 0.18 + lean, 0),
    );
  } else if (kind === 3) {
    // fuel / propellant tank binder — a capsule tank clamped to the mount
    out.push(
      B("metal", 0.04, 0.06, 0.08, 0, 0.02, -0.05),
      { t: "capsule", m: "prim", s: [0.06, len * 0.8, 0], p: [0, 0.02, -0.12], r: [0.5, 0, 0] },
      C("trim", 0.062, 0.062, 0.02, 0, 0.12, -0.19, 0.5, 0, 0, s),
      ...lume("metal", 0.014, 0.03, 0, -0.06, -0.05, Math.PI / 2, 0, 0, 8),
    );
  } else {
    // sensor mast binder — a vertical mast off the mount with a housed emitter
    out.push(
      B("metal", 0.03, len * 0.9, 0.03, 0, len * 0.45, -0.02, 0.1, 0, lean),
      B("prim", 0.06, 0.05, 0.06, 0, len * 0.85, -0.02, 0.1, 0, lean),
      ...lume("acc", 0.016, 0.035, 0, len * 0.92, 0.004, 0, 0, 0, 8),
    );
  }

  return out;
}

export function stabilizer(r: Recipe): Spec[] {
  return [
    B("prim", 0.08, 0.22 * r.height, 0.1, 0, -0.06, 0, 0.3, 0, 0),
    B("sec", 0.04, 0.14, 0.06, 0, -0.1, 0),
  ];
}

export function weaponSpecs(v: string, beamZ = 1): Spec[] {
  const L = Math.max(0.35, beamZ);
  const rx = Math.PI / 2;
  const grip = (): Spec[] => [B("dark", 0.038, 0.12, 0.045, 0, -0.02, 0)];

  if (v === "rifle") {
    return [
      ...grip(),
      B("dark", 0.05, 0.05, 0.26, 0, 0.09, 0.1),
      C("metal", 0.018, 0.018, 0.22, 0, 0.1, 0.3, rx, 0, 0),
      B("sec", 0.055, 0.04, 0.09, 0, 0.08, -0.1),
      B("acc", 0.025, 0.025, 0.07, 0, 0.13, 0.06),
    ];
  }
  if (v === "longrifle") {
    return [
      ...grip(),
      B("dark", 0.048, 0.048, 0.38, 0, 0.09, 0.16),
      C("metal", 0.016, 0.016, 0.3, 0, 0.1, 0.48, rx, 0, 0),
      B("prim", 0.06, 0.04, 0.1, 0, 0.08, -0.12),
      B("sec", 0.07, 0.03, 0.07, 0, 0.13, 0.08),
    ];
  }
  if (v === "machinegun") {
    return [
      ...grip(),
      B("dark", 0.075, 0.07, 0.2, 0, 0.09, 0.08),
      C("metal", 0.016, 0.016, 0.16, 0.028, 0.1, 0.24, rx, 0, 0),
      C("metal", 0.016, 0.016, 0.16, -0.028, 0.1, 0.24, rx, 0, 0),
      C("dark", 0.04, 0.04, 0.1, 0, -0.08, 0.04),
    ];
  }
  if (v === "cannon") {
    return [
      B("dark", 0.05, 0.12, 0.055, 0, -0.02, 0),
      C("metal", 0.055, 0.065, 0.3, 0, 0.1, 0.18, rx, 0, 0),
      B("prim", 0.11, 0.1, 0.12, 0, 0.08, -0.04),
      C("dark", 0.032, 0.04, 0.05, 0, 0.1, 0.35, rx, 0, 0),
    ];
  }
  if (v === "shotgun") {
    return [
      ...grip(),
      B("dark", 0.065, 0.06, 0.16, 0, 0.09, 0.06),
      C("metal", 0.026, 0.03, 0.14, 0.024, 0.1, 0.2, rx, 0, 0),
      C("metal", 0.026, 0.03, 0.14, -0.024, 0.1, 0.2, rx, 0, 0),
    ];
  }
  if (v === "sniper") {
    return [
      ...grip(),
      B("dark", 0.042, 0.045, 0.46, 0, 0.09, 0.18),
      C("metal", 0.014, 0.014, 0.26, 0, 0.1, 0.52, rx, 0, 0),
      C("visor", 0.018, 0.018, 0.07, 0, 0.14, 0.06),
    ];
  }
  if (v === "pistol") {
    return [
      B("dark", 0.036, 0.11, 0.042, 0, -0.02, 0),
      B("dark", 0.048, 0.05, 0.1, 0, 0.08, 0.05),
      C("metal", 0.014, 0.014, 0.07, 0, 0.09, 0.12, rx, 0, 0),
    ];
  }
  if (v === "smg") {
    return [
      ...grip(),
      B("dark", 0.055, 0.055, 0.14, 0, 0.09, 0.06),
      C("metal", 0.014, 0.014, 0.12, 0, 0.1, 0.16, rx, 0, 0),
      B("acc", 0.07, 0.035, 0.05, 0, 0.04, 0.02),
    ];
  }
  if (v === "bazooka") {
    return [
      B("dark", 0.048, 0.12, 0.055, 0, -0.02, 0),
      C("prim", 0.065, 0.075, 0.34, 0, 0.1, 0.14, rx, 0, 0),
      B("dark", 0.09, 0.08, 0.1, 0, 0.08, -0.08),
      N("acc", 0.018, 0.055, 0.07, 0, 0.1, 0.34, rx, 0, 0),
    ];
  }
  if (v === "vulcan") {
    return [
      ...grip(),
      B("metal", 0.09, 0.07, 0.12, 0, 0.1, 0.06),
      C("metal", 0.011, 0.011, 0.14, 0.036, 0.11, 0.16, rx, 0, 0),
      C("metal", 0.011, 0.011, 0.14, -0.036, 0.11, 0.16, rx, 0, 0),
      C("metal", 0.011, 0.011, 0.14, 0, 0.07, 0.16, rx, 0, 0),
    ];
  }
  if (v === "saber") {
    const bl = 0.42 * L;
    return [
      C("dark", 0.022, 0.026, 0.12, 0, 0, 0, rx, 0, 0),
      B("acc", 0.04, 0.04, 0.03, 0, 0, 0.07),
      C("visor", 0.016, 0.01, bl, 0, 0, 0.085 + bl / 2, rx, 0, 0),
    ];
  }
  if (v === "beamdagger") {
    const bl = 0.22 * L;
    return [
      C("dark", 0.02, 0.024, 0.1, 0, 0, 0, rx, 0, 0),
      B("acc", 0.034, 0.034, 0.028, 0, 0, 0.06),
      C("visor", 0.013, 0.008, bl, 0, 0, 0.07 + bl / 2, rx, 0, 0),
    ];
  }
  if (v === "naginata") {
    const bl = 0.7 * L;
    return [
      C("dark", 0.018, 0.02, 0.16, 0, 0, 0, rx, 0, 0),
      B("metal", 0.038, 0.038, 0.04, 0, 0, 0.1),
      C("visor", 0.013, 0.01, bl, 0, 0, 0.12 + bl / 2, rx, 0, 0),
    ];
  }
  if (v === "twin") {
    const bl = 0.32 * L;
    return [
      B("dark", 0.1, 0.05, 0.08, 0, 0, 0),
      C("visor", 0.012, 0.01, bl, 0.04, 0, 0.05 + bl / 2, rx, 0, 0),
      C("visor", 0.012, 0.01, bl, -0.04, 0, 0.05 + bl / 2, rx, 0, 0),
    ];
  }
  if (v === "dagger") {
    return [
      C("dark", 0.016, 0.018, 0.09, 0, 0, 0, rx, 0, 0),
      B("metal", 0.028, 0.028, 0.028, 0, 0, 0.05),
      B("metal", 0.018, 0.01, 0.15, 0, 0, 0.14),
      N("metal", 0.002, 0.011, 0.04, 0, 0, 0.23, rx, 0, 0),
    ];
  }
  if (v === "longsword") {
    return [
      C("dark", 0.018, 0.02, 0.12, 0, 0, 0, rx, 0, 0),
      B("acc", 0.075, 0.018, 0.028, 0, 0, 0.07),
      B("metal", 0.022, 0.01, 0.4, 0, 0, 0.28),
      N("metal", 0.002, 0.013, 0.055, 0, 0, 0.5, rx, 0, 0),
    ];
  }
  if (v === "axe") {
    return [
      C("dark", 0.018, 0.022, 0.28, 0, 0, 0.12, rx, 0, 0),
      B("dark", 0.045, 0.045, 0.04, 0, 0, 0.24),
      B("metal", 0.16, 0.12, 0.045, 0, 0.01, 0.255),
      B("metal", 0.09, 0.16, 0.032, 0.055, 0.01, 0.255, 0, 0, 0.38),
    ];
  }
  if (v === "hammer") {
    return [
      C("dark", 0.02, 0.024, 0.26, 0, 0, 0.11, rx, 0, 0),
      B("metal", 0.04, 0.04, 0.04, 0, 0, 0.22),
      B("metal", 0.14, 0.1, 0.11, 0, 0.01, 0.255),
      B("dark", 0.16, 0.055, 0.08, 0, 0.01, 0.255),
    ];
  }
  if (v === "spear") {
    return [
      C("dark", 0.016, 0.018, 0.14, 0, 0, 0, rx, 0, 0),
      C("metal", 0.012, 0.012, 0.48, 0, 0, 0.3, rx, 0, 0),
      N("acc", 0.004, 0.028, 0.1, 0, 0, 0.58, rx, 0, 0),
    ];
  }
  if (v === "mace") {
    return [
      C("dark", 0.02, 0.022, 0.14, 0, 0, 0, rx, 0, 0),
      Sp("metal", 0.065, 0, 0.02, 0.2, 8),
      N("metal", 0.01, 0.028, 0.045, 0.05, 0.04, 0.22),
      N("metal", 0.01, 0.028, 0.045, -0.05, 0.04, 0.22),
    ];
  }
  return [];
}

export function shieldSpecs(v: string): Spec[] {
  const mount: Spec = B("dark", 0.06, 0.05, 0.042, 0, 0.09, -0.04);
  if (v === "round") {
    return [
      mount,
      C("prim", 0.16, 0.16, 0.04, 0, 0.18, 0, Math.PI / 2, 0, 0, 16),
      C("sec", 0.08, 0.08, 0.05, 0, 0.18, 0.02, Math.PI / 2, 0, 0, 16),
    ];
  }
  if (v === "tower") {
    return [
      mount,
      B("prim", 0.22, 0.48, 0.05, 0, 0.27, 0),
      B("sec", 0.1, 0.16, 0.06, 0, 0.34, 0.02),
      B("acc", 0.06, 0.07, 0.05, 0, 0.1, 0.02),
    ];
  }
  if (v === "buckler") {
    return [
      mount,
      C("prim", 0.1, 0.1, 0.04, 0, 0.12, 0, Math.PI / 2, 0, 0, 16),
      B("metal", 0.04, 0.04, 0.05, 0, 0.12, 0.03),
    ];
  }
  if (v === "heater") {
    return [
      mount,
      B("prim", 0.2, 0.3, 0.045, 0, 0.2, 0),
      B("prim", 0.14, 0.08, 0.045, 0, 0.06, 0),
      B("sec", 0.08, 0.1, 0.05, 0, 0.22, 0.02),
    ];
  }
  if (v === "scutum") {
    return [
      mount,
      B("prim", 0.28, 0.38, 0.05, 0, 0.22, 0),
      C("sec", 0.12, 0.12, 0.04, 0, 0.24, 0.03, Math.PI / 2, 0, 0, 16),
    ];
  }
  if (v === "hex") {
    return [
      mount,
      C("prim", 0.16, 0.16, 0.045, 0, 0.18, 0, Math.PI / 2, 0, 0, 6),
      B("trim", 0.06, 0.06, 0.05, 0, 0.18, 0.03),
    ];
  }
  if (v === "penta") {
    return [
      mount,
      C("prim", 0.15, 0.15, 0.045, 0, 0.18, 0, Math.PI / 2, 0, 0, 5),
      B("acc", 0.05, 0.05, 0.05, 0, 0.18, 0.03),
    ];
  }
  if (v === "oval") {
    return [
      mount,
      C("prim", 0.12, 0.18, 0.04, 0, 0.2, 0, Math.PI / 2, 0, 0, 16),
      B("sec", 0.06, 0.1, 0.045, 0, 0.2, 0.02),
    ];
  }
  if (v === "delta") {
    return [
      mount,
      C("prim", 0.02, 0.2, 0.3, 0, 0.16, 0, 0, 0, 0, 3),
      B("dark", 0.06, 0.06, 0.04, 0, 0.12, 0.02),
    ];
  }
  if (v === "cross") {
    return [
      mount,
      B("prim", 0.28, 0.1, 0.04, 0, 0.2, 0),
      B("prim", 0.1, 0.3, 0.04, 0, 0.2, 0),
      B("acc", 0.06, 0.06, 0.05, 0, 0.2, 0.03),
    ];
  }
  if (v === "spike") {
    return [
      mount,
      C("prim", 0.14, 0.14, 0.045, 0, 0.16, 0, Math.PI / 2, 0, 0, 12),
      N("metal", 0.01, 0.04, 0.1, 0, 0.3, 0),
      N("metal", 0.01, 0.03, 0.08, 0.1, 0.16, 0),
      N("metal", 0.01, 0.03, 0.08, -0.1, 0.16, 0),
    ];
  }
  if (v === "wing") {
    return [
      mount,
      B("prim", 0.1, 0.26, 0.04, 0, 0.16, 0),
      B("sec", 0.16, 0.07, 0.03, 0.12, 0.22, 0, 0.3, 0.4, 0),
      B("sec", 0.16, 0.07, 0.03, -0.12, 0.22, 0, 0.3, -0.4, 0),
    ];
  }
  if (v === "slab") {
    return [
      mount,
      B("prim", 0.24, 0.16, 0.08, 0, 0.11, 0),
      B("dark", 0.2, 0.035, 0.07, 0, 0.04, 0),
    ];
  }
  if (v === "dish") {
    return [
      mount,
      { t: "hemi", m: "prim", s: [0.16, 0, 0], p: [0, 0.14, 0] },
      C("sec", 0.08, 0.08, 0.03, 0, 0.14, 0.04, Math.PI / 2, 0, 0, 16),
    ];
  }
  if (v === "blade") {
    return [
      mount,
      B("prim", 0.08, 0.4, 0.03, 0, 0.24, 0, 0, 0, 0.15),
      B("metal", 0.06, 0.07, 0.04, 0, 0.08, 0.01),
    ];
  }
  if (v === "lattice") {
    return [
      mount,
      B("prim", 0.22, 0.04, 0.04, 0, 0.34, 0),
      B("prim", 0.22, 0.04, 0.04, 0, 0.1, 0),
      B("prim", 0.04, 0.28, 0.04, 0.09, 0.22, 0),
      B("prim", 0.04, 0.28, 0.04, -0.09, 0.22, 0),
    ];
  }
  if (v === "diamond") {
    return [
      mount,
      B("prim", 0.18, 0.18, 0.045, 0, 0.2, 0, 0, 0, Math.PI / 4),
      B("sec", 0.08, 0.08, 0.05, 0, 0.2, 0.02, 0, 0, Math.PI / 4),
    ];
  }
  if (v === "capsule") {
    return [
      mount,
      { t: "capsule", m: "prim", s: [0.1, 0.2, 0], p: [0, 0.2, 0] },
      B("sec", 0.06, 0.1, 0.05, 0, 0.2, 0.04),
    ];
  }
  if (v === "layer") {
    return [
      mount,
      B("prim", 0.22, 0.26, 0.03, 0, 0.18, 0),
      B("sec", 0.16, 0.18, 0.03, 0, 0.18, 0.03),
      B("acc", 0.1, 0.1, 0.03, 0, 0.18, 0.06),
    ];
  }
  return [
    mount,
    B("prim", 0.18, 0.32, 0.045, 0, 0.22, 0),
    B("prim", 0.12, 0.08, 0.045, 0, 0.06, 0),
    B("sec", 0.08, 0.12, 0.05, 0, 0.24, 0.02),
    B("acc", 0.05, 0.05, 0.04, 0, 0.1, 0.02),
  ];
}

export function extraSpecs(v: string): Spec[] {
  const id = EXTRA_LEGACY[v] ?? v;
  if (WING_IDS.includes(id)) return extraWing(id);
  const mi = MOD_IDS.indexOf(id);
  if (mi >= 0) return extraModular(mi + 1);
  const wi = WPN_IDS.indexOf(id);
  if (wi >= 0) return extraWeapon(wi + 1);
  const ai = ACC_IDS.indexOf(id);
  if (ai >= 0) return extraAcc(ai + 1);
  return extraShape(id);
}

function extraWing(id: string): Spec[] {
  if (id === "deltaWing") {
    return [
      B("prim", 0.62, 0.02, 0.18, 0, 0, 0),
      B("prim", 0.34, 0.016, 0.26, 0, 0, -0.08),
      B("trim", 0.08, 0.028, 0.08, 0, 0.01, 0.05),
      B("dark", 0.04, 0.018, 0.12, 0.22, 0, -0.02, 0, 0.2, 0),
      B("dark", 0.04, 0.018, 0.12, -0.22, 0, -0.02, 0, -0.2, 0),
    ];
  }
  if (id === "sweptWing") {
    return [
      B("prim", 0.66, 0.018, 0.12, 0, 0, 0, 0, 0.5, 0),
      B("sec", 0.22, 0.016, 0.1, 0.16, 0, -0.05, 0, 0.5, 0),
      B("sec", 0.22, 0.016, 0.1, -0.16, 0, -0.05, 0, -0.5, 0),
      B("trim", 0.1, 0.024, 0.06, 0, 0.01, 0.04),
    ];
  }
  if (id === "canardWing") {
    return [
      B("prim", 0.36, 0.016, 0.09, 0, 0, 0.05),
      B("acc", 0.14, 0.014, 0.12, 0.12, 0, -0.02, 0, 0.35, 0),
      B("acc", 0.14, 0.014, 0.12, -0.12, 0, -0.02, 0, -0.35, 0),
      B("dark", 0.06, 0.02, 0.06, 0, 0.01, 0.02),
    ];
  }
  if (id === "stubWing") {
    return [
      B("prim", 0.44, 0.026, 0.1, 0, 0, 0),
      B("dark", 0.14, 0.032, 0.08, 0, 0.01, 0.02),
      C("metal", 0.018, 0.018, 0.08, 0.16, 0, 0, Math.PI / 2, 0, 0),
      C("metal", 0.018, 0.018, 0.08, -0.16, 0, 0, Math.PI / 2, 0, 0),
      B("trim", 0.08, 0.02, 0.14, 0, 0, -0.04),
    ];
  }
  return [
    B("prim", 0.28, 0.018, 0.22, 0.14, 0, 0, 0.12, 0.55, 0.18),
    B("prim", 0.28, 0.018, 0.22, -0.14, 0, 0, 0.12, -0.55, -0.18),
    B("trim", 0.1, 0.026, 0.08, 0, 0, 0),
    B("sec", 0.06, 0.016, 0.16, 0.2, 0, -0.04, 0, 0.4, 0),
    B("sec", 0.06, 0.016, 0.16, -0.2, 0, -0.04, 0, -0.4, 0),
  ];
}

function extraShape(id: string): Spec[] {
  switch (id) {
    case "cube":
      return [B("prim", 0.16, 0.16, 0.16, 0, 0, 0)];
    case "cuboid":
      return [B("prim", 0.12, 0.22, 0.12, 0, 0, 0)];
    case "sphere":
      return [Sp("prim", 0.1, 0, 0, 0, 16)];
    case "cylinder":
      return [C("prim", 0.07, 0.07, 0.2, 0, 0, 0, 0, 0, 0, 16)];
    case "cone":
      return [N("prim", 0.01, 0.09, 0.2, 0, 0, 0)];
    case "torus":
      return [{ t: "torus", m: "prim", s: [0.08, 0.03, 0], p: [0, 0, 0] }];
    case "tetra":
      return [{ t: "tetra", m: "prim", s: [0.12, 0, 0], p: [0, 0, 0] }];
    case "octa":
      return [{ t: "octa", m: "prim", s: [0.12, 0, 0], p: [0, 0, 0] }];
    case "dodeca":
      return [{ t: "dodeca", m: "prim", s: [0.11, 0, 0], p: [0, 0, 0] }];
    case "icosa":
      return [{ t: "icosa", m: "prim", s: [0.12, 0, 0], p: [0, 0, 0] }];
    case "pyramid":
      return [C("prim", 0.01, 0.1, 0.18, 0, 0, 0, 0, 0, 0, 3)];
    case "prism":
      return [C("prim", 0.08, 0.08, 0.18, 0, 0, 0, 0, 0, 0, 3)];
    case "hexprism":
      return [C("prim", 0.08, 0.08, 0.18, 0, 0, 0, 0, 0, 0, 6)];
    case "capsule":
      return [{ t: "capsule", m: "prim", s: [0.06, 0.14, 0], p: [0, 0, 0] }];
    case "disc":
      return [C("prim", 0.11, 0.11, 0.04, 0, 0, 0, 0, 0, 0, 16)];
    case "ring":
      return [{ t: "torus", m: "prim", s: [0.09, 0.018, 0], p: [0, 0, 0] }];
    case "wedge":
      return [B("prim", 0.16, 0.12, 0.2, 0, 0, 0, 0.45, 0, 0)];
    case "cross":
      return [
        B("prim", 0.2, 0.05, 0.05, 0, 0, 0),
        B("prim", 0.05, 0.2, 0.05, 0, 0, 0),
        B("prim", 0.05, 0.05, 0.2, 0, 0, 0),
      ];
    case "hemisphere":
      return [{ t: "hemi", m: "prim", s: [0.1, 0, 0], p: [0, 0, 0] }];
    case "knot":
      return [{ t: "knot", m: "prim", s: [0.07, 0.022, 0], p: [0, 0, 0] }];
    default:
      return [];
  }
}

function extraModular(n: number): Spec[] {
  switch (n) {
    case 1:
      return [
        C("metal", 0.07, 0.09, 0.2, 0, 0, 0, Math.PI / 2, 0, 0),
        C("dark", 0.05, 0.06, 0.07, 0, 0, -0.14, Math.PI / 2, 0, 0),
      ];
    case 2:
      return [
        C("metal", 0.05, 0.07, 0.18, 0.08, 0, 0, Math.PI / 2, 0, 0),
        C("metal", 0.05, 0.07, 0.18, -0.08, 0, 0, Math.PI / 2, 0, 0),
        C("dark", 0.04, 0.05, 0.06, 0.08, 0, -0.12, Math.PI / 2, 0, 0),
        C("dark", 0.04, 0.05, 0.06, -0.08, 0, -0.12, Math.PI / 2, 0, 0),
      ];
    case 3:
      return [
        B("prim", 0.18, 0.14, 0.22, 0, 0, 0),
        B("dark", 0.16, 0.04, 0.2, 0, 0.08, 0),
        B("metal", 0.04, 0.08, 0.04, 0.1, 0, 0.1),
      ];
    case 4:
      return [
        C("prim", 0.08, 0.08, 0.16, 0, 0, 0, Math.PI / 2, 0, 0),
        B("sec", 0.1, 0.08, 0.1, 0, 0.06, 0),
      ];
    case 5:
      return [
        C("metal", 0.07, 0.07, 0.24, 0, 0, 0, Math.PI / 2, 0, 0),
        C("dark", 0.05, 0.05, 0.08, 0, 0, 0.14, Math.PI / 2, 0, 0),
      ];
    case 6:
      return [
        B("prim", 0.06, 0.16, 0.32, 0, 0.02, -0.04, 0.3, 0.2, 0),
        B("sec", 0.04, 0.08, 0.18, 0, 0.04, 0),
        C("dark", 0.025, 0.03, 0.08, 0, -0.04, -0.16, Math.PI / 2, 0, 0),
      ];
    case 7:
      return [
        B("dark", 0.14, 0.06, 0.1, 0, 0, 0),
        B("metal", 0.03, 0.08, 0.08, 0.05, -0.04, 0),
        B("metal", 0.03, 0.08, 0.08, -0.05, -0.04, 0),
      ];
    case 8:
      return [
        C("prim", 0.06, 0.05, 0.2, 0, 0, 0, Math.PI / 2, 0, 0),
        N("acc", 0.02, 0.05, 0.08, 0, 0, 0.14, Math.PI / 2, 0, 0),
      ];
    case 9:
      return [
        B("prim", 0.12, 0.22, 0.06, 0, 0, 0, 0.2, 0, 0),
        B("sec", 0.06, 0.12, 0.05, 0, 0.04, 0.02),
      ];
    case 10:
      return [
        C("metal", 0.03, 0.04, 0.1, 0.06, 0.04, -0.04, Math.PI / 2, 0, 0),
        C("metal", 0.03, 0.04, 0.1, -0.06, 0.04, -0.04, Math.PI / 2, 0, 0),
        C("dark", 0.02, 0.025, 0.05, 0.06, 0.04, -0.1, Math.PI / 2, 0, 0),
        C("dark", 0.02, 0.025, 0.05, -0.06, 0.04, -0.1, Math.PI / 2, 0, 0),
      ];
    case 11:
      return [
        B("prim", 0.2, 0.12, 0.16, 0, 0, 0),
        B("sec", 0.08, 0.18, 0.1, 0, 0.08, -0.04),
      ];
    case 12:
      return [
        B("prim", 0.08, 0.2, 0.16, 0, -0.04, 0, 0.25, 0, 0),
        B("acc", 0.04, 0.14, 0.12, 0.03, -0.02, 0),
      ];
    case 13:
      return [
        B("prim", 0.14, 0.1, 0.16, 0, 0, 0),
        C("metal", 0.04, 0.05, 0.14, 0, 0.02, 0.1, Math.PI / 2, 0, 0),
      ];
    case 14:
      return [
        B("dark", 0.16, 0.12, 0.14, 0, 0, 0),
        B("prim", 0.1, 0.08, 0.1, 0, 0, 0.08),
      ];
    case 15:
      return [
        C("trim", 0.12, 0.12, 0.04, 0, 0, 0, Math.PI / 2, 0, 0),
        C("dark", 0.06, 0.06, 0.03, 0, 0, -0.03, Math.PI / 2, 0, 0),
      ];
    case 16:
      return [
        B("prim", 0.22, 0.08, 0.12, 0, 0, 0, 0.15, 0, 0),
        B("dark", 0.18, 0.05, 0.1, 0, -0.04, 0),
      ];
    case 17:
      return [
        B("sec", 0.05, 0.14, 0.28, 0.1, 0.04, -0.04, 0.35, 0.2, 0),
        B("sec", 0.05, 0.14, 0.28, -0.1, 0.04, -0.04, 0.35, -0.2, 0),
      ];
    case 18:
      return [
        Sp("prim", 0.08, 0, 0.04, 0),
        C("metal", 0.02, 0.015, 0.12, 0, 0.12, 0),
      ];
    case 19:
      return [
        B("metal", 0.16, 0.1, 0.1, 0, 0, 0),
        C("dark", 0.03, 0.03, 0.12, 0.06, 0.06, 0),
        C("dark", 0.03, 0.03, 0.12, -0.06, 0.06, 0),
      ];
    default:
      return [
        B("prim", 0.16, 0.04, 0.2, 0, 0, 0),
        B("dark", 0.14, 0.03, 0.18, 0, 0.03, 0),
      ];
  }
}

function extraWeapon(n: number): Spec[] {
  switch (n) {
    case 1:
      return [
        C("metal", 0.05, 0.06, 0.3, 0, 0, 0.06, Math.PI / 2, 0, 0),
        B("prim", 0.1, 0.1, 0.12, 0, 0, -0.08),
      ];
    case 2:
      return [
        B("dark", 0.12, 0.1, 0.16, 0, 0, 0),
        C("prim", 0.02, 0.02, 0.14, 0.03, 0.02, 0.08, Math.PI / 2, 0, 0),
        C("prim", 0.02, 0.02, 0.14, -0.03, 0.02, 0.08, Math.PI / 2, 0, 0),
        C("prim", 0.02, 0.02, 0.14, 0.03, -0.02, 0.08, Math.PI / 2, 0, 0),
        C("prim", 0.02, 0.02, 0.14, -0.03, -0.02, 0.08, Math.PI / 2, 0, 0),
      ];
    case 3:
      return [
        B("dark", 0.04, 0.08, 0.1, 0, 0, 0),
        C("visor", 0.01, 0.008, 0.22, 0.04, 0.02, 0.08, Math.PI / 2, 0, 0),
        C("visor", 0.01, 0.008, 0.22, -0.04, 0.02, 0.08, Math.PI / 2, 0, 0),
      ];
    case 4:
      return [
        B("dark", 0.1, 0.08, 0.1, 0, 0, 0),
        C("metal", 0.018, 0.018, 0.1, 0.03, 0.03, 0.06, Math.PI / 2, 0, 0),
        C("metal", 0.018, 0.018, 0.1, -0.03, 0.03, 0.06, Math.PI / 2, 0, 0),
      ];
    case 5:
      return [
        B("prim", 0.1, 0.12, 0.18, 0, 0, 0),
        C("metal", 0.03, 0.025, 0.36, 0, 0.02, 0.24, Math.PI / 2, 0, 0),
        B("acc", 0.06, 0.06, 0.08, 0, 0.08, 0.04),
      ];
    case 6:
      return [
        B("dark", 0.1, 0.1, 0.2, 0, 0, 0),
        C("metal", 0.025, 0.025, 0.22, 0.04, 0.02, 0.16, Math.PI / 2, 0, 0),
        C("metal", 0.025, 0.025, 0.22, -0.04, 0.02, 0.16, Math.PI / 2, 0, 0),
        C("dark", 0.05, 0.05, 0.1, 0, -0.08, 0),
      ];
    case 7:
      return [
        B("prim", 0.08, 0.1, 0.22, 0, 0, 0),
        C("metal", 0.02, 0.02, 0.4, 0, 0.02, 0.28, Math.PI / 2, 0, 0),
        B("sec", 0.1, 0.06, 0.1, 0, 0.08, 0.06),
      ];
    case 8:
      return [
        B("dark", 0.1, 0.12, 0.18, 0, 0, 0),
        C("metal", 0.04, 0.05, 0.16, 0, 0.02, 0.14, Math.PI / 2, 0, 0),
      ];
    case 9:
      return [
        B("dark", 0.04, 0.08, 0.14, 0, 0, 0),
        B("glow", 0.03, 0.16, 0.2, 0, 0.08, 0.1, 0.4, 0, 0),
      ];
    case 10:
      return [
        C("metal", 0.02, 0.014, 0.55, 0, 0, 0.16, Math.PI / 2, 0, 0),
        B("prim", 0.07, 0.07, 0.12, 0, 0, -0.08),
        N("acc", 0.01, 0.028, 0.08, 0, 0, 0.46, Math.PI / 2, 0, 0),
      ];
    case 11:
      return [
        C("metal", 0.08, 0.09, 0.28, 0, 0, 0.06, Math.PI / 2, 0, 0),
        B("prim", 0.16, 0.14, 0.16, 0, 0, -0.1),
        C("glow", 0.05, 0.06, 0.06, 0, 0, 0.22, Math.PI / 2, 0, 0),
      ];
    case 12:
      return [
        B("prim", 0.16, 0.08, 0.1, 0, 0, 0),
        B("prim", 0.05, 0.05, 0.14, 0.06, 0.06, 0.04),
        B("prim", 0.05, 0.05, 0.14, -0.06, 0.06, 0.04),
        C("dark", 0.02, 0.025, 0.05, 0.06, 0.06, -0.06, Math.PI / 2, 0, 0),
      ];
    case 13:
      return [
        B("dark", 0.08, 0.08, 0.12, 0, 0, 0),
        C("metal", 0.015, 0.015, 0.2, 0, 0.02, 0.14, Math.PI / 2, 0, 0),
      ];
    case 14:
      return [
        B("dark", 0.14, 0.06, 0.08, 0, 0, 0),
        C("metal", 0.012, 0.012, 0.1, 0.04, 0, 0.08, Math.PI / 2, 0, 0),
        C("metal", 0.012, 0.012, 0.1, -0.04, 0, 0.08, Math.PI / 2, 0, 0),
      ];
    case 15:
      return [
        B("prim", 0.12, 0.1, 0.16, 0, 0, 0),
        C("metal", 0.03, 0.03, 0.2, 0.05, 0, 0.12, Math.PI / 2, 0, 0),
        C("dark", 0.04, 0.04, 0.08, 0, -0.08, 0),
      ];
    case 16:
      return [
        C("prim", 0.03, 0.025, 0.16, 0, 0, 0.06, Math.PI / 2, 0, 0),
        B("dark", 0.06, 0.06, 0.08, 0, 0, -0.04),
        N("acc", 0.01, 0.03, 0.06, 0, 0, 0.16, Math.PI / 2, 0, 0),
      ];
    case 17:
      return [
        C("visor", 0.012, 0.01, 0.28, 0.04, 0, 0.12, Math.PI / 2, 0, 0),
        C("visor", 0.012, 0.01, 0.28, -0.04, 0, 0.12, Math.PI / 2, 0, 0),
        B("dark", 0.1, 0.06, 0.08, 0, 0, 0),
      ];
    case 18:
      return [
        B("prim", 0.16, 0.22, 0.05, 0, 0, 0),
        C("metal", 0.03, 0.035, 0.16, 0, 0.04, 0.08, Math.PI / 2, 0, 0),
      ];
    case 19:
      return [
        B("dark", 0.06, 0.08, 0.5, 0, 0, 0.1),
        C("metal", 0.018, 0.018, 0.22, 0, 0.02, 0.36, Math.PI / 2, 0, 0),
        B("sec", 0.08, 0.06, 0.1, 0, 0.06, 0.08),
      ];
    default:
      return [
        B("dark", 0.14, 0.1, 0.18, 0, 0, 0),
        C("prim", 0.018, 0.018, 0.12, 0.04, 0.03, 0.1, Math.PI / 2, 0, 0),
        C("prim", 0.018, 0.018, 0.12, -0.04, 0.03, 0.1, Math.PI / 2, 0, 0),
        C("prim", 0.018, 0.018, 0.12, 0, -0.03, 0.1, Math.PI / 2, 0, 0),
      ];
  }
}

function extraAcc(n: number): Spec[] {
  switch (n) {
    case 1:
      return [
        C("metal", 0.012, 0.01, 0.28, 0, 0.1, 0),
        B("visor", 0.04, 0.03, 0.03, 0, 0.24, 0),
        B("dark", 0.05, 0.03, 0.05, 0, 0, 0),
      ];
    case 2:
      return [
        C("metal", 0.01, 0.008, 0.22, 0.04, 0.08, 0),
        C("metal", 0.01, 0.008, 0.22, -0.04, 0.08, 0),
        B("acc", 0.03, 0.03, 0.03, 0.04, 0.2, 0),
        B("acc", 0.03, 0.03, 0.03, -0.04, 0.2, 0),
      ];
    case 3:
      return [
        B("trim", 0.04, 0.18, 0.08, 0, 0.06, 0, 0.2, 0, 0),
        B("glow", 0.02, 0.12, 0.04, 0, 0.08, 0.03),
      ];
    case 4:
      return [
        B("trim", 0.16, 0.05, 0.06, 0, 0.08, 0),
        B("acc", 0.04, 0.1, 0.04, 0.06, 0.1, 0),
        B("acc", 0.04, 0.1, 0.04, -0.06, 0.1, 0),
      ];
    case 5:
      return [
        Sp("visor", 0.05, 0, 0.02, 0.02),
        B("dark", 0.08, 0.04, 0.04, 0, -0.04, 0),
      ];
    case 6:
      return [
        N("acc", 0.015, 0.04, 0.16, 0, 0.08, 0),
        B("metal", 0.05, 0.04, 0.05, 0, 0, 0),
      ];
    case 7:
      return [
        B("dark", 0.1, 0.04, 0.06, 0, 0.06, 0.04),
        C("metal", 0.01, 0.01, 0.08, 0.03, 0.06, 0.08, Math.PI / 2, 0, 0),
        C("metal", 0.01, 0.01, 0.08, -0.03, 0.06, 0.08, Math.PI / 2, 0, 0),
      ];
    case 8:
      return [
        B("prim", 0.08, 0.06, 0.16, 0, 0, 0),
        C("dark", 0.03, 0.04, 0.06, 0, 0, -0.1, Math.PI / 2, 0, 0),
      ];
    case 9:
      return [
        B("glow", 0.16, 0.03, 0.03, 0, 0.04, 0.04),
        B("glow", 0.03, 0.12, 0.03, 0.08, 0, 0.04),
      ];
    case 10:
      return [
        B("acc", 0.03, 0.16, 0.2, 0, 0.04, 0, 0.4, 0.15, 0),
      ];
    case 11:
      return [
        N("metal", 0.01, 0.03, 0.1, 0, -0.04, 0.06, Math.PI / 2, 0, 0),
        B("dark", 0.06, 0.04, 0.06, 0, 0, 0),
      ];
    case 12:
      return [
        B("prim", 0.06, 0.1, 0.12, 0, 0, 0),
        B("acc", 0.03, 0.12, 0.08, 0.04, 0.02, 0.02),
      ];
    case 13:
      return [
        C("visor", 0.03, 0.03, 0.04, 0, 0.04, 0.02, Math.PI / 2, 0, 0),
        B("dark", 0.06, 0.04, 0.05, 0, 0, 0),
      ];
    case 14:
      return [
        C("metal", 0.008, 0.006, 0.2, 0, 0.08, 0),
        B("sec", 0.04, 0.03, 0.04, 0, 0, 0),
      ];
    case 15:
      return [
        C("trim", 0.1, 0.1, 0.03, 0, 0.08, 0, 0, 0, 0, 16),
        B("prim", 0.06, 0.05, 0.05, 0, 0, 0),
      ];
    case 16:
      return [
        N("acc", 0.01, 0.035, 0.14, 0.06, 0.04, 0),
        N("acc", 0.01, 0.035, 0.14, -0.06, 0.04, 0),
      ];
    case 17:
      return [
        Sp("glow", 0.045, 0, 0.02, 0.02),
        B("trim", 0.08, 0.03, 0.06, 0, -0.03, 0),
      ];
    case 18:
      return [
        B("prim", 0.05, 0.16, 0.08, 0, -0.06, -0.02, 0.35, 0, 0),
        B("sec", 0.03, 0.1, 0.05, 0, -0.1, 0),
      ];
    case 19:
      return [
        N("acc", 0.012, 0.03, 0.12, 0, -0.04, 0.04),
        B("prim", 0.08, 0.06, 0.08, 0, 0, 0),
      ];
    default:
      return [
        N("metal", 0.015, 0.04, 0.12, 0.05, 0.06, 0),
        B("prim", 0.08, 0.06, 0.08, 0, 0, 0),
      ];
  }
}
