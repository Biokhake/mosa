import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MatKey, Palette } from "./palette";
import { getLineMat, getPalette } from "./palette";
import { isLeftSlot, isVisorSlot } from "./catalog";
import { getRecipe, type Recipe } from "./recipes";

import type { Spec } from "./geometry/types";
import { B, C, Sp, N } from "./geometry/primitives";

// Modular Geometry Generators
import {
  helm,
  visor,
  brow,
  eye,
  nose,
  mouth,
  jaw,
  ear,
  vfin,
  antenna,
  cheek,
  chin,
} from "./geometry/head";

import {
  collar,
  chestCore,
  pec,
  cockpit,
  abdomen,
  pelvis,
  skirtF,
  skirtB,
  skirtS,
} from "./geometry/torso";

import {
  shoulder,
  upper,
  forearm,
  vambrace,
  hand,
  thigh,
  shin,
  foot,
} from "./geometry/limbs";

import {
  elbow,
  knee,
  hip,
  ankle,
} from "./geometry/joints";

import {
  pack,
  thruster,
  binder,
  stabilizer,
  weaponSpecs,
  shieldSpecs,
  extraSpecs,
} from "./geometry/equipment";

export type { Spec };

function base(slot: string): string {
  return slot.replace(/[LR]$/, "");
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
  // For joints or detailed head parts, avoid generic dressing clutter
  const b = base(slotId);
  if (["elbow", "knee", "hip", "ankle", "eye", "visor", "mouth", "nose", "chin"].includes(b)) {
    return [];
  }

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

export function specsFor(slotId: string, variant: string, beamZ = 1): Spec[] {
  if (variant === "none") return [];
  if (slotId === "weaponR" || slotId === "weaponL") return weaponSpecs(variant, beamZ);
  if (slotId === "shield") return ensureLR(shieldSpecs(variant));
  if (slotId.startsWith("extra")) return ensureLR(extraSpecs(variant));

  const r = getRecipe(variant);
  const b = base(slotId);
  const isLeft = isLeftSlot(slotId);
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
      raw = eye(r, isLeft);
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
      raw = ear(r, isLeft);
      break;
    case "vfin":
      raw = vfin(r);
      break;
    case "antenna":
      raw = antenna(r, isLeft);
      break;
    case "cheek":
      raw = cheek(r, isLeft);
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
      raw = pec(r, isLeft);
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
      raw = skirtS(r, isLeft);
      break;
    case "shoulder":
      raw = shoulder(r, isLeft);
      break;
    case "upper":
      raw = upper(r, isLeft);
      break;
    case "elbow":
      raw = elbow(r, isLeft);
      break;
    case "forearm":
      raw = forearm(r, isLeft);
      break;
    case "vambrace":
      raw = vambrace(r, isLeft);
      break;
    case "hand":
      raw = hand(r, isLeft);
      break;
    case "hip":
      raw = hip(r, isLeft);
      break;
    case "thigh":
      raw = thigh(r, isLeft);
      break;
    case "knee":
      raw = knee(r, isLeft);
      break;
    case "shin":
      raw = shin(r, isLeft);
      break;
    case "ankle":
      raw = ankle(r, isLeft);
      break;
    case "foot":
      raw = foot(r, isLeft);
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

export function disposePart(group: THREE.Group) {
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
    if (o instanceof THREE.LineSegments) o.geometry.dispose();
  });
}

function createWedgeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    // Front Left Face
    -hw, -hh, 0,
     0,  -hh, hd,
     0,   hh, hd,
    -hw, -hh, 0,
     0,   hh, hd,
    -hw,  hh, 0,

    // Front Right Face
     0,  -hh, hd,
     hw, -hh, 0,
     hw,  hh, 0,
     0,  -hh, hd,
     hw,  hh, 0,
     0,   hh, hd,

    // Back Face
     hw, -hh, -hd,
    -hw, -hh, -hd,
    -hw,  hh, -hd,
     hw, -hh, -hd,
    -hw,  hh, -hd,
     hw,  hh, -hd,

    // Left Face
    -hw, -hh, -hd,
    -hw, -hh,  0,
    -hw,  hh,  0,
    -hw, -hh, -hd,
    -hw,  hh,  0,
    -hw,  hh, -hd,

    // Right Face
     hw, -hh,  0,
     hw, -hh, -hd,
     hw,  hh, -hd,
     hw, -hh,  0,
     hw,  hh, -hd,
     hw,  hh,  0,

    // Top Face
    -hw,  hh,  0,
     0,   hh, hd,
    -hw,  hh, -hd,
     0,   hh, hd,
     0,   hh, -hd,
    -hw,  hh, -hd,

     0,   hh, hd,
     hw,  hh,  0,
     hw,  hh, -hd,
     0,   hh, hd,
     hw,  hh, -hd,
     0,   hh, -hd,

    // Bottom Face
    -hw, -hh, -hd,
     0,  -hh, hd,
    -hw, -hh,  0,
    -hw, -hh, -hd,
     0,  -hh, -hd,
     0,  -hh, hd,

     0,  -hh, hd,
     0,  -hh, -hd,
     hw, -hh, -hd,
     0,  -hh, hd,
     hw, -hh, -hd,
     hw, -hh,  0,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createTrapezoidGeometry(wTop: number, wBot: number, h: number, d = 0.04): THREE.BufferGeometry {
  const hwT = wTop / 2;
  const hwB = wBot / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    // Front
    -hwB, -hh,  hd,   hwB, -hh,  hd,   hwT,  hh,  hd,
    -hwB, -hh,  hd,   hwT,  hh,  hd,  -hwT,  hh,  hd,
    // Back
     hwB, -hh, -hd,  -hwB, -hh, -hd,  -hwT,  hh, -hd,
     hwB, -hh, -hd,  -hwT,  hh, -hd,   hwT,  hh, -hd,
    // Left
    -hwB, -hh, -hd,  -hwB, -hh,  hd,  -hwT,  hh,  hd,
    -hwB, -hh, -hd,  -hwT,  hh,  hd,  -hwT,  hh, -hd,
    // Right
     hwB, -hh,  hd,   hwB, -hh, -hd,   hwT,  hh, -hd,
     hwB, -hh,  hd,   hwT,  hh, -hd,   hwT,  hh,  hd,
    // Top
    -hwT,  hh,  hd,   hwT,  hh,  hd,   hwT,  hh, -hd,
    -hwT,  hh,  hd,   hwT,  hh, -hd,  -hwT,  hh, -hd,
    // Bottom
    -hwB, -hh, -hd,   hwB, -hh, -hd,   hwB, -hh,  hd,
    -hwB, -hh, -hd,   hwB, -hh,  hd,  -hwB, -hh,  hd,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
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
      if (minSide > 0.012) {
        const isCurved = rec.quad === "SR" || rec.quad === "RR";
        const segs = isCurved ? (rec.quad === "RR" ? 3 : 2) : 1; // 1 segment = clean 45-deg chamfer facet!
        const radius = Math.min(minSide * (isCurved ? 0.20 : 0.12), 0.02);
        geo = new RoundedBoxGeometry(bw, bh, bd, segs, Math.max(0.002, radius));
      } else {
        geo = new THREE.BoxGeometry(bw, bh, bd);
      }
    } else if (sp.t === "wedge") {
      geo = createWedgeGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "trap") {
      geo = createTrapezoidGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "cyl") {
      const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
      geo = new THREE.CylinderGeometry(sp.s[0], sp.s[1], sp.s[2], radSegs);
    } else if (sp.t === "sph") {
      if (rec.quad === "SS") geo = new THREE.OctahedronGeometry(sp.s[0]);
      else geo = new THREE.SphereGeometry(sp.s[0], Math.max(12, n), Math.max(10, n - 2));
    } else if (sp.t === "cone") {
      const radSegs = sp.n != null ? sp.n : rec.quad === "SS" ? Math.min(8, Math.max(4, segs)) : Math.max(10, segs);
      geo = new THREE.ConeGeometry(sp.s[1] || sp.s[0], sp.s[2], radSegs);
    } else if (sp.t === "torus") {
      geo = new THREE.TorusGeometry(
        sp.s[0],
        sp.s[1] || 0.02,
        rec.quad === "SS" ? 6 : 14,
        rec.quad === "SS" ? 8 : Math.max(24, n),
      );
    } else if (sp.t === "tetra") {
      geo = new THREE.TetrahedronGeometry(sp.s[0]);
    } else if (sp.t === "octa") {
      geo = new THREE.OctahedronGeometry(sp.s[0]);
    } else if (sp.t === "dodeca") {
      geo = new THREE.DodecahedronGeometry(sp.s[0]);
    } else if (sp.t === "icosa") {
      geo = new THREE.IcosahedronGeometry(sp.s[0]);
    } else if (sp.t === "capsule") {
      geo = new THREE.CapsuleGeometry(sp.s[0], sp.s[1], 6, Math.max(16, n));
    } else if (sp.t === "knot") {
      geo = new THREE.TorusKnotGeometry(sp.s[0], sp.s[1] || 0.02, 80, 10);
    } else if (sp.t === "hemi") {
      geo = new THREE.SphereGeometry(sp.s[0], 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    } else if (sp.t === "ring") {
      geo = new THREE.TorusGeometry(sp.s[0], sp.s[1] || 0.015, 12, 32);
    } else {
      geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }

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
