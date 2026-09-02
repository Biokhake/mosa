import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MatKey, Palette } from "./palette";
import { getLineMat, getPalette } from "./palette";
import { isLeftSlot, isVisorSlot, ACC_IDS, EXTRA_LEGACY, MOD_IDS, WPN_IDS, WING_IDS } from "./catalog";
import { getRecipe, type Recipe } from "./recipes";

type Spec = {
  t: "box" | "cyl" | "sph" | "cone" | "torus" | "tetra" | "octa" | "dodeca" | "icosa" | "capsule" | "knot" | "hemi" | "ring";
  m: MatKey;
  s: [number, number, number];
  p: [number, number, number];
  r?: [number, number, number];
  n?: number;
};

const B = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({ t: "box", m, s: [w, h, d], p: [x, y, z], r: rx || ry || rz ? [rx, ry, rz] : undefined });

const C = (
  m: MatKey,
  rt: number,
  rb: number,
  h: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  n?: number,
): Spec => ({ t: "cyl", m, s: [rt, rb, h], p: [x, y, z], r: rx || ry || rz ? [rx, ry, rz] : undefined, n });

const Sp = (m: MatKey, r: number, x: number, y: number, z: number, n?: number): Spec => ({
  t: "sph",
  m,
  s: [r, r, r],
  p: [x, y, z],
  n,
});

const N = (
  m: MatKey,
  rt: number,
  rb: number,
  h: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({ t: "cone", m, s: [rt, rb, h], p: [x, y, z], r: rx || ry || rz ? [rx, ry, rz] : undefined });

function base(slot: string): string {
  return slot.replace(/[LR]$/, "");
}

function nSeg(r: Recipe, extra = 0): number {
  if (r.quad === "SS") return Math.min(8, Math.max(4, r.segs + extra));
  return Math.max(8, r.segs + extra);
}

function layersFor(r: Recipe): number {
  return 2 + Math.floor((r.density - 1) / 3);
}

function poly(
  r: Recipe,
  m: MatKey,
  rt: number,
  rb: number,
  h: number,
  x: number,
  y: number,
  z: number,
  sides?: number,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec {
  return C(m, rt, rb, h, x, y, z, rx, ry, rz, sides ?? nSeg(r));
}

function mass(r: Recipe, m: MatKey, w: number, h: number, d: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): Spec {
  if (r.quad === "SS") return B(m, w, h, d, x, y, z, rx, ry, rz);
  if (r.quad === "SR") return B(m, w, h, d, x, y, z, rx, ry, rz);
  if (r.quad === "RR") {
    if (Math.abs(w - h) < 0.08 && Math.abs(h - d) < 0.08) return Sp(m, Math.max(w, h, d) * 0.5, x, y, z, r.segs);
    const rad = Math.min(w, d) * 0.5;
    return C(m, rad, rad * 0.92, h, x, y, z, rx, ry, rz, r.segs);
  }
  const rad = Math.min(w, d) * 0.48;
  return C(m, rad, rad * 0.88, h, x, y, z, rx, ry, rz, r.segs);
}

function densitySeams(r: Recipe, w: number, h: number, d: number, zf: number): Spec[] {
  if (r.ornate) return [];
  const n = Math.floor((r.density - 1) / 3);
  const out: Spec[] = [];
  for (let i = 0; i < n; i++) {
    const y = -h * 0.28 + i * (h * 0.26);
    out.push(B("dark", w * 0.72, Math.max(0.008, h * 0.04), Math.max(0.01, d * 0.1), 0, y, zf));
  }
  if (r.density >= 8) out.push(B("dark", Math.max(0.01, w * 0.04), h * 0.62, d * 0.08, 0, 0, zf * 0.8));
  return out;
}

function rsNubs(r: Recipe, pts: Array<[number, number, number, number?]>): Spec[] {
  if (r.quad !== "RS") return [];
  return pts.map(([x, y, z, h]) => N("acc", 0.006, 0.016, h ?? 0.07, x, y, z));
}

const P2_MATS = new Set<MatKey>(["sec", "acc", "trim", "dark", "metal", "joint"]);

function flipX(s: Spec): Spec {
  const r = s.r ? ([s.r[0], -s.r[1], -s.r[2]] as [number, number, number]) : undefined;
  return { ...s, p: [-s.p[0], s.p[1], s.p[2]], r };
}

function ensureLR(specs: Spec[], eps = 0.012): Spec[] {
  const out = [...specs];
  for (const s of specs) {
    if (!P2_MATS.has(s.m)) continue;
    if (Math.abs(s.p[0]) < eps) continue;
    const twin = specs.some(
      (o) =>
        o.m === s.m &&
        o.t === s.t &&
        Math.abs(o.p[0] + s.p[0]) < 0.02 &&
        Math.abs(o.p[1] - s.p[1]) < 0.02 &&
        Math.abs(o.p[2] - s.p[2]) < 0.02,
    );
    if (!twin) out.push(flipX(s));
  }
  return out;
}

function primBounds(specs: Spec[]) {
  const src = specs.filter((s) => s.m === "prim");
  const use = src.length ? src : specs;
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity,
    maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (const s of use) {
    let hx: number;
    let hy: number;
    let hz: number;
    if (s.t === "box") {
      hx = s.s[0] / 2;
      hy = s.s[1] / 2;
      hz = s.s[2] / 2;
    } else if (s.t === "cyl" || s.t === "cone" || s.t === "capsule") {
      const rad = Math.max(s.s[0], s.s[1] || 0);
      const hh = (s.s[2] || 0.08) / 2;
      const rx = s.r?.[0] ?? 0;
      if (Math.abs(Math.abs(rx) - Math.PI / 2) < 0.3) {
        hx = rad;
        hy = rad;
        hz = hh;
      } else {
        hx = rad;
        hy = hh;
        hz = rad;
      }
    } else {
      const rad = s.s[0] || 0.05;
      hx = hy = hz = rad;
    }
    minX = Math.min(minX, s.p[0] - hx);
    maxX = Math.max(maxX, s.p[0] + hx);
    minY = Math.min(minY, s.p[1] - hy);
    maxY = Math.max(maxY, s.p[1] + hy);
    minZ = Math.min(minZ, s.p[2] - hz);
    maxZ = Math.max(maxZ, s.p[2] + hz);
  }
  if (!Number.isFinite(minX)) {
    return { cx: 0, cy: 0, cz: 0, w: 0.12, h: 0.12, d: 0.12, minY: -0.06, maxY: 0.06 };
  }
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    cz: (minZ + maxZ) / 2,
    w: Math.max(0.04, maxX - minX),
    h: Math.max(0.04, maxY - minY),
    d: Math.max(0.04, maxZ - minZ),
    minY,
    maxY,
  };
}

function slotSalt(id: string) {
  const b = base(id);
  let n = 0;
  for (let i = 0; i < b.length; i++) n = (n * 33 + b.charCodeAt(i)) | 0;
  return Math.abs(n);
}

function dressPart2(prim: Spec[], r: Recipe, slotId: string): Spec[] {
  if (!prim.length) return [];
  const box = primBounds(prim);
  const { cy, cz, w, h, d, minY } = box;
  const q = r.quad === "SS" ? 0 : r.quad === "SR" ? 1 : r.quad === "RS" ? 2 : 3;
  const segs = r.segs;
  const x = Math.max(0.028, w * 0.38);
  const zf = cz + d * 0.42;
  const yt = cy + h * 0.32;
  const yb = cy - h * 0.28;
  const sx = Math.min(w, 0.3);
  const sy = Math.min(h, 0.3);
  const sz = Math.min(d, 0.24);

  if (!r.ornate) {
    const n = Math.floor((r.density - 1) / 4);
    if (n <= 0) return [];
    const out: Spec[] = [];
    for (let i = 0; i < n; i++) {
      const yy = minY + h * (0.3 + i * 0.22 + (r.rank % 5) * 0.012);
      out.push(B("dark", w * 0.62, Math.max(0.008, h * 0.04), Math.max(0.01, d * 0.1), 0, yy, zf * 0.15));
    }
    return out;
  }

  const motif = (r.code.serial * 19 + slotSalt(slotId) * 13 + r.density * 7 + q * 3) % 25;
  const out: Spec[] = [];
  switch (motif) {
    case 0:
      out.push(B("sec", Math.max(0.016, sx * 0.12), sy * 0.72, sz * 0.34, x, cy, cz + d * 0.1));
      break;
    case 1: {
      const s = Math.max(0.016, sx * 0.13);
      out.push(B("metal", s, s, s, x * 0.85, yt, zf * 0.45));
      break;
    }
    case 2: {
      const rad = Math.max(0.011, sx * 0.1);
      out.push(C("dark", rad, rad * 0.72, sz * 0.42, x, cy, zf, Math.PI / 2, 0, 0, segs));
      break;
    }
    case 3:
      out.push(B("trim", sx * 0.22, sy * 0.12, sz * 0.48, x * 0.55, yt, zf * 0.25, 0, 0, 0.45));
      break;
    case 4:
      out.push(B("acc", Math.max(0.014, w * 0.08), sy * 0.48, sz * 0.18, 0, cy, zf));
      break;
    case 5:
      if (q >= 2) {
        out.push({
          t: "torus",
          m: "trim",
          s: [Math.max(0.035, sx * 0.32), Math.max(0.007, sx * 0.055), 0],
          p: [0, yt, cz],
          r: [Math.PI / 2, 0, 0],
        });
      } else {
        out.push(B("trim", w * 0.52, Math.max(0.012, h * 0.08), d * 0.18, 0, yt, zf * 0.15));
      }
      break;
    case 6:
      out.push(B("sec", sx * 0.2, sy * 0.34, sz * 0.52, x, cy + h * 0.06, cz - d * 0.36, 0.35, 0.22, 0));
      break;
    case 7:
      out.push(N("acc", 0.005, Math.max(0.012, sx * 0.1), Math.max(0.036, sy * 0.32), x, yt, cz));
      break;
    case 8:
      out.push(B("dark", Math.max(0.01, w * 0.045), sy * 0.78, sz * 0.62, x * 0.5, cy, cz));
      break;
    case 9:
      out.push(Sp(q >= 2 ? "sec" : "metal", Math.max(0.014, sx * 0.11), x, cy, zf * 0.12, segs));
      break;
    case 10:
      out.push(B("metal", sx * 0.18, Math.max(0.012, h * 0.075), sz * 0.38, x, yt, cz));
      break;
    case 11:
      out.push(B("acc", sx * 0.16, sy * 0.12, Math.max(0.018, d * 0.13), x, cy, zf));
      break;
    case 12:
      if (q === 0) out.push({ t: "tetra", m: "acc", s: [Math.max(0.018, sx * 0.15), 0, 0], p: [x, yt, cz] });
      else out.push({ t: "octa", m: "trim", s: [Math.max(0.016, sx * 0.13), 0, 0], p: [x, yt, cz] });
      break;
    case 13:
      out.push(C("metal", Math.max(0.007, sx * 0.055), Math.max(0.007, sx * 0.055), sy * 0.68, x, cy, cz - d * 0.36, 0, 0, 0, segs));
      break;
    case 14:
      out.push(B("sec", w * 0.6, Math.max(0.011, h * 0.09), d * 0.16, 0, yt, zf * 0.22));
      break;
    case 15:
      out.push(N("acc", 0.008, 0.02, sy * 0.4, x, yt, zf * 0.2, 0.4, 0, 0.2));
      break;
    case 16:
      out.push(B("trim", sx * 0.1, sy * 0.6, sz * 0.12, x, cy, cz, 0, 0, 0.7));
      break;
    case 17:
      out.push(C("glow", 0.012, 0.016, sz * 0.3, 0, cy, zf, Math.PI / 2, 0, 0, segs));
      break;
    case 18:
      out.push(B("sec", sx * 0.28, sy * 0.16, sz * 0.4, 0, yb, zf * 0.1));
      break;
    case 19:
      out.push({ t: "octa", m: "metal", s: [Math.max(0.014, sx * 0.12), 0, 0], p: [x, yb, cz] });
      break;
    case 20:
      out.push(B("dark", w * 0.4, h * 0.06, d * 0.2, 0, yt, cz));
      out.push(B("acc", sx * 0.1, sy * 0.2, sz * 0.12, x, cy, zf));
      break;
    case 21:
      out.push(C("joint", 0.012, 0.012, sy * 0.5, x, cy, cz, 0, 0, Math.PI / 2, segs));
      break;
    case 22:
      out.push(B("trim", sx * 0.18, sy * 0.08, sz * 0.5, x * 0.4, yt, cz, 0.2, 0, 0));
      break;
    case 23:
      out.push(N("metal", 0.006, 0.018, sy * 0.28, 0, yt, zf * 0.3));
      break;
    default:
      out.push(B("sec", sx * 0.26, sy * 0.42, Math.max(0.018, d * 0.15), x, cy, zf * 0.32, 0, 0.18, 0));
  }
  return out;
}

function helmOrnament(r: Recipe, W: number, H: number, D: number): Spec[] {
  const i = r.rank - 12;
  const s = r.segs;
  const q = r.quad;
  switch (i) {
    case 0:
      return [B("sec", W * 0.95, 0.05, D * 0.35, 0, H * 0.48, 0.02), B("trim", W * 0.3, 0.04, D * 0.5, 0, H * 0.52, -0.02)];
    case 1:
      return q === "RR"
        ? [Sp("acc", 0.03, 0.08, H * 0.42, 0.04, s), Sp("acc", 0.03, -0.08, H * 0.42, 0.04, s)]
        : [B("acc", 0.04, 0.08, 0.05, 0.07, H * 0.44, 0.04, 0.4, 0, 0.2), B("acc", 0.04, 0.08, 0.05, -0.07, H * 0.44, 0.04, 0.4, 0, -0.2)];
    case 2:
      return [N("metal", 0.01, 0.03, 0.1, 0, -H * 0.15, D * 0.4, Math.PI / 2, 0, 0)];
    case 3:
      return [
        { t: "torus" as const, m: "trim" as const, s: [0.12, 0.016, 0], p: [0, H * 0.2, D * 0.05], r: [Math.PI / 2, 0, 0] },
      ];
    case 4:
      return [B("metal", W * 0.7, 0.04, D * 0.55, 0, 0.02, D * 0.22, 0.45, 0, 0)];
    case 5:
      return [B("trim", 0.05, 0.18, 0.05, 0.1, H * 0.2, -0.04), B("trim", 0.05, 0.18, 0.05, -0.1, H * 0.2, -0.04)];
    case 6:
      return [B("acc", W * 0.55, 0.03, 0.04, 0, H * 0.08, D * 0.32), B("dark", W * 0.4, 0.08, 0.03, 0, -0.04, D * 0.28)];
    case 7:
      return q === "SS"
        ? [B("trim", W * 0.55, 0.03, W * 0.55, 0, H * 0.42, 0)]
        : [{ t: "torus" as const, m: "trim" as const, s: [0.13, 0.016, 0], p: [0, H * 0.4, 0], r: [Math.PI / 2, 0, 0] }];
    case 8:
      return [C("metal", 0.025, 0.02, 0.14, 0.14, 0.02, D * 0.15, Math.PI / 2, 0.4, 0, s), C("metal", 0.025, 0.02, 0.14, -0.14, 0.02, D * 0.15, Math.PI / 2, -0.4, 0, s)];
    case 9:
      return [B("acc", 0.04, 0.16, 0.1, 0, H * 0.5, -0.02), B("trim", 0.08, 0.04, 0.08, 0, H * 0.6, -0.02)];
    case 10:
      return [B("sec", 0.06, 0.06, 0.06, 0.12, H * 0.1, 0.08), B("sec", 0.06, 0.06, 0.06, -0.12, H * 0.1, 0.08), B("sec", 0.05, 0.05, 0.05, 0, H * 0.28, 0.1)];
    case 11:
      return [B("prim", 0.05, 0.1, 0.22, 0.16, 0.04, -0.08, 0.2, 0.7, 0), B("prim", 0.05, 0.1, 0.22, -0.16, 0.04, -0.08, 0.2, -0.7, 0)];
    default:
      return [B("metal", 0.04, 0.04, 0.12, 0.1, H * 0.2, 0), B("metal", 0.04, 0.04, 0.12, -0.1, H * 0.2, 0), C("glow", 0.02, 0.02, 0.05, 0, H * 0.3, D * 0.2, Math.PI / 2, 0, 0, s)];
  }
}

function helm(r: Recipe): Spec[] {
  const k = r.head;
  const W = 0.4 * k;
  const H = 0.28 * k;
  const D = 0.36 * k;
  const s = nSeg(r);
  const layers = layersFor(r);
  const out: Spec[] = [];

  const stack = (n: number, taper: number, tilt: number, y0: number, sides?: number) => {
    const hh = (H * 1.08) / n;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      const w = W * (1 - t * taper);
      const d = D * (1 - t * taper * 0.5);
      const y = y0 + H * 0.38 - t * H * 0.92;
      const z = t * tilt;
      if (sides) out.push(poly(r, "prim", w * 0.5, w * 0.42, hh * 1.06, 0, y, z, sides));
      else out.push(mass(r, "prim", w, hh * 1.08, d, 0, y, z));
    }
  };

  switch (r.helm) {
    case "blunt":
      stack(Math.min(3, layers), 0.14, 0.015, 0.02);
      out.push(mass(r, "sec", W * 0.62, H * 0.12, D * 0.2, 0, -H * 0.32, D * 0.08));
      break;
    case "hex":
      for (let i = 0; i < Math.min(4, layers); i++) {
        const t = i / Math.max(1, layers - 1);
        out.push(poly(r, "prim", W * (0.46 - t * 0.12), W * (0.4 - t * 0.1), H * 0.38, 0, H * 0.28 - t * H * 0.85, t * 0.02, 6));
      }
      out.push(mass(r, "sec", W * 0.48, H * 0.14, D * 0.28, 0, -H * 0.4, 0.02));
      break;
    case "wedge":
      out.push(mass(r, "prim", W * 0.78, H * 1.08, D * 1.08, 0, 0.02, 0.05, 0.42, 0, 0));
      out.push(B("sec", W * 0.9, H * 0.12, D * 0.22, 0, H * 0.34, -0.04));
      if (r.density > 4) out.push(B("dark", W * 0.48, H * 0.07, D * 0.36, 0, 0.02, D * 0.3, 0.25, 0, 0));
      break;
    case "bucket":
      out.push(poly(r, "prim", W * 0.42, W * 0.34, H * 1.22, 0, 0, 0, r.quad === "SS" ? Math.min(8, s) : s));
      out.push(poly(r, "dark", W * 0.28, W * 0.26, H * 0.26, 0, -H * 0.42, 0.05, s));
      if (r.density > 5) out.push(B("sec", W * 0.7, H * 0.08, D * 0.18, 0, H * 0.2, D * 0.18));
      break;
    case "shelf":
      stack(layers, 0.26, 0.01, 0);
      out.push(B("sec", W * 1.08, H * 0.1, D * 0.58, 0, H * 0.24, D * 0.16));
      out.push(B("dark", W * 0.72, H * 0.07, D * 0.18, 0, H * 0.1, D * 0.24));
      break;
    case "diamond":
      out.push(mass(r, "prim", W * 0.52, H * 0.52, D * 0.52, 0, H * 0.3, 0, 0, Math.PI / 4, 0));
      out.push(mass(r, "prim", W * 0.78, H * 0.52, D * 0.72, 0, -H * 0.14, 0.02));
      if (r.density > 5) out.push(B("sec", W * 0.36, H * 0.08, D * 0.16, 0, H * 0.5, 0));
      break;
    case "split":
      out.push(mass(r, "prim", W * 0.38, H * 1.1, D * 0.92, 0.15, 0.04, 0));
      out.push(mass(r, "prim", W * 0.38, H * 1.1, D * 0.92, -0.15, 0.04, 0));
      out.push(B("dark", W * 0.18, H * 0.5, D * 0.36, 0, -0.04, 0.04));
      if (r.density > 6) {
        out.push(B("sec", W * 0.2, H * 0.1, D * 0.4, 0.15, H * 0.4, 0.04));
        out.push(B("sec", W * 0.2, H * 0.1, D * 0.4, -0.15, H * 0.4, 0.04));
      }
      break;
    case "trap":
      stack(Math.max(4, layers), 0.5, 0.045, 0.08);
      out.push(mass(r, "sec", W * 0.55, H * 0.16, D * 0.7, 0, -H * 0.36, 0.02));
      break;
    case "snout":
      out.push(mass(r, "prim", W * 0.84, H * 0.95, D * 0.68, 0, 0.06, -0.05));
      out.push(mass(r, "prim", W * 0.4, H * 0.42, D * 0.72, 0, -0.06, D * 0.4));
      if (r.density > 5) out.push(B("dark", W * 0.26, H * 0.1, D * 0.2, 0, -0.1, D * 0.55));
      break;
    case "hood":
      out.push(mass(r, "prim", W * 0.92, H * 0.68, D * 0.5, 0, 0.08, 0.08));
      out.push(mass(r, "sec", W * 0.72, H * 0.5, D * 0.9, 0, 0.14, -0.1));
      out.push(B("dark", W * 0.55, H * 0.18, D * 0.18, 0, -0.1, D * 0.16));
      break;
    case "step": {
      const n = Math.min(6, 2 + Math.ceil(r.density / 2));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        out.push(mass(r, i % 2 ? "sec" : "prim", W * (1 - t * 0.42), H / n + 0.018, D * (1 - t * 0.22), 0, H * 0.42 - t * H, t * 0.025));
      }
      break;
    }
    case "gem":
      out.push({ t: "octa", m: "prim", s: [Math.max(W, D) * 0.4, 0, 0], p: [0, H * 0.22, 0] });
      out.push(mass(r, "prim", W * 0.64, H * 0.42, D * 0.58, 0, -H * 0.24, 0.02));
      if (r.density > 7) {
        out.push(B("trim", W * 0.18, H * 0.07, D * 0.18, 0.1, 0, 0.08, 0, 0, 0.4));
        out.push(B("trim", W * 0.18, H * 0.07, D * 0.18, -0.1, 0, 0.08, 0, 0, -0.4));
      }
      break;
    case "anvil":
      out.push(mass(r, "prim", W * 1.12, H * 0.22, D * 0.7, 0, H * 0.38, 0));
      out.push(mass(r, "prim", W * 0.55, H * 0.55, D * 0.55, 0, 0.02, 0.02));
      out.push(mass(r, "sec", W * 0.85, H * 0.2, D * 0.6, 0, -H * 0.32, 0.04));
      break;
    case "arrow":
      out.push(mass(r, "prim", W * 0.7, H * 0.7, D * 0.7, 0, -0.04, 0));
      out.push(B("acc", W * 0.22, H * 0.55, D * 0.18, 0.1, H * 0.28, 0.02, 0, 0, 0.55));
      out.push(B("acc", W * 0.22, H * 0.55, D * 0.18, -0.1, H * 0.28, 0.02, 0, 0, -0.55));
      out.push(B("sec", W * 0.18, H * 0.12, D * 0.2, 0, H * 0.48, 0.02));
      break;
    case "beak":
      out.push(mass(r, "prim", W * 0.8, H * 0.75, D * 0.65, 0, 0.08, -0.04));
      out.push(N("prim", 0.02, W * 0.28, H * 0.7, 0, -0.08, D * 0.28, Math.PI / 2, 0, 0));
      out.push(B("dark", W * 0.3, H * 0.1, D * 0.16, 0, -0.06, D * 0.42));
      break;
    case "clam":
      out.push(mass(r, "prim", W * 0.95, H * 0.42, D * 0.8, 0, H * 0.18, 0.02, -0.18, 0, 0));
      out.push(mass(r, "prim", W * 0.85, H * 0.4, D * 0.7, 0, -H * 0.18, 0.04, 0.22, 0, 0));
      out.push(B("dark", W * 0.5, H * 0.08, D * 0.2, 0, 0, D * 0.28));
      break;
    case "plow":
      out.push(mass(r, "prim", W * 0.7, H * 0.9, D * 0.55, 0, 0.04, -0.06));
      out.push(B("sec", W * 1.05, H * 0.55, D * 0.22, 0, 0.02, D * 0.28, 0.5, 0, 0));
      out.push(B("dark", W * 0.4, H * 0.12, D * 0.16, 0, -H * 0.2, D * 0.35));
      break;
    case "tower":
      stack(Math.max(4, layers), 0.22, 0.01, 0.12);
      out.push(mass(r, "sec", W * 0.9, H * 0.16, D * 0.7, 0, H * 0.52, 0));
      out.push(mass(r, "prim", W * 0.5, H * 0.22, D * 0.5, 0, -H * 0.4, 0.04));
      break;
    case "mask":
      out.push(mass(r, "prim", W * 0.7, H * 0.85, D * 0.45, 0, 0.04, -0.08));
      out.push(B("sec", W * 0.95, H * 0.95, D * 0.14, 0, 0.02, D * 0.22));
      out.push(B("dark", W * 0.55, H * 0.12, D * 0.08, 0, -H * 0.28, D * 0.28));
      break;
    case "cap":
      if (r.quad === "SS") out.push(poly(r, "prim", W * 0.45, W * 0.4, H * 0.7, 0, H * 0.15, 0, 8));
      else out.push(Sp("prim", W * 0.42, 0, H * 0.12, 0, s));
      out.push(mass(r, "sec", W * 0.85, H * 0.18, D * 0.7, 0, -H * 0.22, 0.04));
      out.push(C("dark", W * 0.3, W * 0.3, H * 0.12, 0, -H * 0.08, D * 0.2, Math.PI / 2, 0, 0, s));
      break;
    case "ram":
      out.push(mass(r, "prim", W * 0.78, H * 0.85, D * 0.7, 0, 0.04, 0));
      out.push(C("sec", 0.05, 0.035, 0.22, 0.18, 0.02, D * 0.18, Math.PI / 2, 0.45, 0, s));
      out.push(C("sec", 0.05, 0.035, 0.22, -0.18, 0.02, D * 0.18, Math.PI / 2, -0.45, 0, s));
      if (r.quad === "RS") {
        out.push(N("acc", 0.008, 0.028, 0.1, 0.18, 0.02, D * 0.32, Math.PI / 2, 0.45, 0));
        out.push(N("acc", 0.008, 0.028, 0.1, -0.18, 0.02, D * 0.32, Math.PI / 2, -0.45, 0));
      }
      break;
    case "ridge":
      stack(layers, 0.2, 0.02, 0);
      out.push(B("trim", 0.06, H * 1.15, D * 0.45, 0, H * 0.2, -0.02));
      out.push(B("acc", 0.04, H * 0.3, D * 0.12, 0, H * 0.55, 0.02));
      break;
    case "facet": {
      const n = 2 + Math.floor(r.density / 4);
      const cell = W / n;
      for (let ix = 0; ix < n; ix++) {
        for (let iy = 0; iy < n; iy++) {
          const px = (ix - (n - 1) / 2) * cell * 0.85;
          const py = (iy - (n - 1) / 2) * (H / n) * 1.4;
          out.push(mass(r, (ix + iy) % 2 ? "sec" : "prim", cell * 0.78, (H / n) * 1.1, D * (0.55 + iy * 0.08), px, py, iy * 0.015));
        }
      }
      break;
    }
    case "hawk":
      out.push(mass(r, "prim", W * 0.7, H * 0.85, D * 0.6, 0, 0.04, 0.04));
      out.push(B("sec", 0.08, H * 0.45, D * 0.7, 0.18, 0.08, -0.12, 0.15, 0.55, 0));
      out.push(B("sec", 0.08, H * 0.45, D * 0.7, -0.18, 0.08, -0.12, 0.15, -0.55, 0));
      out.push(B("dark", W * 0.4, H * 0.1, D * 0.2, 0, -H * 0.28, D * 0.2));
      break;
    case "cage":
      out.push(mass(r, "dark", W * 0.55, H * 0.7, D * 0.5, 0, 0, 0));
      out.push(B("metal", W * 0.9, 0.04, D * 0.7, 0, H * 0.38, 0));
      out.push(B("metal", W * 0.9, 0.04, D * 0.7, 0, -H * 0.32, 0));
      out.push(B("metal", 0.04, H, D * 0.7, 0.18, 0, 0));
      out.push(B("metal", 0.04, H, D * 0.7, -0.18, 0, 0));
      out.push(B("metal", 0.04, H * 0.7, D * 0.04, 0, 0, D * 0.35));
      break;
    default:
      stack(layers, 0.28, 0.03, 0);
  }

  out.push(...densitySeams(r, W, H, D, D * 0.32));
  if (r.ornate) out.push(...helmOrnament(r, W, H, D));
  out.push(...rsNubs(r, r.ornate ? [[0.12, H * 0.3, D * 0.1, 0.08], [-0.12, H * 0.3, D * 0.1, 0.08]] : []));
  return out;
}

function brow(r: Recipe): Spec[] {
  const w = 0.24 * r.head;
  if (r.helm === "shelf") return [B("prim", w * 1.35, 0.035, 0.12, 0, 0.01, 0.04)];
  if (r.helm === "mask") return [B("sec", w * 1.2, 0.03, 0.06, 0, 0.02, 0.02)];
  if (r.quad === "RR") return [C("prim", w * 0.5, w * 0.5, 0.035, 0, 0, 0, Math.PI / 2, 0, 0, r.segs)];
  return [B("prim", w, 0.035, 0.07, 0, 0, 0), B("dark", w * 0.85, 0.014, 0.03, 0, -0.016, 0.02)];
}

function eye(r: Recipe): Spec[] {
  if (r.visor === "mono" || r.visor === "dome" || r.visor === "visorGem") {
    return [Sp("visor", 0.038 * r.head, 0, 0, 0.01, r.segs), B("glow", 0.02, 0.02, 0.016, 0, 0, 0.025)];
  }
  if (r.quad === "SS") return [B("visor", 0.055, 0.03, 0.026, 0, 0, 0), B("dark", 0.06, 0.01, 0.018, 0, 0.018, 0)];
  if (r.quad === "RR") return [Sp("visor", 0.028, 0, 0, 0.01, r.segs)];
  return [B("visor", 0.05, 0.036, 0.026, 0, 0, 0), Sp("glow", 0.01, 0, 0, 0.018, r.segs)];
}

function nose(r: Recipe): Spec[] {
  if (r.helm === "snout") return [mass(r, "prim", 0.07, 0.05, 0.12, 0, 0, 0.04), B("dark", 0.04, 0.025, 0.05, 0, -0.01, 0.08)];
  if (r.helm === "beak") return [N("prim", 0.01, 0.035, 0.09, 0, -0.01, 0.03, Math.PI / 2, 0, 0)];
  if (r.helm === "arrow") return [B("acc", 0.035, 0.045, 0.05, 0, 0, 0.02, 0.25, 0, 0)];
  if (r.quad === "RR") return [Sp("prim", 0.032, 0, 0, 0.016, r.segs)];
  return [B("prim", 0.04, 0.035, 0.055, 0, 0, 0.018)];
}

function mouth(r: Recipe): Spec[] {
  if (r.helm === "beak" || r.helm === "snout") return [B("dark", 0.07 * r.head, 0.02, 0.04, 0, 0, 0.02)];
  return [B("dark", 0.1 * r.head, 0.022, 0.035, 0, 0, 0), B("prim", 0.12 * r.head, 0.035, 0.045, 0, -0.028, -0.01)];
}

function jaw(r: Recipe): Spec[] {
  if (r.helm === "trap" || r.helm === "wedge") return [mass(r, "prim", 0.16 * r.head, 0.07, 0.16, 0, 0, 0.02), B("dark", 0.08, 0.03, 0.08, 0, -0.02, 0.06)];
  if (r.quad === "SS") return [B("prim", 0.2 * r.head, 0.075, 0.13, 0, 0, 0)];
  return [mass(r, "prim", 0.2 * r.head, 0.075, 0.13, 0, 0, 0)];
}

function ear(r: Recipe): Spec[] {
  if (r.helm === "hawk") return [B("prim", 0.04, 0.12, 0.16, 0, 0.02, -0.04, 0.2, 0.4, 0)];
  if (r.quad === "RR") return [Sp("prim", 0.045, 0, 0, 0, r.segs), C("dark", 0.018, 0.018, 0.035, 0, 0, 0.028, Math.PI / 2, 0, 0, r.segs)];
  if (r.quad === "RS" && r.ornate) return [B("prim", 0.045, 0.1, 0.07, 0, 0, 0), N("acc", 0.006, 0.02, 0.08, 0.02, 0.06, 0)];
  return [B("prim", 0.045, 0.09, 0.07, 0, 0, 0), C("dark", 0.016, 0.016, 0.035, 0, 0.02, 0.028, Math.PI / 2, 0, 0, r.segs)];
}

function visor(r: Recipe): Spec[] {
  const w = r.head;
  const s = r.segs;
  switch (r.visor) {
    case "mono":
      return r.quad === "SS"
        ? [B("visor", 0.12 * w, 0.09 * w, 0.045, 0, 0, 0.02), B("glow", 0.04, 0.04, 0.025, 0, 0, 0.045)]
        : [Sp("visor", 0.065 * w, 0, 0, 0.02, s), B("glow", 0.035, 0.035, 0.025, 0, 0, 0.045)];
    case "dual":
      return [B("visor", 0.065 * w, 0.065 * w, 0.035, -0.08, 0, 0), B("visor", 0.065 * w, 0.065 * w, 0.035, 0.08, 0, 0)];
    case "bar":
      return [B("visor", 0.32 * w, 0.04, 0.035, 0, 0, 0), B("dark", 0.34 * w, 0.014, 0.045, 0, 0.032, 0)];
    case "thin":
      return [B("visor", 0.26 * w, 0.024, 0.028, 0, 0.01, 0)];
    case "recess":
      return [B("dark", 0.2 * w, 0.055, 0.028, 0, 0, 0), B("visor", 0.11 * w, 0.026, 0.018, 0, 0, 0.01)];
    case "tee":
      return [B("visor", 0.28 * w, 0.03, 0.03, 0, 0.02, 0), B("visor", 0.045, 0.09 * w, 0.03, 0, -0.03, 0)];
    case "notch":
      return [B("visor", 0.22 * w, 0.045, 0.03, 0, 0, 0), B("dark", 0.05, 0.06, 0.02, 0, -0.02, 0.01)];
    case "plus":
      return [B("visor", 0.2 * w, 0.028, 0.03, 0, 0, 0), B("visor", 0.028, 0.12 * w, 0.03, 0, 0, 0)];
    case "window":
      return [B("dark", 0.24 * w, 0.1 * w, 0.025, 0, 0, 0), B("visor", 0.09 * w, 0.07 * w, 0.02, -0.05, 0, 0.01), B("visor", 0.09 * w, 0.07 * w, 0.02, 0.05, 0, 0.01)];
    case "penta":
      return [C("visor", 0.09 * w, 0.09 * w, 0.04, 0, 0, 0, Math.PI / 2, 0, 0, 5)];
    case "strip":
      return [B("visor", 0.3 * w, 0.02, 0.025, 0, 0.02, 0), B("visor", 0.3 * w, 0.02, 0.025, 0, -0.02, 0)];
    case "dome":
      return [C("visor", 0.1 * w, 0.1 * w, 0.05, 0, 0, 0, Math.PI / 2, 0, 0, s)];
    case "visorV":
      return [B("visor", 0.12 * w, 0.05, 0.03, 0.06, 0, 0, 0, 0, 0.5), B("visor", 0.12 * w, 0.05, 0.03, -0.06, 0, 0, 0, 0, -0.5)];
    case "visorX":
      return [B("visor", 0.18 * w, 0.03, 0.03, 0, 0, 0, 0, 0, 0.7), B("visor", 0.18 * w, 0.03, 0.03, 0, 0, 0, 0, 0, -0.7)];
    case "diamond":
      return [B("visor", 0.1 * w, 0.1 * w, 0.035, 0, 0, 0, 0, 0, Math.PI / 4)];
    case "visorHex":
      return [C("visor", 0.08 * w, 0.08 * w, 0.04, 0, 0, 0, Math.PI / 2, 0, 0, 6)];
    case "visorBar2":
      return [B("visor", 0.3 * w, 0.03, 0.03, 0, 0.025, 0), B("visor", 0.22 * w, 0.03, 0.03, 0, -0.025, 0)];
    case "visorCrest":
      return [B("visor", 0.08 * w, 0.14 * w, 0.035, 0, 0.02, 0), B("glow", 0.03, 0.06, 0.02, 0, 0.04, 0.02)];
    case "visorSplit":
      return [B("visor", 0.1 * w, 0.07 * w, 0.03, -0.07, 0.01, 0), B("visor", 0.1 * w, 0.07 * w, 0.03, 0.07, 0.01, 0), B("dark", 0.04, 0.08, 0.02, 0, 0, 0)];
    case "visorRing":
      return [{ t: "torus", m: "visor", s: [0.08 * w, 0.016, 0], p: [0, 0, 0.01], r: [Math.PI / 2, 0, 0] }];
    case "visorGem":
      return [{ t: "octa", m: "visor", s: [0.055 * w, 0, 0], p: [0, 0, 0.02] }];
    case "visorMask":
      return [B("visor", 0.28 * w, 0.12 * w, 0.03, 0, 0, 0), B("dark", 0.06, 0.04, 0.02, -0.06, 0.02, 0.015), B("dark", 0.06, 0.04, 0.02, 0.06, 0.02, 0.015)];
    case "visorArrow":
      return [B("visor", 0.08, 0.1 * w, 0.03, 0, 0.02, 0, 0, 0, 0), B("visor", 0.14 * w, 0.04, 0.03, 0.07, -0.02, 0, 0, 0, 0.45), B("visor", 0.14 * w, 0.04, 0.03, -0.07, -0.02, 0, 0, 0, -0.45)];
    case "visorWide":
      return [B("visor", 0.38 * w, 0.055, 0.04, 0, 0, 0), B("glow", 0.12, 0.02, 0.02, 0, 0, 0.02)];
    default:
      return [B("visor", 0.2 * w, 0.05, 0.03, 0, 0, 0)];
  }
}

function vfin(r: Recipe): Spec[] {
  if (!r.ornate || r.crest === "none") return [];
  switch (r.crest) {
    case "horn":
      return [N("acc", 0.014, 0.036, 0.15, 0.09, 0.05, 0), N("acc", 0.014, 0.036, 0.15, -0.09, 0.05, 0)];
    case "halo":
      return r.quad === "SS"
        ? [B("trim", 0.2, 0.028, 0.2, 0, 0.1, 0)]
        : [C("trim", 0.14, 0.14, 0.028, 0, 0.1, 0, 0, 0, 0, r.segs)];
    case "mast":
      return [B("metal", 0.022, 0.22, 0.045, 0, 0.1, -0.02), B("acc", 0.035, 0.035, 0.035, 0, 0.22, 0)];
    case "crown":
      return [B("trim", 0.18, 0.05, 0.06, 0, 0.08, 0), B("acc", 0.025, 0.1, 0.025, 0.06, 0.12, 0), B("acc", 0.025, 0.1, 0.025, -0.06, 0.12, 0)];
    case "twin":
      return [B("prim", 0.025, 0.2, 0.12, 0.055, 0.08, 0, 0, 0, 0.4), B("prim", 0.025, 0.2, 0.12, -0.055, 0.08, 0, 0, 0, -0.4)];
    case "fin":
      return [B("trim", 0.028, 0.18, 0.1, 0, 0.12, -0.02, 0.15, 0, 0)];
    case "ram":
      return [N("acc", 0.018, 0.04, 0.16, 0.1, 0.03, -0.03, 0.85, 0.45, 0), N("acc", 0.018, 0.04, 0.16, -0.1, 0.03, -0.03, 0.85, -0.45, 0)];
    case "wing":
      return [B("prim", 0.03, 0.1, 0.18, 0.12, 0.05, 0, 0.25, 0.55, 0), B("prim", 0.03, 0.1, 0.18, -0.12, 0.05, 0, 0.25, -0.55, 0)];
    case "teeth":
      return [B("acc", 0.025, 0.08, 0.025, 0.05, 0.1, 0.02), B("acc", 0.025, 0.1, 0.025, 0, 0.11, 0.02), B("acc", 0.025, 0.08, 0.025, -0.05, 0.1, 0.02)];
    case "plow":
      return [B("prim", 0.13, 0.07, 0.14, 0, -0.02, 0.07, 0.4, 0, 0)];
    case "cloak":
      return [B("sec", 0.18, 0.07, 0.12, 0, 0.02, -0.08, -0.3, 0, 0)];
    case "blade":
      return [B("metal", 0.02, 0.2, 0.08, 0, 0.12, 0.02, 0.1, 0, 0)];
    case "spike":
      return [N("acc", 0.01, 0.03, 0.14, 0, 0.12, 0)];
    default:
      return [];
  }
}

function antenna(r: Recipe): Spec[] {
  const s = r.segs;
  if (!r.ornate) {
    const k = r.rank % 4;
    if (k === 0) return [B("metal", 0.018, 0.08, 0.018, 0, 0.02, 0)];
    if (k === 1) return [C("metal", 0.01, 0.008, 0.1, 0, 0.04, 0, 0, 0, 0, s)];
    if (k === 2) return [B("metal", 0.014, 0.12, 0.02, 0, 0.04, 0, 0, 0, 0.2)];
    return [B("dark", 0.03, 0.04, 0.03, 0, 0.01, 0)];
  }
  const i = r.rank - 12;
  if (i === 0) return [C("metal", 0.012, 0.01, 0.2, 0, 0.08, 0, 0, 0, 0, s), Sp("acc", 0.02, 0, 0.18, 0, s)];
  if (i === 1) return [B("metal", 0.02, 0.18, 0.03, 0, 0.08, 0), B("acc", 0.03, 0.03, 0.03, 0, 0.18, 0)];
  if (i === 2) return [C("metal", 0.01, 0.01, 0.16, 0.03, 0.06, 0, 0, 0, 0.3, s)];
  if (i === 3) return [{ t: "torus", m: "trim", s: [0.04, 0.01, 0], p: [0, 0.08, 0] }];
  if (i === 4) return [N("metal", 0.006, 0.018, 0.14, 0, 0.08, 0)];
  if (i === 5) return [B("trim", 0.04, 0.14, 0.02, 0, 0.06, 0)];
  if (i === 6) return [C("metal", 0.014, 0.01, 0.12, 0, 0.05, 0, 0, 0, 0, s), B("visor", 0.03, 0.03, 0.03, 0, 0.12, 0)];
  if (i === 7) return [B("metal", 0.016, 0.1, 0.04, 0, 0.04, 0, 0.3, 0, 0)];
  if (i === 8) return [C("metal", 0.008, 0.008, 0.18, 0, 0.08, 0, 0.4, 0, 0, s)];
  if (i === 9) return [B("acc", 0.025, 0.16, 0.025, 0, 0.07, 0)];
  if (i === 10) return [Sp("metal", 0.025, 0, 0.06, 0, s), C("metal", 0.008, 0.008, 0.1, 0, 0.12, 0, 0, 0, 0, s)];
  if (i === 11) return [B("prim", 0.03, 0.12, 0.08, 0, 0.05, -0.02, 0.2, 0.3, 0)];
  return [B("metal", 0.02, 0.14, 0.02, 0, 0.06, 0), C("glow", 0.012, 0.012, 0.04, 0, 0.14, 0, 0, 0, 0, s)];
}

function cheek(r: Recipe): Spec[] {
  if (r.helm === "trap" || r.helm === "anvil") return [B("prim", 0.1 * r.head, 0.14, 0.16, 0, 0, 0), B("acc", 0.035, 0.07, 0.16, 0.04, 0, 0.02)];
  if (r.helm === "split") return [mass(r, "prim", 0.07 * r.head, 0.14, 0.12, 0, 0.02, 0)];
  if (r.curve > 0.65) return [Sp("prim", 0.065 * r.head, 0, 0, 0, r.segs)];
  return [mass(r, "prim", 0.075 * r.head, 0.11, 0.13, 0, 0, 0), B("dark", 0.035, 0.07, 0.05, 0, 0, 0.055)];
}

function chin(r: Recipe): Spec[] {
  if (r.helm === "snout" || r.helm === "beak" || r.helm === "hood") return [B("prim", 0.13 * r.head, 0.07, 0.16, 0, 0, 0.04), B("dark", 0.07, 0.04, 0.09, 0, -0.02, 0.09)];
  if (r.helm === "plow") return [B("prim", 0.16 * r.head, 0.06, 0.14, 0, 0, 0.05, 0.35, 0, 0)];
  return [mass(r, "prim", 0.17 * r.head, 0.07, 0.11, 0, 0, 0)];
}

function collar(r: Recipe): Spec[] {
  const w = 0.4 * r.shoulder;
  return [mass(r, "prim", w, 0.1 * r.torso, 0.28, 0, 0, 0), B("sec", w * 0.7, 0.06, 0.12, 0, 0.04, 0.1), C("joint", 0.07, 0.07, 0.08, 0, 0.06, 0, 0, 0, 0, r.segs)];
}

function chestCore(r: Recipe): Spec[] {
  const W = 0.44 * r.torso * (r.canon === "brute" || r.canon === "heavy" ? 1.15 : r.canon === "stalker" ? 0.82 : 1);
  const H = 0.36 * r.torso;
  const D = 0.28 * r.torso;
  const s = r.segs;
  const out: Spec[] = [];
  switch (r.chest) {
    case "plow":
      out.push(mass(r, "prim", W, H, D, 0, 0, 0), B("sec", W * 0.4, H * 0.55, 0.07, 0, 0.04, D * 0.48), B("dark", W * 0.28, 0.07, 0.07, 0, -0.1, D * 0.38));
      break;
    case "wedge":
      out.push(mass(r, "prim", W * 0.85, H, D * 1.08, 0, 0, 0, 0.28, 0, 0), B("sec", 0.09, H * 0.75, D * 0.55, 0.18, 0, 0.04, 0, 0, 0.2), B("sec", 0.09, H * 0.75, D * 0.55, -0.18, 0, 0.04, 0, 0, -0.2));
      break;
    case "hex":
      out.push(poly(r, "prim", W * 0.42, W * 0.38, H, 0, 0, 0, 6), B("sec", W * 0.3, H * 0.2, D * 0.3, 0, 0.08, D * 0.3));
      break;
    case "rib":
      out.push(mass(r, "prim", W * 0.8, H, D * 0.82, 0, 0, 0));
      for (let i = 0; i < 2 + Math.floor(r.density / 4); i++) out.push(B("sec", W * 0.95, 0.035, D * 0.48, 0, -0.1 + i * 0.07, D * 0.18));
      break;
    case "slim":
      out.push(mass(r, "prim", W * 0.68, H * 1.05, D * 0.72, 0, 0, 0), B("sec", 0.07, H * 0.65, D * 0.35, 0.13, 0, 0.05), B("sec", 0.07, H * 0.65, D * 0.35, -0.13, 0, 0.05));
      break;
    case "bulk":
      out.push(mass(r, "prim", W * 1.15, H * 1.08, D * 1.08, 0, 0, 0), B("metal", W * 1.02, 0.05, D, 0, -H * 0.4, 0), B("acc", 0.09, 0.09, 0.07, 0, 0.06, D * 0.48));
      break;
    case "shield":
      out.push(mass(r, "prim", W * 1.05, H * 1.05, D * 0.68, 0, 0, 0.04), B("metal", W * 0.38, H * 0.48, 0.09, 0, 0.04, D * 0.42));
      break;
    case "cage":
      out.push(B("dark", W * 0.68, H * 0.82, D * 0.55, 0, 0, 0), B("metal", W, 0.035, D, 0, H * 0.4, 0), B("metal", W, 0.035, D, 0, -H * 0.35, 0), B("metal", 0.035, H, D, 0.18, 0, 0), B("metal", 0.035, H, D, -0.18, 0, 0));
      break;
    case "core":
      out.push(mass(r, "prim", W * 0.9, H, D, 0, 0, 0), Sp("visor", 0.065, 0, 0.04, D * 0.42, s), B("sec", W * 0.28, H * 0.38, 0.07, 0, 0.02, D * 0.32));
      break;
    case "barrel":
      out.push(poly(r, "prim", W * 0.42, W * 0.4, H, 0, 0, 0), C("acc", 0.07, 0.07, 0.055, 0, 0.04, D * 0.42, Math.PI / 2, 0, 0, s));
      break;
    case "slab":
      out.push(B("prim", W * 1.08, H * 0.85, D * 0.55, 0, 0, 0.02), B("sec", W * 0.7, H * 0.12, D * 0.2, 0, H * 0.28, D * 0.2));
      break;
    case "peak":
      out.push(mass(r, "prim", W * 0.85, H * 0.7, D * 0.8, 0, -0.04, 0), N("prim", 0.04, W * 0.42, H * 0.55, 0, H * 0.28, 0));
      break;
    case "fortress":
      out.push(mass(r, "prim", W, H, D, 0, 0, 0), B("sec", 0.1, H * 0.9, 0.1, W * 0.48, 0.04, 0.06), B("sec", 0.1, H * 0.9, 0.1, -W * 0.48, 0.04, 0.06), B("metal", W * 0.4, 0.06, D * 0.6, 0, H * 0.42, 0));
      break;
    case "reactor":
      out.push(mass(r, "prim", W * 0.9, H, D, 0, 0, 0), Sp("glow", 0.08, 0, 0.02, D * 0.4, s), C("trim", 0.12, 0.12, 0.03, 0, 0.02, D * 0.38, Math.PI / 2, 0, 0, s));
      break;
    case "grate":
      out.push(mass(r, "prim", W, H, D * 0.75, 0, 0, 0));
      for (let i = 0; i < 3 + Math.floor(r.density / 4); i++) out.push(B("dark", W * 0.7, 0.02, D * 0.4, 0, -H * 0.3 + i * 0.08, D * 0.28));
      break;
    case "crystal":
      out.push(mass(r, "prim", W * 0.75, H * 0.7, D * 0.7, 0, -0.04, 0), { t: "octa", m: "acc", s: [0.1, 0, 0], p: [0, H * 0.2, D * 0.25] });
      break;
    case "hump":
      out.push(mass(r, "prim", W * 0.8, H * 0.7, D * 0.7, 0, -0.04, 0), Sp("prim", 0.12, 0.1, 0.08, 0.04, s), Sp("prim", 0.1, -0.1, 0.06, 0.04, s));
      break;
    case "delta":
      out.push(C("prim", 0.04, W * 0.5, H * 1.05, 0, 0, 0, 0, 0, 0, 3), B("sec", W * 0.3, 0.06, D * 0.4, 0, -H * 0.3, D * 0.15));
      break;
    case "lattice":
      out.push(B("dark", W * 0.6, H * 0.7, D * 0.45, 0, 0, 0), B("metal", W, 0.04, 0.04, 0, H * 0.25, D * 0.2), B("metal", W, 0.04, 0.04, 0, -H * 0.2, D * 0.2), B("metal", 0.04, H, 0.04, 0.14, 0, D * 0.2), B("metal", 0.04, H, 0.04, -0.14, 0, D * 0.2));
      break;
    case "boiler":
      out.push(C("prim", 0.1, 0.1, 0.28, 0.1, 0, 0, Math.PI / 2, 0, 0, s), C("prim", 0.1, 0.1, 0.28, -0.1, 0, 0, Math.PI / 2, 0, 0, s), B("metal", W * 0.7, 0.08, D * 0.4, 0, 0.12, 0));
      break;
    case "armature":
      out.push(B("dark", W * 0.5, H * 0.6, D * 0.4, 0, 0, 0), C("joint", 0.05, 0.05, 0.12, 0.16, 0.08, 0, 0, 0, Math.PI / 2, s), C("joint", 0.05, 0.05, 0.12, -0.16, 0.08, 0, 0, 0, Math.PI / 2, s), B("metal", 0.04, H * 0.8, 0.04, 0.1, 0, 0.08), B("metal", 0.04, H * 0.8, 0.04, -0.1, 0, 0.08));
      break;
    case "altar": {
      const n = 2 + Math.floor(r.density / 4);
      for (let i = 0; i < n; i++) {
        const t = i / n;
        out.push(mass(r, i % 2 ? "sec" : "prim", W * (1 - t * 0.3), H / n + 0.02, D * (1 - t * 0.15), 0, H * 0.35 - t * H, t * 0.02));
      }
      break;
    }
    case "carapace":
      out.push(mass(r, "prim", W * 1.05, H * 0.5, D * 0.9, 0, H * 0.15, 0.04, -0.2, 0, 0), mass(r, "sec", W * 0.9, H * 0.5, D * 0.75, 0, -H * 0.15, 0.02, 0.15, 0, 0));
      break;
    case "turbine":
      out.push(mass(r, "prim", W * 0.85, H, D * 0.7, 0, 0, 0), C("metal", 0.12, 0.12, 0.04, 0, 0.04, D * 0.35, Math.PI / 2, 0, 0, s), B("trim", 0.04, 0.16, 0.04, 0.08, 0.04, D * 0.38), B("trim", 0.04, 0.16, 0.04, -0.08, 0.04, D * 0.38));
      break;
    case "wingbox":
      out.push(mass(r, "prim", W * 0.75, H, D, 0, 0, 0), B("sec", 0.16, 0.08, 0.28, 0.22, 0.06, -0.04, 0.2, 0.4, 0), B("sec", 0.16, 0.08, 0.28, -0.22, 0.06, -0.04, 0.2, -0.4, 0));
      break;
    default:
      out.push(mass(r, "prim", W, H, D, 0, 0, 0));
  }
  out.push(...densitySeams(r, W, H, D, D * 0.4));
  if (r.quad === "RS" && r.ornate) {
    out.push(N("acc", 0.008, 0.022, 0.1, W * 0.42, H * 0.2, 0.04));
    out.push(N("acc", 0.008, 0.022, 0.1, -W * 0.42, H * 0.2, 0.04));
  }
  return out;
}

function pec(r: Recipe): Spec[] {
  const w = 0.18 * r.torso;
  const out: Spec[] = [];
  if (r.chest === "bulk" || r.canon === "heavy") {
    out.push(B("prim", w * 1.15, 0.26, 0.16, 0, 0, 0), B("metal", 0.07, 0.18, 0.18, 0.05, 0, 0.02));
  } else if (r.curve > 0.6) {
    out.push(Sp("prim", 0.09, 0, 0, 0, r.segs), C("dark", 0.045, 0.045, 0.07, 0, 0.04, 0.05, Math.PI / 2, 0, 0, r.segs));
  } else {
    out.push(mass(r, "prim", w, 0.22, 0.13, 0, 0, 0), B("sec", 0.1, 0.05, 0.07, 0, 0.05, 0.05));
  }
  out.push(...densitySeams(r, w, 0.22, 0.13, 0.06));
  return out;
}

function cockpit(r: Recipe): Spec[] {
  if (r.chest === "core" || r.chest === "reactor" || r.visor === "mono") return [Sp("acc", 0.055, 0, 0, 0, r.segs)];
  if (r.curve > 0.5) return [C("acc", 0.055, 0.055, 0.035, 0, 0, 0, Math.PI / 2, 0, 0, r.segs)];
  return [B("acc", 0.09, 0.09, 0.045, 0, 0, 0), B("trim", 0.05, 0.05, 0.035, 0, 0, 0.018)];
}

function abdomen(r: Recipe): Spec[] {
  const h = r.canon === "runner" || r.canon === "stalker" ? 0.26 : r.canon === "brute" ? 0.16 : 0.22;
  const w = 0.32 * r.torso;
  return [
    mass(r, "prim", w, h * r.height, 0.2, 0, 0, 0),
    B("dark", 0.16, h * 0.45, 0.07, 0, 0, 0.09),
    C("joint", 0.045, 0.045, 0.09, 0.09, 0, 0, 0, 0, Math.PI / 2, r.segs),
    C("joint", 0.045, 0.045, 0.09, -0.09, 0, 0, 0, 0, Math.PI / 2, r.segs),
    ...densitySeams(r, w, h, 0.2, 0.1),
  ];
}

function pelvis(r: Recipe): Spec[] {
  const w = 0.34 * r.hip;
  return [
    mass(r, "prim", w, 0.13, 0.22, 0, 0, 0),
    B("sec", 0.18, 0.07, 0.1, 0, -0.02, 0.07),
    C("joint", 0.065, 0.065, 0.09, 0.11, -0.04, 0, 0, 0, Math.PI / 2, r.segs),
    C("joint", 0.065, 0.065, 0.09, -0.11, -0.04, 0, 0, 0, Math.PI / 2, r.segs),
    ...densitySeams(r, w, 0.13, 0.22, 0.1),
  ];
}

function skirtF(r: Recipe): Spec[] {
  if (r.canon === "knight") return [B("prim", 0.26, 0.28, 0.08, 0, -0.08, 0, 0.2, 0, 0), B("trim", 0.1, 0.16, 0.06, 0, -0.06, 0.03)];
  if (r.chest === "slim") return [B("prim", 0.18, 0.2, 0.05, 0, -0.05, 0, 0.35, 0, 0)];
  return [mass(r, "prim", 0.24 * r.hip, 0.18, 0.08, 0, -0.04, 0, 0.15, 0, 0)];
}

function skirtB(r: Recipe): Spec[] {
  return [mass(r, "prim", 0.22 * r.hip, r.canon === "knight" ? 0.24 : 0.16, 0.08, 0, -0.02, 0)];
}

function skirtS(r: Recipe): Spec[] {
  if (r.canon === "heavy") return [B("prim", 0.1, 0.24, 0.22, 0, -0.06, 0), B("acc", 0.06, 0.16, 0.16, 0.04, -0.04, 0)];
  return [mass(r, "prim", 0.08, 0.18, 0.18, 0, -0.04, 0)];
}

function shoulder(r: Recipe): Spec[] {
  const s = r.shoulder;
  const t = r.thick;
  const sg = r.segs;
  switch (r.limb) {
    case "capsule":
      return [Sp("prim", 0.13 * t * s, 0, 0.04, 0, sg), B("sec", 0.15 * s, 0.07, 0.15, 0, 0.11, 0)];
    case "blade":
      return [B("prim", 0.15 * s, 0.13 * t, 0.22, 0.02, 0.04, 0), B("acc", 0.045, 0.18, 0.26, 0.08, 0.08, -0.04, 0.5, 0, 0)];
    case "block":
      return [B("prim", 0.26 * s, 0.2 * t, 0.3, 0.04, 0.04, 0), B("metal", 0.11, 0.13, 0.32, 0.12, 0.08, 0)];
    case "frame":
      return [B("metal", 0.2 * s, 0.035, 0.22, 0.02, 0.1, 0), B("metal", 0.035, 0.15, 0.22, 0.1, 0.02, 0), B("metal", 0.035, 0.15, 0.22, -0.06, 0.02, 0), B("dark", 0.11, 0.09, 0.11, 0, 0, 0)];
    case "pipe":
      return [C("prim", 0.12 * t, 0.14 * t, 0.17 * s, 0, 0.02, 0, 0, 0, Math.PI / 2, sg), B("acc", 0.09, 0.09, 0.18, 0.05, 0.1, 0)];
    case "plate":
      return [mass(r, "prim", 0.22 * s, 0.16 * t, 0.26, 0.03, 0.05, 0), B("sec", 0.09, 0.09, 0.2, 0.1, 0.12, 0)];
    case "slab":
      return [B("prim", 0.3 * s, 0.12 * t, 0.28, 0.02, 0.06, 0), B("dark", 0.2, 0.04, 0.2, 0.02, 0.01, 0.02)];
    case "beam":
      return [B("metal", 0.06, 0.2, 0.06, 0.04, 0.04, 0), B("prim", 0.18 * s, 0.1, 0.2, 0, 0.08, 0)];
    case "hinge":
      return [C("joint", 0.08 * t, 0.08 * t, 0.14, 0, 0.02, 0, 0, 0, Math.PI / 2, sg), B("prim", 0.16 * s, 0.1, 0.18, 0.04, 0.08, 0)];
    case "boxer":
      return [B("prim", 0.24 * s, 0.22 * t, 0.24, 0.03, 0.04, 0), B("sec", 0.08, 0.16, 0.08, 0.12, 0.06, 0.06)];
    case "post":
      return [C("prim", 0.08 * t, 0.08 * t, 0.2 * s, 0, 0.04, 0, 0, 0, 0, sg), B("metal", 0.12, 0.04, 0.12, 0, 0.14, 0)];
    case "rail":
      return [B("metal", 0.04, 0.18, 0.22, 0.08, 0.04, 0), B("metal", 0.04, 0.18, 0.22, -0.04, 0.04, 0), B("prim", 0.16, 0.08, 0.16, 0.02, 0.1, 0)];
    case "brick":
      return [B("prim", 0.2 * s, 0.1, 0.2, 0.02, 0.08, 0), B("prim", 0.18 * s, 0.1, 0.18, 0.02, -0.02, 0)];
    case "channel":
      return [B("prim", 0.22 * s, 0.16, 0.06, 0.02, 0.04, 0.08), B("prim", 0.22 * s, 0.16, 0.06, 0.02, 0.04, -0.08), B("dark", 0.1, 0.1, 0.12, 0, 0, 0)];
    case "claw":
      return [mass(r, "prim", 0.18 * s, 0.16, 0.2, 0.02, 0.04, 0), N("acc", 0.01, 0.03, 0.12, 0.1, 0.1, 0.04, 0.5, 0, 0)];
    case "piston":
      return [C("metal", 0.05, 0.05, 0.18, 0.04, 0.04, 0, 0, 0, 0, sg), C("prim", 0.08, 0.07, 0.12, 0, 0.02, 0, 0, 0, Math.PI / 2, sg)];
    case "armor":
      return [B("prim", 0.28 * s, 0.18, 0.3, 0.04, 0.06, 0), B("sec", 0.12, 0.12, 0.12, 0.1, 0.12, 0.06), B("trim", 0.06, 0.06, 0.2, 0.12, 0.04, -0.04)];
    case "spike":
      return [mass(r, "prim", 0.2 * s, 0.16, 0.22, 0.02, 0.04, 0), N("acc", 0.008, 0.03, 0.14, 0.08, 0.12, 0)];
    case "ribbon":
      return [B("trim", 0.04, 0.2, 0.28, 0.1, 0.06, 0, 0.3, 0.2, 0), mass(r, "prim", 0.16 * s, 0.12, 0.18, 0, 0.02, 0)];
    case "tanked":
      return [C("prim", 0.09, 0.09, 0.2, 0.04, 0.04, 0, Math.PI / 2, 0, 0, sg), B("metal", 0.16, 0.08, 0.12, 0, 0.1, 0)];
    case "lattice":
      return [B("metal", 0.04, 0.18, 0.04, 0.08, 0.04, 0.06), B("metal", 0.04, 0.18, 0.04, 0.08, 0.04, -0.06), B("metal", 0.18, 0.04, 0.16, 0.04, 0.12, 0), B("dark", 0.1, 0.08, 0.1, 0, 0, 0)];
    case "cannon":
      return [C("metal", 0.04, 0.05, 0.22, 0.06, 0.06, 0.06, Math.PI / 2, 0, 0, sg), mass(r, "prim", 0.18 * s, 0.14, 0.18, 0, 0.02, 0)];
    case "pauldron":
      return [B("prim", 0.3 * s, 0.12, 0.32, 0.04, 0.1, 0, -0.2, 0, 0), B("sec", 0.16, 0.1, 0.16, 0.04, 0, 0)];
    case "ornate":
      return [mass(r, "prim", 0.22 * s, 0.16, 0.24, 0.03, 0.05, 0), B("trim", 0.08, 0.08, 0.08, 0.1, 0.1, 0.06), Sp("acc", 0.03, 0.08, 0.12, 0.04, sg)];
    case "talon":
      return [mass(r, "prim", 0.18 * s, 0.14, 0.2, 0.02, 0.04, 0), N("metal", 0.008, 0.025, 0.1, 0.08, 0.02, 0.1, Math.PI / 2, 0, 0), N("metal", 0.008, 0.025, 0.1, 0.08, 0.08, 0.08, Math.PI / 2, 0, 0)];
    default:
      return [mass(r, "prim", 0.22 * s, 0.16 * t, 0.26, 0.03, 0.05, 0), B("sec", 0.09, 0.09, 0.2, 0.1, 0.12, 0), C("joint", 0.065, 0.065, 0.08, -0.06, -0.02, 0, 0, 0, Math.PI / 2, sg)];
  }
}

function upper(r: Recipe): Spec[] {
  const h = (r.canon === "stalker" || r.canon === "runner" ? 0.36 : 0.3) * r.height;
  const rad = 0.08 * r.thick;
  const sg = r.segs;
  const L = r.limb;
  if (L === "block" || L === "brick" || L === "boxer") return [B("prim", rad * 2.4, h, rad * 2.1, 0, 0, 0), B("sec", rad * 2.6, h * 0.35, rad * 1.5, 0.02, 0.04, 0.02)];
  if (L === "frame" || L === "lattice" || L === "rail") return [B("metal", 0.035, h, 0.035, 0.04, 0, 0.03), B("metal", 0.035, h, 0.035, -0.04, 0, -0.03), C("joint", 0.045, 0.045, 0.055, 0, h / 2, 0, 0, 0, 0, sg)];
  if (L === "blade" || L === "spike" || L === "talon") return [B("prim", rad * 1.5, h, rad * 2.6, 0, 0, 0), B("acc", 0.028, h * 0.75, rad * 3, 0.045, 0, 0)];
  if (L === "capsule" || L === "pipe" || L === "piston") return [C("prim", rad, rad - 0.01, h, 0, 0, 0, 0, 0, 0, sg)];
  if (L === "armor" || L === "pauldron" || L === "ornate") return [mass(r, "prim", rad * 2.2, h, rad * 2, 0, 0, 0), B("sec", rad * 1.6, h * 0.4, rad * 2.2, 0, 0.04, 0.04), ...densitySeams(r, rad * 2.2, h, rad * 2, 0.04)];
  return [C("prim", rad, rad - 0.01, h, 0, 0, 0, 0, 0, 0, sg), B("sec", 0.12 * r.thick, h * 0.5, 0.1, 0.04, 0.01, 0.02), ...densitySeams(r, rad * 2, h, rad * 2, 0.03)];
}

function elbow(r: Recipe): Spec[] {
  if (r.curve > 0.5 || r.limb === "capsule") return [Sp("joint", 0.05 * r.thick, 0, 0, 0, r.segs)];
  if (r.limb === "hinge") return [C("joint", 0.05, 0.05, 0.08, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), B("metal", 0.08, 0.04, 0.08, 0, 0.03, 0)];
  return [B("joint", 0.09 * r.thick, 0.07, 0.09, 0, 0, 0.02), B("prim", 0.07, 0.055, 0.07, 0, 0, 0.035)];
}

function forearm(r: Recipe): Spec[] {
  const h = 0.28 * r.height;
  const L = r.limb;
  if (L === "block" || L === "brick" || L === "boxer") return [B("prim", 0.13 * r.thick, h, 0.12, 0, 0, 0), ...densitySeams(r, 0.13 * r.thick, h, 0.12, 0.04)];
  if (L === "blade" || L === "spike") return [B("prim", 0.075, h, 0.15, 0, 0, 0), B("acc", 0.028, h * 0.85, 0.18, 0.04, 0, 0)];
  if (L === "cannon") return [C("metal", 0.04, 0.05, h * 0.9, 0, 0, 0.04, Math.PI / 2, 0, 0, r.segs), B("prim", 0.1, h * 0.5, 0.1, 0, 0.04, -0.04)];
  if (L === "piston") return [C("metal", 0.04, 0.035, h, 0, 0, 0, 0, 0, 0, r.segs), C("prim", 0.055, 0.05, h * 0.4, 0, 0.04, 0, 0, 0, 0, r.segs)];
  return [C("prim", 0.065 * r.thick, 0.055 * r.thick, h, 0, 0, 0, 0, 0, 0, r.segs), B("dark", 0.09, h * 0.5, 0.09, 0.028, 0, 0.01)];
}

function vambrace(r: Recipe): Spec[] {
  if (r.limb === "block" || r.limb === "armor" || r.canon === "heavy") return [B("prim", 0.15 * r.thick, 0.18, 0.15, 0, 0, 0), B("metal", 0.055, 0.14, 0.16, 0.055, 0, 0.02)];
  if (r.limb === "blade" || r.limb === "spike") return [B("prim", 0.09, 0.16, 0.11, 0, 0, 0), B("acc", 0.035, 0.14, 0.14, 0.045, 0, 0.02)];
  if (r.limb === "lattice" || r.limb === "frame") return [B("metal", 0.04, 0.16, 0.04, 0.04, 0, 0.04), B("metal", 0.04, 0.16, 0.04, -0.03, 0, -0.03), B("dark", 0.08, 0.1, 0.08, 0, 0, 0)];
  return [mass(r, "prim", 0.11 * r.thick, 0.15, 0.12, 0, 0, 0), ...densitySeams(r, 0.11 * r.thick, 0.15, 0.12, 0.05)];
}

function hand(r: Recipe): Spec[] {
  if (r.curve > 0.65 || r.canon === "drone" || r.limb === "capsule") return [Sp("prim", 0.065 * r.thick, 0, 0, 0, r.segs)];
  if (r.limb === "claw" || r.limb === "talon") {
    return [mass(r, "prim", 0.07, 0.08, 0.07, 0, 0, 0), N("dark", 0.004, 0.012, 0.08, 0.03, -0.08, 0.03), N("dark", 0.004, 0.012, 0.08, -0.03, -0.08, 0.03), N("dark", 0.004, 0.012, 0.07, 0, -0.08, 0.04)];
  }
  return [
    mass(r, "prim", 0.075, 0.09, 0.075, 0, 0, 0),
    B("dark", 0.028, 0.07, 0.028, 0.02, -0.07, 0.025),
    B("dark", 0.028, 0.07, 0.028, -0.02, -0.07, 0.025),
    B("dark", 0.028, 0.06, 0.028, 0.045, -0.055, 0),
    B("dark", 0.028, 0.06, 0.028, -0.045, -0.055, 0),
  ];
}

function hip(r: Recipe): Spec[] {
  return [C("joint", 0.07 * r.hip, 0.07 * r.hip, 0.1, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), mass(r, "prim", 0.14 * r.hip, 0.12, 0.16, 0, 0.02, 0)];
}

function thigh(r: Recipe): Spec[] {
  const h = (r.canon === "runner" || r.canon === "stalker" ? 0.38 : 0.32) * r.height;
  const rad = 0.075 * r.thick;
  const L = r.limb;
  if (L === "block" || L === "brick" || L === "boxer") return [B("prim", rad * 2.5, h, rad * 2.3, 0, 0, 0), B("sec", rad * 2.1, h * 0.35, rad * 2.6, 0, 0.04, 0.04)];
  if (L === "blade" || L === "spike" || L === "talon") return [B("prim", rad * 1.7, h, rad * 2.5, 0, 0, 0), B("acc", 0.028, h * 0.65, rad * 2.9, 0.045, 0, 0.02)];
  if (L === "frame" || L === "lattice" || L === "rail") return [B("metal", 0.04, h, 0.04, 0.04, 0, 0.03), B("metal", 0.04, h, 0.04, -0.04, 0, -0.03), B("dark", rad * 1.4, h * 0.4, rad * 1.4, 0, 0, 0)];
  if (L === "armor" || L === "ornate" || L === "pauldron") {
    return [mass(r, "prim", rad * 2.3, h, rad * 2.1, 0, 0, 0), B("sec", rad * 1.8, h * 0.3, rad * 2.4, 0, 0.05, 0.04), ...densitySeams(r, rad * 2.3, h, rad * 2.1, 0.05)];
  }
  return [C("prim", rad, rad * 0.88, h, 0, 0, 0, 0, 0, 0, r.segs), B("sec", 0.11 * r.thick, h * 0.45, 0.09, 0, 0.02, 0.035), ...densitySeams(r, rad * 2, h, rad * 2, 0.04)];
}

function knee(r: Recipe): Spec[] {
  if (r.canon === "heavy" || r.limb === "armor") return [B("prim", 0.15 * r.thick, 0.13, 0.15, 0, 0, 0), B("metal", 0.07, 0.09, 0.11, 0, 0.02, 0.055)];
  if (r.curve > 0.55 || r.limb === "capsule") return [Sp("joint", 0.065 * r.thick, 0, 0, 0, r.segs)];
  return [mass(r, "prim", 0.13 * r.thick, 0.11, 0.11, 0, 0, 0), B("sec", 0.07, 0.055, 0.07, 0, 0.02, 0.045)];
}

function shin(r: Recipe): Spec[] {
  const h = 0.3 * r.height;
  const L = r.limb;
  if (L === "block" || L === "brick" || L === "armor") return [B("prim", 0.13 * r.thick, h, 0.13, 0, 0, 0), B("metal", 0.07, h * 0.35, 0.15, 0, 0.04, 0.04)];
  if (L === "blade" || L === "spike") return [B("prim", 0.08, h, 0.14, 0, 0, 0), B("acc", 0.03, h * 0.7, 0.16, 0.04, 0, 0.02)];
  if (L === "frame" || L === "lattice") return [B("metal", 0.035, h, 0.035, 0.04, 0, 0.03), B("metal", 0.035, h, 0.035, -0.03, 0, -0.02), B("dark", 0.08, h * 0.4, 0.08, 0, 0, 0)];
  return [C("prim", 0.065 * r.thick, 0.055 * r.thick, h, 0, 0, 0, 0, 0, 0, r.segs), B("prim", 0.11 * r.thick, h * 0.65, 0.09, 0, 0, 0.035), ...densitySeams(r, 0.11 * r.thick, h, 0.09, 0.04)];
}

function ankle(r: Recipe): Spec[] {
  return [C("joint", 0.045, 0.045, 0.07, 0, 0, 0, 0, 0, Math.PI / 2, r.segs), B("dark", 0.09 * r.thick, 0.07, 0.09, 0, 0, 0.018)];
}

function foot(r: Recipe): Spec[] {
  const L = r.canon === "heavy" ? 0.34 : r.canon === "stalker" ? 0.3 : 0.26;
  if (r.curve > 0.7 || r.limb === "capsule") return [Sp("prim", 0.075, 0, 0.02, 0.04, r.segs), B("dark", 0.11, 0.035, L * 0.8, 0, -0.03, 0.055)];
  if (r.limb === "talon" || r.limb === "claw") {
    return [mass(r, "prim", 0.12 * r.hip, 0.07, L * 0.7, 0, 0, 0.02), N("dark", 0.006, 0.02, 0.1, 0.04, -0.02, L * 0.4, Math.PI / 2, 0, 0), N("dark", 0.006, 0.02, 0.1, -0.04, -0.02, L * 0.4, Math.PI / 2, 0, 0)];
  }
  return [mass(r, "prim", 0.13 * r.hip, 0.07, L, 0, 0, 0.04), B("dark", 0.11, 0.035, L * 0.88, 0, -0.035, 0.04), B("sec", 0.09, 0.05, 0.09, 0, 0.035, 0.09)];
}

function pack(r: Recipe): Spec[] {
  const s = r.segs;
  const span = 0.85;
  switch (r.pack) {
    case "wing":
      return [B("prim", 0.16, 0.15, 0.11, 0, 0, 0), B("sec", 0.06 * span, 0.28, 0.34, 0.14, 0.04, -0.06, 0.3, 0.2, 0), B("sec", 0.06 * span, 0.28, 0.34, -0.14, 0.04, -0.06, 0.3, -0.2, 0)];
    case "tank":
      return [C("prim", 0.09 * span, 0.09 * span, 0.28, 0.1, 0, 0, Math.PI / 2, 0, 0, s), C("prim", 0.09 * span, 0.09 * span, 0.28, -0.1, 0, 0, Math.PI / 2, 0, 0, s), B("metal", 0.24, 0.09, 0.11, 0, 0.1, 0)];
    case "spine":
      return [B("prim", 0.09, 0.36, 0.09, 0, 0.04, 0), B("sec", 0.065, 0.08, 0.2, 0, 0.14, -0.08), B("sec", 0.065, 0.08, 0.14, 0, -0.1, -0.06)];
    case "halo":
      return [C("trim", 0.17, 0.17, 0.03, 0, 0.08, -0.04, Math.PI / 2, 0, 0, s), B("prim", 0.13, 0.11, 0.09, 0, 0, 0)];
    case "twin":
      return [B("prim", 0.08, 0.22, 0.13, 0.12, 0, 0), B("prim", 0.08, 0.22, 0.13, -0.12, 0, 0), C("glow", 0.03, 0.04, 0.09, 0.12, -0.1, -0.08, Math.PI / 2, 0, 0, s), C("glow", 0.03, 0.04, 0.09, -0.12, -0.1, -0.08, Math.PI / 2, 0, 0, s)];
    case "mast":
      return [B("prim", 0.12, 0.13, 0.1, 0, 0, 0), B("metal", 0.03, 0.38, 0.03, 0, 0.22, -0.04), B("visor", 0.05, 0.045, 0.05, 0, 0.42, -0.04)];
    case "shell":
      return [C("prim", 0.14, 0.12, 0.2, 0, 0, 0, Math.PI / 2, 0, 0, s), B("sec", 0.22, 0.065, 0.13, 0, 0.1, 0)];
    case "brick":
      return [B("prim", 0.26, 0.12, 0.14, 0, 0.06, 0), B("prim", 0.22, 0.12, 0.14, 0, -0.06, 0)];
    case "fin":
      return [B("prim", 0.12, 0.12, 0.1, 0, 0, 0), B("trim", 0.03, 0.28, 0.16, 0, 0.1, -0.04, 0.2, 0, 0)];
    case "rack":
      return [B("metal", 0.2, 0.04, 0.16, 0, 0.08, 0), B("metal", 0.2, 0.04, 0.16, 0, -0.04, 0), B("dark", 0.04, 0.16, 0.04, 0.08, 0.02, 0), B("dark", 0.04, 0.16, 0.04, -0.08, 0.02, 0)];
    case "plate":
      return [B("prim", 0.28, 0.22, 0.06, 0, 0, 0), B("sec", 0.16, 0.12, 0.05, 0, 0.04, 0.03)];
    case "booster":
      return [C("metal", 0.07, 0.09, 0.22, 0.08, 0, 0, Math.PI / 2, 0, 0, s), C("metal", 0.07, 0.09, 0.22, -0.08, 0, 0, Math.PI / 2, 0, 0, s), C("glow", 0.05, 0.06, 0.07, 0.08, 0, -0.14, Math.PI / 2, 0, 0, s), C("glow", 0.05, 0.06, 0.07, -0.08, 0, -0.14, Math.PI / 2, 0, 0, s)];
    case "scythe":
      return [B("prim", 0.12, 0.12, 0.1, 0, 0, 0), B("acc", 0.04, 0.1, 0.32, 0.1, 0.06, -0.08, 0.4, 0.3, 0), B("acc", 0.04, 0.1, 0.32, -0.1, 0.06, -0.08, 0.4, -0.3, 0)];
    case "ring":
      return [{ t: "torus", m: "trim", s: [0.16, 0.025, 0], p: [0, 0.06, -0.04], r: [Math.PI / 2, 0, 0] }, B("prim", 0.12, 0.1, 0.1, 0, 0, 0)];
    case "pod":
      return [Sp("prim", 0.1, 0.08, 0.04, 0, s), Sp("prim", 0.1, -0.08, 0.04, 0, s), B("metal", 0.2, 0.08, 0.1, 0, 0.1, 0)];
    case "sail":
      return [B("prim", 0.1, 0.1, 0.1, 0, 0, 0), B("sec", 0.05, 0.32, 0.22, 0.12, 0.08, -0.06, 0.15, 0.35, 0), B("sec", 0.05, 0.32, 0.22, -0.12, 0.08, -0.06, 0.15, -0.35, 0)];
    case "turret":
      return [B("prim", 0.16, 0.12, 0.14, 0, 0, 0), C("metal", 0.03, 0.025, 0.22, 0, 0.1, 0.08, Math.PI / 2, 0, 0, s), B("dark", 0.08, 0.08, 0.08, 0, 0.12, 0)];
    case "canopy":
      return [mass(r, "prim", 0.22, 0.1, 0.16, 0, 0.04, 0, -0.25, 0, 0), B("dark", 0.14, 0.08, 0.1, 0, -0.04, 0)];
    case "claw":
      return [B("prim", 0.12, 0.1, 0.1, 0, 0, 0), N("acc", 0.01, 0.03, 0.16, 0.1, 0.06, -0.06, 0.6, 0.3, 0), N("acc", 0.01, 0.03, 0.16, -0.1, 0.06, -0.06, 0.6, -0.3, 0)];
    case "fold":
      return [B("prim", 0.1, 0.2, 0.08, 0.08, 0, 0, 0, 0, 0.3), B("prim", 0.1, 0.2, 0.08, -0.08, 0, 0, 0, 0, -0.3), B("metal", 0.16, 0.06, 0.1, 0, 0.1, 0)];
    case "disc":
      return [C("prim", 0.16, 0.16, 0.04, 0, 0.06, 0, 0, 0, 0, s), B("sec", 0.1, 0.1, 0.1, 0, -0.04, 0)];
    case "arch":
      return [C("trim", 0.14, 0.14, 0.04, 0, 0.12, 0, Math.PI / 2, 0, 0, s), B("prim", 0.08, 0.16, 0.08, 0.1, 0, 0), B("prim", 0.08, 0.16, 0.08, -0.1, 0, 0)];
    case "stack": {
      const n = 2 + Math.floor(r.density / 4);
      const out: Spec[] = [];
      for (let i = 0; i < n; i++) out.push(mass(r, i % 2 ? "sec" : "prim", 0.22 - i * 0.03, 0.07, 0.14, 0, 0.1 - i * 0.08, 0));
      return out;
    }
    case "crystal":
      return [B("prim", 0.12, 0.1, 0.1, 0, 0, 0), { t: "octa", m: "acc", s: [0.07, 0, 0], p: [0, 0.14, -0.04] }, { t: "octa", m: "trim", s: [0.04, 0, 0], p: [0.1, 0.06, 0] }];
    default:
      return [mass(r, "prim", 0.26, 0.22, 0.14, 0, 0, 0), C("metal", 0.05, 0.07, 0.11, 0.09, -0.04, -0.08, Math.PI / 2, 0, 0, s), C("metal", 0.05, 0.07, 0.11, -0.09, -0.04, -0.08, Math.PI / 2, 0, 0, s)];
  }
}

function thruster(r: Recipe): Spec[] {
  const glow = r.curve > 0.5 ? 0.06 : 0.05;
  return [C("metal", 0.06, 0.08, 0.16, 0, 0, 0, Math.PI / 2, 0, 0, r.segs), C("glow", glow, glow + 0.01, 0.06, 0, 0, -0.1, Math.PI / 2, 0, 0, r.segs), B("prim", 0.08, 0.1, 0.08, 0, 0.04, 0.02)];
}

function binder(r: Recipe): Spec[] {
  const k = (r.greeble * 5 + r.code.serial * 11) % 12;
  const s = r.segs;
  const stretch = 0.75 + (r.code.serial % 6) * 0.1;
  const lean = ((r.code.serial % 9) - 4) * 0.1;
  const lift = ((r.greeble % 5) - 2) * 0.02;
  switch (k) {
    case 0:
      return [B("acc", 0.04, 0.1 + stretch * 0.12, 0.42 * stretch, 0, 0.04 + lift, -0.08, 0.55 + lean, 0.2, 0), B("sec", 0.03, 0.08, 0.14, 0, 0.1, 0.04), C("glow", 0.02, 0.025, 0.06, 0, -0.04, -0.22, Math.PI / 2, 0, 0, s)];
    case 1:
      return [B("prim", 0.12 * stretch, 0.16, 0.1, 0, lift, 0), C("glow", 0.035, 0.045, 0.14, 0, -0.08, -0.1, Math.PI / 2, 0, 0, s), B("metal", 0.04, 0.1, 0.04, 0.06, 0.04, 0)];
    case 2:
      return [C("prim", 0.05 * stretch, 0.04, 0.32 * stretch, 0, 0.02, -0.06, Math.PI / 2, 0.3 + lean, 0, s), C("glow", 0.03, 0.04, 0.09, 0, 0, -0.24, Math.PI / 2, 0, 0, s), B("trim", 0.07, 0.05, 0.07, 0, 0.06, 0.04)];
    case 3:
      return [B("dark", 0.09, 0.08, 0.24 * stretch, 0, lift, 0), Sp("glow", 0.04, 0.06, 0.07, -0.1, s), Sp("glow", 0.04, -0.06, 0.07, -0.1, s), B("acc", 0.03, 0.12, 0.03, 0, 0.1, 0)];
    case 4:
      return [B("sec", 0.035, 0.1, 0.4 * stretch, 0, 0.08 + lift, -0.1, 0.75, 0.4 + lean, 0), B("prim", 0.08, 0.07, 0.1, 0, 0, 0.05), N("acc", 0.01, 0.03, 0.1, 0, 0.16, -0.16)];
    case 5:
      return [B("prim", 0.12 * stretch, 0.035, 0.26, 0, 0.08 + lift, -0.04), B("prim", 0.09, 0.035, 0.2, 0, 0.02, -0.02), B("prim", 0.06, 0.035, 0.14, 0, -0.04, 0), B("dark", 0.04, 0.08, 0.04, 0, 0.04, 0.08)];
    case 6:
      return [C("metal", 0.045, 0.07, 0.22 * stretch, 0, lift, 0, Math.PI / 2, 0, 0, s), C("glow", 0.04, 0.05, 0.08, 0, 0, -0.16, Math.PI / 2, 0, 0, s), B("trim", 0.1, 0.05, 0.06, 0, 0.06, 0.05), B("sec", 0.03, 0.12, 0.08, 0.06, 0.02, -0.04, 0, lean, 0)];
    case 7:
      return [B("prim", 0.14 * stretch, 0.22, 0.04, 0, 0.05 + lift, 0, 0.25, 0, lean), B("sec", 0.06, 0.12, 0.035, 0, 0.08, 0.03), C("joint", 0.03, 0.03, 0.06, 0, -0.06, 0, 0, 0, Math.PI / 2, s)];
    case 8:
      return [B("acc", 0.035, 0.18 * stretch, 0.12, 0.05, 0.05 + lift, -0.02, 0.45, 0.25 + lean, 0), B("acc", 0.035, 0.18 * stretch, 0.12, -0.05, 0.05 + lift, -0.02, 0.45, -0.25 - lean, 0), B("dark", 0.09, 0.07, 0.09, 0, 0, 0.02), Sp("glow", 0.025, 0, 0.12, -0.08, s)];
    case 9:
      return [C("prim", 0.07 * stretch, 0.07 * stretch, 0.18, 0, lift, 0, 0, 0, 0, 6), B("trim", 0.12, 0.035, 0.12, 0, 0.1, 0), N("metal", 0.008, 0.04, 0.12, 0, 0.16, 0)];
    case 10:
      return [B("sec", 0.045, 0.22 * stretch, 0.16, 0.08, 0.03 + lift, -0.06, 0.25, 0.35 + lean, 0), B("sec", 0.045, 0.22 * stretch, 0.16, -0.08, 0.03 + lift, -0.06, 0.25, -0.35 - lean, 0), B("prim", 0.08, 0.08, 0.08, 0, 0, 0.02)];
    default:
      return [B("metal", 0.035, 0.32 * stretch, 0.035, 0, 0.12 + lift, -0.05), B("prim", 0.11, 0.09, 0.11, 0, 0, 0), C("glow", 0.022, 0.03, 0.07, 0, 0.26, -0.08, Math.PI / 2, 0, 0, s), B("acc", 0.05, 0.05, 0.16, 0, 0.04, -0.08, 0.5, lean, 0)];
  }
}

function stabilizer(r: Recipe): Spec[] {
  return [B("prim", 0.08, 0.22 * r.height, 0.1, 0, -0.06, 0, 0.3, 0, 0), B("sec", 0.04, 0.14, 0.06, 0, -0.1, 0)];
}

function specsFor(slotId: string, variant: string, beamZ = 1): Spec[] {
  if (variant === "none") return [];
  if (slotId === "weaponR" || slotId === "weaponL") return weaponSpecs(variant, beamZ);
  if (slotId === "shield") return ensureLR(shieldSpecs(variant));
  if (slotId.startsWith("extra")) return ensureLR(extraSpecs(variant));

  const r = getRecipe(variant);
  const b = base(slotId);
  let raw: Spec[];
  switch (b) {
    case "helm":
      raw = helm(r);
      break;
    case "visor":
      raw = visor(r);
      break;
    case "brow":
      raw = brow(r);
      break;
    case "eye":
      raw = eye(r);
      break;
    case "nose":
      raw = nose(r);
      break;
    case "mouth":
      raw = mouth(r);
      break;
    case "jaw":
      raw = jaw(r);
      break;
    case "ear":
      raw = ear(r);
      break;
    case "vfin":
      raw = vfin(r);
      break;
    case "antenna":
      raw = antenna(r);
      break;
    case "cheek":
      raw = cheek(r);
      break;
    case "chin":
      raw = chin(r);
      break;
    case "collar":
      raw = collar(r);
      break;
    case "chestCore":
      raw = chestCore(r);
      break;
    case "pec":
      raw = pec(r);
      break;
    case "cockpit":
      raw = cockpit(r);
      break;
    case "abdomen":
      raw = abdomen(r);
      break;
    case "pelvis":
      raw = pelvis(r);
      break;
    case "skirtF":
      raw = skirtF(r);
      break;
    case "skirtB":
      raw = skirtB(r);
      break;
    case "skirt":
      raw = skirtS(r);
      break;
    case "shoulder":
      raw = shoulder(r);
      break;
    case "upper":
      raw = upper(r);
      break;
    case "elbow":
      raw = elbow(r);
      break;
    case "forearm":
      raw = forearm(r);
      break;
    case "vambrace":
      raw = vambrace(r);
      break;
    case "hand":
      raw = hand(r);
      break;
    case "hip":
      raw = hip(r);
      break;
    case "thigh":
      raw = thigh(r);
      break;
    case "knee":
      raw = knee(r);
      break;
    case "shin":
      raw = shin(r);
      break;
    case "ankle":
      raw = ankle(r);
      break;
    case "foot":
      raw = foot(r);
      break;
    case "pack":
      raw = pack(r);
      break;
    case "thruster":
      raw = thruster(r);
      break;
    case "binder":
      raw = binder(r);
      break;
    case "stabilizer":
      raw = stabilizer(r);
      break;
    default:
      raw = [B("prim", 0.12, 0.12, 0.12, 0, 0, 0)];
  }
  return ensureLR([...raw, ...dressPart2(raw, r, slotId)]);
}

function weaponSpecs(v: string, beamZ = 1): Spec[] {
  const L = Math.max(0.35, beamZ);
  const rx = Math.PI / 2;
  // Pistol grip at origin (in the palm). Receiver sits ABOVE the hand.
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
      C("glow", 0.035, 0.045, 0.055, 0, 0.1, 0.36, rx, 0, 0),
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

function shieldSpecs(v: string): Spec[] {
  // Coupling sits on the back face, inset from the bottom rim — not hanging off the corner.
  const mount: Spec = B("dark", 0.06, 0.05, 0.042, 0, 0.09, -0.04);
  if (v === "round")
    return [mount, C("prim", 0.16, 0.16, 0.04, 0, 0.18, 0, Math.PI / 2, 0, 0, 16), C("sec", 0.08, 0.08, 0.05, 0, 0.18, 0.02, Math.PI / 2, 0, 0, 16)];
  if (v === "tower")
    return [mount, B("prim", 0.22, 0.48, 0.05, 0, 0.27, 0), B("sec", 0.1, 0.16, 0.06, 0, 0.34, 0.02), B("acc", 0.06, 0.07, 0.05, 0, 0.1, 0.02)];
  if (v === "buckler")
    return [mount, C("prim", 0.1, 0.1, 0.04, 0, 0.12, 0, Math.PI / 2, 0, 0, 16), B("metal", 0.04, 0.04, 0.05, 0, 0.12, 0.03)];
  if (v === "heater")
    return [mount, B("prim", 0.2, 0.3, 0.045, 0, 0.2, 0), B("prim", 0.14, 0.08, 0.045, 0, 0.06, 0), B("sec", 0.08, 0.1, 0.05, 0, 0.22, 0.02)];
  if (v === "scutum")
    return [mount, B("prim", 0.28, 0.38, 0.05, 0, 0.22, 0), C("sec", 0.12, 0.12, 0.04, 0, 0.24, 0.03, Math.PI / 2, 0, 0, 16)];
  if (v === "hex")
    return [mount, C("prim", 0.16, 0.16, 0.045, 0, 0.18, 0, Math.PI / 2, 0, 0, 6), B("trim", 0.06, 0.06, 0.05, 0, 0.18, 0.03)];
  if (v === "penta")
    return [mount, C("prim", 0.15, 0.15, 0.045, 0, 0.18, 0, Math.PI / 2, 0, 0, 5), B("acc", 0.05, 0.05, 0.05, 0, 0.18, 0.03)];
  if (v === "oval")
    return [mount, C("prim", 0.12, 0.18, 0.04, 0, 0.2, 0, Math.PI / 2, 0, 0, 16), B("sec", 0.06, 0.1, 0.045, 0, 0.2, 0.02)];
  if (v === "delta")
    return [mount, C("prim", 0.02, 0.2, 0.3, 0, 0.16, 0, 0, 0, 0, 3), B("dark", 0.06, 0.06, 0.04, 0, 0.12, 0.02)];
  if (v === "cross")
    return [mount, B("prim", 0.28, 0.1, 0.04, 0, 0.2, 0), B("prim", 0.1, 0.3, 0.04, 0, 0.2, 0), B("acc", 0.06, 0.06, 0.05, 0, 0.2, 0.03)];
  if (v === "spike")
    return [mount, C("prim", 0.14, 0.14, 0.045, 0, 0.16, 0, Math.PI / 2, 0, 0, 12), N("metal", 0.01, 0.04, 0.1, 0, 0.3, 0), N("metal", 0.01, 0.03, 0.08, 0.1, 0.16, 0), N("metal", 0.01, 0.03, 0.08, -0.1, 0.16, 0)];
  if (v === "wing")
    return [mount, B("prim", 0.1, 0.26, 0.04, 0, 0.16, 0), B("sec", 0.16, 0.07, 0.03, 0.12, 0.22, 0, 0.3, 0.4, 0), B("sec", 0.16, 0.07, 0.03, -0.12, 0.22, 0, 0.3, -0.4, 0)];
  if (v === "slab")
    return [mount, B("prim", 0.24, 0.16, 0.08, 0, 0.11, 0), B("dark", 0.2, 0.035, 0.07, 0, 0.04, 0)];
  if (v === "dish")
    return [mount, { t: "hemi", m: "prim", s: [0.16, 0, 0], p: [0, 0.14, 0] }, C("sec", 0.08, 0.08, 0.03, 0, 0.14, 0.04, Math.PI / 2, 0, 0, 16)];
  if (v === "blade")
    return [mount, B("prim", 0.08, 0.4, 0.03, 0, 0.24, 0, 0, 0, 0.15), B("metal", 0.06, 0.07, 0.04, 0, 0.08, 0.01)];
  if (v === "lattice")
    return [mount, B("prim", 0.22, 0.04, 0.04, 0, 0.34, 0), B("prim", 0.22, 0.04, 0.04, 0, 0.1, 0), B("prim", 0.04, 0.28, 0.04, 0.09, 0.22, 0), B("prim", 0.04, 0.28, 0.04, -0.09, 0.22, 0)];
  if (v === "diamond")
    return [mount, B("prim", 0.18, 0.18, 0.045, 0, 0.2, 0, 0, 0, Math.PI / 4), B("sec", 0.08, 0.08, 0.05, 0, 0.2, 0.02, 0, 0, Math.PI / 4)];
  if (v === "capsule")
    return [mount, { t: "capsule", m: "prim", s: [0.1, 0.2, 0], p: [0, 0.2, 0] }, B("sec", 0.06, 0.1, 0.05, 0, 0.2, 0.04)];
  if (v === "layer")
    return [mount, B("prim", 0.22, 0.26, 0.03, 0, 0.18, 0), B("sec", 0.16, 0.18, 0.03, 0, 0.18, 0.03), B("acc", 0.1, 0.1, 0.03, 0, 0.18, 0.06)];
  return [mount, B("prim", 0.18, 0.32, 0.045, 0, 0.22, 0), B("prim", 0.12, 0.08, 0.045, 0, 0.06, 0), B("sec", 0.08, 0.12, 0.05, 0, 0.24, 0.02), B("acc", 0.05, 0.05, 0.04, 0, 0.1, 0.02)];
}

function extraSpecs(v: string): Spec[] {
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
      return [B("prim", 0.2, 0.05, 0.05, 0, 0, 0), B("prim", 0.05, 0.2, 0.05, 0, 0, 0), B("prim", 0.05, 0.05, 0.2, 0, 0, 0)];
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
      return [C("metal", 0.07, 0.09, 0.2, 0, 0, 0, Math.PI / 2, 0, 0), C("glow", 0.05, 0.06, 0.07, 0, 0, -0.14, Math.PI / 2, 0, 0)];
    case 2:
      return [C("metal", 0.05, 0.07, 0.18, 0.08, 0, 0, Math.PI / 2, 0, 0), C("metal", 0.05, 0.07, 0.18, -0.08, 0, 0, Math.PI / 2, 0, 0), C("glow", 0.04, 0.05, 0.06, 0.08, 0, -0.12, Math.PI / 2, 0, 0), C("glow", 0.04, 0.05, 0.06, -0.08, 0, -0.12, Math.PI / 2, 0, 0)];
    case 3:
      return [B("prim", 0.18, 0.14, 0.22, 0, 0, 0), B("dark", 0.16, 0.04, 0.2, 0, 0.08, 0), B("metal", 0.04, 0.08, 0.04, 0.1, 0, 0.1)];
    case 4:
      return [C("prim", 0.08, 0.08, 0.16, 0, 0, 0, Math.PI / 2, 0, 0), B("sec", 0.1, 0.08, 0.1, 0, 0.06, 0)];
    case 5:
      return [C("metal", 0.07, 0.07, 0.24, 0, 0, 0, Math.PI / 2, 0, 0), C("dark", 0.05, 0.05, 0.08, 0, 0, 0.14, Math.PI / 2, 0, 0)];
    case 6:
      return [B("prim", 0.06, 0.16, 0.32, 0, 0.02, -0.04, 0.3, 0.2, 0), B("sec", 0.04, 0.08, 0.18, 0, 0.04, 0), C("glow", 0.025, 0.03, 0.08, 0, -0.04, -0.16, Math.PI / 2, 0, 0)];
    case 7:
      return [B("dark", 0.14, 0.06, 0.1, 0, 0, 0), B("metal", 0.03, 0.08, 0.08, 0.05, -0.04, 0), B("metal", 0.03, 0.08, 0.08, -0.05, -0.04, 0)];
    case 8:
      return [C("prim", 0.06, 0.05, 0.2, 0, 0, 0, Math.PI / 2, 0, 0), N("acc", 0.02, 0.05, 0.08, 0, 0, 0.14, Math.PI / 2, 0, 0)];
    case 9:
      return [B("prim", 0.12, 0.22, 0.06, 0, 0, 0, 0.2, 0, 0), B("sec", 0.06, 0.12, 0.05, 0, 0.04, 0.02)];
    case 10:
      return [C("metal", 0.03, 0.04, 0.1, 0.06, 0.04, -0.04, Math.PI / 2, 0, 0), C("metal", 0.03, 0.04, 0.1, -0.06, 0.04, -0.04, Math.PI / 2, 0, 0), C("glow", 0.02, 0.025, 0.05, 0.06, 0.04, -0.1, Math.PI / 2, 0, 0), C("glow", 0.02, 0.025, 0.05, -0.06, 0.04, -0.1, Math.PI / 2, 0, 0)];
    case 11:
      return [B("prim", 0.2, 0.12, 0.16, 0, 0, 0), B("sec", 0.08, 0.18, 0.1, 0, 0.08, -0.04)];
    case 12:
      return [B("prim", 0.08, 0.2, 0.16, 0, -0.04, 0, 0.25, 0, 0), B("acc", 0.04, 0.14, 0.12, 0.03, -0.02, 0)];
    case 13:
      return [B("prim", 0.14, 0.1, 0.16, 0, 0, 0), C("metal", 0.04, 0.05, 0.14, 0, 0.02, 0.1, Math.PI / 2, 0, 0)];
    case 14:
      return [B("dark", 0.16, 0.12, 0.14, 0, 0, 0), B("prim", 0.1, 0.08, 0.1, 0, 0, 0.08)];
    case 15:
      return [C("trim", 0.12, 0.12, 0.04, 0, 0, 0, Math.PI / 2, 0, 0), C("glow", 0.06, 0.06, 0.03, 0, 0, -0.03, Math.PI / 2, 0, 0)];
    case 16:
      return [B("prim", 0.22, 0.08, 0.12, 0, 0, 0, 0.15, 0, 0), B("dark", 0.18, 0.05, 0.1, 0, -0.04, 0)];
    case 17:
      return [B("sec", 0.05, 0.14, 0.28, 0.1, 0.04, -0.04, 0.35, 0.2, 0), B("sec", 0.05, 0.14, 0.28, -0.1, 0.04, -0.04, 0.35, -0.2, 0)];
    case 18:
      return [Sp("prim", 0.08, 0, 0.04, 0), C("metal", 0.02, 0.015, 0.12, 0, 0.12, 0)];
    case 19:
      return [B("metal", 0.16, 0.1, 0.1, 0, 0, 0), C("dark", 0.03, 0.03, 0.12, 0.06, 0.06, 0), C("dark", 0.03, 0.03, 0.12, -0.06, 0.06, 0)];
    default:
      return [B("prim", 0.16, 0.04, 0.2, 0, 0, 0), B("dark", 0.14, 0.03, 0.18, 0, 0.03, 0)];
  }
}

function extraWeapon(n: number): Spec[] {
  switch (n) {
    case 1:
      return [C("metal", 0.05, 0.06, 0.3, 0, 0, 0.06, Math.PI / 2, 0, 0), B("prim", 0.1, 0.1, 0.12, 0, 0, -0.08)];
    case 2:
      return [B("dark", 0.12, 0.1, 0.16, 0, 0, 0), C("prim", 0.02, 0.02, 0.14, 0.03, 0.02, 0.08, Math.PI / 2, 0, 0), C("prim", 0.02, 0.02, 0.14, -0.03, 0.02, 0.08, Math.PI / 2, 0, 0), C("prim", 0.02, 0.02, 0.14, 0.03, -0.02, 0.08, Math.PI / 2, 0, 0), C("prim", 0.02, 0.02, 0.14, -0.03, -0.02, 0.08, Math.PI / 2, 0, 0)];
    case 3:
      return [B("dark", 0.04, 0.08, 0.1, 0, 0, 0), C("visor", 0.01, 0.008, 0.22, 0.04, 0.02, 0.08, Math.PI / 2, 0, 0), C("visor", 0.01, 0.008, 0.22, -0.04, 0.02, 0.08, Math.PI / 2, 0, 0)];
    case 4:
      return [B("dark", 0.1, 0.08, 0.1, 0, 0, 0), C("metal", 0.018, 0.018, 0.1, 0.03, 0.03, 0.06, Math.PI / 2, 0, 0), C("metal", 0.018, 0.018, 0.1, -0.03, 0.03, 0.06, Math.PI / 2, 0, 0)];
    case 5:
      return [B("prim", 0.1, 0.12, 0.18, 0, 0, 0), C("metal", 0.03, 0.025, 0.36, 0, 0.02, 0.24, Math.PI / 2, 0, 0), B("acc", 0.06, 0.06, 0.08, 0, 0.08, 0.04)];
    case 6:
      return [B("dark", 0.1, 0.1, 0.2, 0, 0, 0), C("metal", 0.025, 0.025, 0.22, 0.04, 0.02, 0.16, Math.PI / 2, 0, 0), C("metal", 0.025, 0.025, 0.22, -0.04, 0.02, 0.16, Math.PI / 2, 0, 0), C("dark", 0.05, 0.05, 0.1, 0, -0.08, 0)];
    case 7:
      return [B("prim", 0.08, 0.1, 0.22, 0, 0, 0), C("metal", 0.02, 0.02, 0.4, 0, 0.02, 0.28, Math.PI / 2, 0, 0), B("sec", 0.1, 0.06, 0.1, 0, 0.08, 0.06)];
    case 8:
      return [B("dark", 0.1, 0.12, 0.18, 0, 0, 0), C("metal", 0.04, 0.05, 0.16, 0, 0.02, 0.14, Math.PI / 2, 0, 0)];
    case 9:
      return [B("dark", 0.04, 0.08, 0.14, 0, 0, 0), B("glow", 0.03, 0.16, 0.2, 0, 0.08, 0.1, 0.4, 0, 0)];
    case 10:
      return [C("metal", 0.02, 0.014, 0.55, 0, 0, 0.16, Math.PI / 2, 0, 0), B("prim", 0.07, 0.07, 0.12, 0, 0, -0.08), N("acc", 0.01, 0.028, 0.08, 0, 0, 0.46, Math.PI / 2, 0, 0)];
    case 11:
      return [C("metal", 0.08, 0.09, 0.28, 0, 0, 0.06, Math.PI / 2, 0, 0), B("prim", 0.16, 0.14, 0.16, 0, 0, -0.1), C("glow", 0.05, 0.06, 0.06, 0, 0, 0.22, Math.PI / 2, 0, 0)];
    case 12:
      return [B("prim", 0.16, 0.08, 0.1, 0, 0, 0), B("prim", 0.05, 0.05, 0.14, 0.06, 0.06, 0.04), B("prim", 0.05, 0.05, 0.14, -0.06, 0.06, 0.04), C("glow", 0.02, 0.025, 0.05, 0.06, 0.06, -0.06, Math.PI / 2, 0, 0)];
    case 13:
      return [B("dark", 0.08, 0.08, 0.12, 0, 0, 0), C("metal", 0.015, 0.015, 0.2, 0, 0.02, 0.14, Math.PI / 2, 0, 0)];
    case 14:
      return [B("dark", 0.14, 0.06, 0.08, 0, 0, 0), C("metal", 0.012, 0.012, 0.1, 0.04, 0, 0.08, Math.PI / 2, 0, 0), C("metal", 0.012, 0.012, 0.1, -0.04, 0, 0.08, Math.PI / 2, 0, 0)];
    case 15:
      return [B("prim", 0.12, 0.1, 0.16, 0, 0, 0), C("metal", 0.03, 0.03, 0.2, 0.05, 0, 0.12, Math.PI / 2, 0, 0), C("dark", 0.04, 0.04, 0.08, 0, -0.08, 0)];
    case 16:
      return [C("prim", 0.03, 0.025, 0.16, 0, 0, 0.06, Math.PI / 2, 0, 0), B("dark", 0.06, 0.06, 0.08, 0, 0, -0.04), N("acc", 0.01, 0.03, 0.06, 0, 0, 0.16, Math.PI / 2, 0, 0)];
    case 17:
      return [C("visor", 0.012, 0.01, 0.28, 0.04, 0, 0.12, Math.PI / 2, 0, 0), C("visor", 0.012, 0.01, 0.28, -0.04, 0, 0.12, Math.PI / 2, 0, 0), B("dark", 0.1, 0.06, 0.08, 0, 0, 0)];
    case 18:
      return [B("prim", 0.16, 0.22, 0.05, 0, 0, 0), C("metal", 0.03, 0.035, 0.16, 0, 0.04, 0.08, Math.PI / 2, 0, 0)];
    case 19:
      return [B("dark", 0.06, 0.08, 0.5, 0, 0, 0.1), C("metal", 0.018, 0.018, 0.22, 0, 0.02, 0.36, Math.PI / 2, 0, 0), B("sec", 0.08, 0.06, 0.1, 0, 0.06, 0.08)];
    default:
      return [B("dark", 0.14, 0.1, 0.18, 0, 0, 0), C("prim", 0.018, 0.018, 0.12, 0.04, 0.03, 0.1, Math.PI / 2, 0, 0), C("prim", 0.018, 0.018, 0.12, -0.04, 0.03, 0.1, Math.PI / 2, 0, 0), C("prim", 0.018, 0.018, 0.12, 0, -0.03, 0.1, Math.PI / 2, 0, 0)];
  }
}

function extraAcc(n: number): Spec[] {
  switch (n) {
    case 1:
      return [C("metal", 0.012, 0.01, 0.28, 0, 0.1, 0), B("visor", 0.04, 0.03, 0.03, 0, 0.24, 0), B("dark", 0.05, 0.03, 0.05, 0, 0, 0)];
    case 2:
      return [C("metal", 0.01, 0.008, 0.22, 0.04, 0.08, 0), C("metal", 0.01, 0.008, 0.22, -0.04, 0.08, 0), B("acc", 0.03, 0.03, 0.03, 0.04, 0.2, 0), B("acc", 0.03, 0.03, 0.03, -0.04, 0.2, 0)];
    case 3:
      return [B("trim", 0.04, 0.18, 0.08, 0, 0.06, 0, 0.2, 0, 0), B("glow", 0.02, 0.12, 0.04, 0, 0.08, 0.03)];
    case 4:
      return [B("trim", 0.16, 0.05, 0.06, 0, 0.08, 0), B("acc", 0.04, 0.1, 0.04, 0.06, 0.1, 0), B("acc", 0.04, 0.1, 0.04, -0.06, 0.1, 0)];
    case 5:
      return [Sp("visor", 0.05, 0, 0.02, 0.02), B("dark", 0.08, 0.04, 0.04, 0, -0.04, 0)];
    case 6:
      return [N("acc", 0.015, 0.04, 0.16, 0, 0.08, 0), B("metal", 0.05, 0.04, 0.05, 0, 0, 0)];
    case 7:
      return [B("dark", 0.1, 0.04, 0.06, 0, 0.06, 0.04), C("metal", 0.01, 0.01, 0.08, 0.03, 0.06, 0.08, Math.PI / 2, 0, 0), C("metal", 0.01, 0.01, 0.08, -0.03, 0.06, 0.08, Math.PI / 2, 0, 0)];
    case 8:
      return [B("prim", 0.08, 0.06, 0.16, 0, 0, 0), C("glow", 0.03, 0.04, 0.06, 0, 0, -0.1, Math.PI / 2, 0, 0)];
    case 9:
      return [B("glow", 0.16, 0.03, 0.03, 0, 0.04, 0.04), B("glow", 0.03, 0.12, 0.03, 0.08, 0, 0.04)];
    case 10:
      return [B("acc", 0.03, 0.16, 0.2, 0, 0.04, 0, 0.4, 0.15, 0)];
    case 11:
      return [N("metal", 0.01, 0.03, 0.1, 0, -0.04, 0.06, Math.PI / 2, 0, 0), B("dark", 0.06, 0.04, 0.06, 0, 0, 0)];
    case 12:
      return [B("prim", 0.06, 0.1, 0.12, 0, 0, 0), B("acc", 0.03, 0.12, 0.08, 0.04, 0.02, 0.02)];
    case 13:
      return [C("visor", 0.03, 0.03, 0.04, 0, 0.04, 0.02, Math.PI / 2, 0, 0), B("dark", 0.06, 0.04, 0.05, 0, 0, 0)];
    case 14:
      return [C("metal", 0.008, 0.006, 0.2, 0, 0.08, 0), B("sec", 0.04, 0.03, 0.04, 0, 0, 0)];
    case 15:
      return [C("trim", 0.1, 0.1, 0.03, 0, 0.08, 0, 0, 0, 0, 16), B("prim", 0.06, 0.05, 0.05, 0, 0, 0)];
    case 16:
      return [N("acc", 0.01, 0.035, 0.14, 0.06, 0.04, 0), N("acc", 0.01, 0.035, 0.14, -0.06, 0.04, 0)];
    case 17:
      return [Sp("glow", 0.045, 0, 0.02, 0.02), B("trim", 0.08, 0.03, 0.06, 0, -0.03, 0)];
    case 18:
      return [B("prim", 0.05, 0.16, 0.08, 0, -0.06, -0.02, 0.35, 0, 0), B("sec", 0.03, 0.1, 0.05, 0, -0.1, 0)];
    case 19:
      return [N("acc", 0.012, 0.03, 0.12, 0, -0.04, 0.04), B("prim", 0.08, 0.06, 0.08, 0, 0, 0)];
    default:
      return [N("metal", 0.015, 0.04, 0.12, 0.05, 0.06, 0), B("prim", 0.08, 0.06, 0.08, 0, 0, 0)];
  }
}

export function disposePart(group: THREE.Group) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
    if (o instanceof THREE.LineSegments) o.geometry.dispose();
  });
}

export function buildPart(
  slotId: string,
  variant: string,
  paint: string | null,
  edges: boolean,
  theme: "light" | "dark" = "dark",
  light: string | null = null,
  beamZ = 1,
  paint2: string | null = null,
): THREE.Group {
  const pal: Palette = getPalette(variant, paint, isVisorSlot(slotId), light, paint2);
  const rec = getRecipe(variant);
  const specs = specsFor(slotId, variant, beamZ);
  const g = new THREE.Group();
  g.name = slotId;
  g.userData.slotId = slotId;
  const segs = rec.segs;

  for (const sp of specs) {
    let geo: THREE.BufferGeometry;
    const n = sp.n ?? segs;
    if (sp.t === "box") {
      const [bw, bh, bd] = sp.s;
      const minSide = Math.min(bw, bh, bd);
      if ((rec.quad === "SR" || rec.quad === "RR") && minSide > 0.03) {
        const radius = Math.min(minSide * (rec.quad === "RR" ? 0.28 : 0.16), minSide * 0.36);
        geo = new RoundedBoxGeometry(bw, bh, bd, rec.quad === "RR" ? 3 : 2, radius);
      } else {
        geo = new THREE.BoxGeometry(bw, bh, bd);
      }
    } else if (sp.t === "cyl") {
      const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
      geo = new THREE.CylinderGeometry(sp.s[0], sp.s[1], sp.s[2], radSegs);
    } else if (sp.t === "sph") {
      if (rec.quad === "SS") geo = new THREE.OctahedronGeometry(sp.s[0]);
      else geo = new THREE.SphereGeometry(sp.s[0], Math.max(12, n), Math.max(10, n - 2));
    } else if (sp.t === "cone") {
      const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
      geo = new THREE.ConeGeometry(sp.s[1] || sp.s[0], sp.s[2], radSegs);
    } else if (sp.t === "torus") geo = new THREE.TorusGeometry(sp.s[0], sp.s[1] || 0.02, rec.quad === "SS" ? 6 : 14, rec.quad === "SS" ? 8 : Math.max(24, n));
    else if (sp.t === "tetra") geo = new THREE.TetrahedronGeometry(sp.s[0]);
    else if (sp.t === "octa") geo = new THREE.OctahedronGeometry(sp.s[0]);
    else if (sp.t === "dodeca") geo = new THREE.DodecahedronGeometry(sp.s[0]);
    else if (sp.t === "icosa") geo = new THREE.IcosahedronGeometry(sp.s[0]);
    else if (sp.t === "capsule") geo = new THREE.CapsuleGeometry(sp.s[0], sp.s[1], 6, Math.max(16, n));
    else if (sp.t === "knot") geo = new THREE.TorusKnotGeometry(sp.s[0], sp.s[1] || 0.02, 80, 10);
    else if (sp.t === "hemi") geo = new THREE.SphereGeometry(sp.s[0], 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    else if (sp.t === "ring") geo = new THREE.TorusGeometry(sp.s[0], sp.s[1] || 0.015, 12, 32);
    else geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mesh = new THREE.Mesh(geo, pal[sp.m]);
    mesh.position.set(sp.p[0], sp.p[1], sp.p[2]);
    if (sp.r) mesh.rotation.set(sp.r[0], sp.r[1], sp.r[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.slotId = slotId;
    g.add(mesh);
    if (edges) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), getLineMat(theme));
      e.position.copy(mesh.position);
      e.rotation.copy(mesh.rotation);
      e.userData.slotId = slotId;
      e.raycast = () => {};
      g.add(e);
    }
  }

  if (isLeftSlot(slotId) && !slotId.startsWith("extra")) g.scale.x = -1;
  return g;
}
