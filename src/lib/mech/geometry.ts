import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MatKey, Palette } from "./palette";
import { getLineMat, getPalette } from "./palette";
import { isLeftSlot, isVisorSlot } from "./catalog";
import { getRecipe, type Recipe } from "./recipes";

import type { Spec } from "./geometry/types";
import { B, C, Wedge } from "./geometry/primitives";

// Modular Geometry Generators
import {
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
  chest,
  pec,
  abdomen,
  pelvis,
  skirtF,
  skirtB,
} from "./geometry/torso";

import {
  upper,
  forearm,
  hand,
} from "./geometry/limbs";

import {
  elbow,
  knee,
  hip,
  ankle,
} from "./geometry/joints";

import {
  thruster,
  binder,
  stabilizer,
  weaponSpecs,
  shieldSpecs,
  extraSpecs,
} from "./geometry/equipment";

import { createGeometryByID } from "./geometry/kitFactory";
import { engineShin, engineThigh } from "./geometry/engineSlots";

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


/**
 * Master Prompt 8.0 —묘수 2: shields must have real mass, never a flat plane.
 * Deepen every primary plate and push a shallow wedge boss through the face so
 * the shield reads as a wedge / spherical / pyramidal volume.
 */
function volumizeShield(specs: Spec[]): Spec[] {
  const out: Spec[] = [];
  let cx = 0;
  let cy = 0;
  let maxW = 0.18;
  let n = 0;
  for (const s of specs) {
    let sp = s;
    if (s.m === "prim") {
      if (s.t === "box") {
        sp = { ...s, s: [s.s[0], s.s[1], Math.max(s.s[2], 0.05) * 2.2] as [number, number, number] };
      } else if (s.t === "trap") {
        sp = { ...s, n: Math.max(s.n ?? 0.04, 0.05) * 2.6 };
      } else if (s.t === "cyl") {
        sp = { ...s, s: [s.s[0], s.s[1], Math.max(s.s[2], 0.05) * 2.0] as [number, number, number] };
      }
      cx += s.p[0];
      cy += s.p[1];
      maxW = Math.max(maxW, s.s[0]);
      n += 1;
    }
    out.push(sp);
  }
  if (n > 0) {
    out.push(
      Wedge("sec", maxW * 0.52, maxW * 0.72, maxW * 0.36, cx / n, cy / n, 0.03, 0.15, 0, 0),
    );
  }
  return out;
}

export function specsFor(slotId: string, variant: string, beamZ = 1): Spec[] {
  if (variant === "none") return [];
  if (slotId === "weaponR" || slotId === "weaponL") return weaponSpecs(variant, beamZ);
  if (slotId === "shield") return ensureLR(volumizeShield(shieldSpecs(variant)));
  if (slotId.startsWith("extra")) return ensureLR(extraSpecs(variant));

  const r = getRecipe(variant);
  const b = base(slotId);
  const isLeft = isLeftSlot(slotId);
  let raw: Spec[];

  switch (b) {
    case "helm":
      raw = createGeometryByID(variant, slotId, isLeft, r);
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
    case "chest":
      raw = chest(r, isLeft);
      break;
    case "pec":
      raw = pec(r, isLeft);
      break;
    case "cockpit":
      raw = createGeometryByID(variant, slotId, isLeft, r);
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
      raw = createGeometryByID(variant, slotId, isLeft, r);
      break;
    case "shoulder":
      raw = createGeometryByID(variant, slotId, isLeft, r);
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
      raw = createGeometryByID(variant, slotId, isLeft, r);
      break;
    case "hand":
      raw = hand(r, isLeft);
      break;
    case "hip":
      raw = hip(r, isLeft);
      break;
    case "thigh":
      raw = engineThigh(variant);
      break;
    case "knee":
      raw = knee(r, isLeft);
      break;
    case "shin":
      raw = engineShin(variant);
      break;
    case "ankle":
      raw = ankle(r, isLeft);
      break;
    case "foot":
      raw = createGeometryByID(variant, slotId, isLeft, r);
      break;
    case "pack":
      raw = createGeometryByID(variant, slotId, isLeft, r);
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

  const isSideSlot = isLeftSlot(slotId) || /R$/.test(slotId) || slotId.endsWith("L") || slotId.endsWith("R");
  // Every part now authors its own Part-2 detail (kit-factory layeredAccents,
  // hand-built torso/limb/head geometry). The old generic dressing pass only
  // scattered floating / duplicated shapes, so it is gone.
  return isSideSlot ? raw : ensureLR(raw);
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

function createCowlGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    // Front Nose Wedge (Left)
    -hw * 0.4, -hh * 0.6, hd,   0, -hh * 0.6, hd * 1.1,   0, hh * 0.6, hd * 0.9,
    -hw * 0.4, -hh * 0.6, hd,   0, hh * 0.6, hd * 0.9,  -hw * 0.5, hh * 0.7, hd * 0.6,
    // Front Nose Wedge (Right)
     0, -hh * 0.6, hd * 1.1,   hw * 0.4, -hh * 0.6, hd,   hw * 0.5, hh * 0.7, hd * 0.6,
     0, -hh * 0.6, hd * 1.1,   hw * 0.5, hh * 0.7, hd * 0.6,   0, hh * 0.6, hd * 0.9,
    // Top Crest (Left)
    -hw * 0.5, hh * 0.7, hd * 0.6,   0, hh * 0.6, hd * 0.9,   0, hh * 1.1, -hd * 0.2,
    -hw * 0.5, hh * 0.7, hd * 0.6,   0, hh * 1.1, -hd * 0.2,  -hw * 0.85, hh * 0.9, -hd * 0.4,
    // Top Crest (Right)
     0, hh * 0.6, hd * 0.9,   hw * 0.5, hh * 0.7, hd * 0.6,   hw * 0.85, hh * 0.9, -hd * 0.4,
     0, hh * 0.6, hd * 0.9,   hw * 0.85, hh * 0.9, -hd * 0.4,   0, hh * 1.1, -hd * 0.2,
    // Rear Cranium Dome
     0, hh * 1.1, -hd * 0.2,   hw * 0.85, hh * 0.9, -hd * 0.4,   0, hh * 0.8, -hd,
     0, hh * 1.1, -hd * 0.2,   0, hh * 0.8, -hd,  -hw * 0.85, hh * 0.9, -hd * 0.4,
    -hw * 0.85, hh * 0.9, -hd * 0.4,   0, hh * 0.8, -hd,   0, -hh * 0.7, -hd,
    -hw * 0.85, hh * 0.9, -hd * 0.4,   0, -hh * 0.7, -hd,  -hw * 0.9, -hh * 0.7, -hd * 0.5,
     0, hh * 0.8, -hd,   hw * 0.85, hh * 0.9, -hd * 0.4,   hw * 0.9, -hh * 0.7, -hd * 0.5,
     0, hh * 0.8, -hd,   hw * 0.9, -hh * 0.7, -hd * 0.5,   0, -hh * 0.7, -hd,
    // Left Flank
    -hw * 0.4, -hh * 0.6, hd,  -hw * 0.5, hh * 0.7, hd * 0.6,  -hw * 0.85, hh * 0.9, -hd * 0.4,
    -hw * 0.4, -hh * 0.6, hd,  -hw * 0.85, hh * 0.9, -hd * 0.4,  -hw * 0.9, -hh * 0.7, -hd * 0.5,
    // Right Flank
     hw * 0.5, hh * 0.7, hd * 0.6,   hw * 0.4, -hh * 0.6, hd,   hw * 0.9, -hh * 0.7, -hd * 0.5,
     hw * 0.5, hh * 0.7, hd * 0.6,   hw * 0.9, -hh * 0.7, -hd * 0.5,   hw * 0.85, hh * 0.9, -hd * 0.4,
    // Bottom Base
    -hw * 0.4, -hh * 0.6, hd,  -hw * 0.9, -hh * 0.7, -hd * 0.5,   0, -hh * 0.7, -hd,
    -hw * 0.4, -hh * 0.6, hd,   0, -hh * 0.7, -hd,   0, -hh * 0.6, hd * 1.1,
     0, -hh * 0.6, hd * 1.1,   0, -hh * 0.7, -hd,   hw * 0.9, -hh * 0.7, -hd * 0.5,
     0, -hh * 0.6, hd * 1.1,   hw * 0.9, -hh * 0.7, -hd * 0.5,   hw * 0.4, -hh * 0.6, hd,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createClawGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    -hw, -hh, -hd,   hw, -hh, -hd,   0, -hh * 0.5, hd,
    -hw, -hh, -hd,   0, -hh * 0.5, hd,   0, hh, -hd * 0.2,
     hw, -hh, -hd,   0, hh, -hd * 0.2,   0, -hh * 0.5, hd,
    -hw, -hh, -hd,   hw, -hh, -hd,   0, hh, -hd * 0.2,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createHighHeelGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    -hw * 0.8, -hh * 0.3, hd,   hw * 0.8, -hh * 0.3, hd,   0, -hh * 0.2, hd * 1.2,
    -hw * 0.8, -hh * 0.3, hd,   0, -hh * 0.2, hd * 1.2,   0, hh, 0,
     hw * 0.8, -hh * 0.3, hd,   0, hh, 0,   0, -hh * 0.2, hd * 1.2,
    -hw, hh * 0.6, -hd * 0.5,   hw, hh * 0.6, -hd * 0.5,   0, hh, 0,
    -hw * 0.4, -hh, -hd * 0.6,   hw * 0.4, -hh, -hd * 0.6,   0, hh * 0.6, -hd * 0.5,
    -hw * 0.4, -hh, -hd * 0.6,   0, hh * 0.6, -hd * 0.5,   0, -hh, -hd * 0.3,
     hw * 0.4, -hh, -hd * 0.6,   0, -hh, -hd * 0.3,   0, hh * 0.6, -hd * 0.5,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createHoverGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    -hw * 0.8, hh, hd * 0.8,   hw * 0.8, hh, hd * 0.8,   hw * 0.8, hh, -hd * 0.8,
    -hw * 0.8, hh, hd * 0.8,   hw * 0.8, hh, -hd * 0.8,  -hw * 0.8, hh, -hd * 0.8,
    -hw * 0.8, hh, hd * 0.8,   0, -hh, hd * 1.15,   hw * 0.8, hh, hd * 0.8,
    -hw * 0.8, hh, hd * 0.8,  -hw, -hh, hd,   0, -hh, hd * 1.15,
     hw * 0.8, hh, hd * 0.8,   0, -hh, hd * 1.15,   hw, -hh, hd,
    -hw * 0.8, hh, -hd * 0.8,  -hw, -hh, -hd,  -hw, -hh, hd,
    -hw * 0.8, hh, -hd * 0.8,  -hw, -hh, hd,  -hw * 0.8, hh, hd * 0.8,
     hw * 0.8, hh, hd * 0.8,   hw, -hh, hd,   hw, -hh, -hd,
     hw * 0.8, hh, hd * 0.8,   hw, -hh, -hd,   hw * 0.8, hh, -hd * 0.8,
    -hw * 0.8, hh, -hd * 0.8,  -hw, -hh, -hd,   hw, -hh, -hd,
    -hw * 0.8, hh, -hd * 0.8,   hw, -hh, -hd,   hw * 0.8, hh, -hd * 0.8,
    -hw, -hh, hd,   hw, -hh, hd,   hw, -hh, -hd,
    -hw, -hh, hd,   hw, -hh, -hd,  -hw, -hh, -hd,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createWingMeshGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    -hw, 0, -hd * 0.8,   hw, -hh * 0.2, hd * 0.8,   0, hh, -hd * 0.2,
    -hw, 0, -hd * 0.8,   0, hh, -hd * 0.2,   0, hh * 0.6, -hd,
    -hw, 0, -hd * 0.8,   0, -hh, -hd * 0.2,   hw, -hh * 0.2, hd * 0.8,
    -hw, 0, -hd * 0.8,   0, -hh * 0.6, -hd,   0, -hh, -hd * 0.2,
     hw, -hh * 0.2, hd * 0.8,   0, hh, -hd * 0.2,   0, -hh, -hd * 0.2,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createLayerMeshGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  const vertices = new Float32Array([
    -hw * 0.8, hh, hd * 0.5,   hw * 0.8, hh, hd * 0.5,   hw * 0.9, hh * 0.35, hd * 0.7,
    -hw * 0.8, hh, hd * 0.5,   hw * 0.9, hh * 0.35, hd * 0.7,  -hw * 0.9, hh * 0.35, hd * 0.7,
    -hw * 0.9, hh * 0.35, hd * 0.7,   hw * 0.9, hh * 0.35, hd * 0.7,   hw, -hh * 0.35, hd * 0.9,
    -hw * 0.9, hh * 0.35, hd * 0.7,   hw, -hh * 0.35, hd * 0.9,  -hw, -hh * 0.35, hd * 0.9,
    -hw, -hh * 0.35, hd * 0.9,   hw, -hh * 0.35, hd * 0.9,   hw * 0.85, -hh, hd,
    -hw, -hh * 0.35, hd * 0.9,   hw * 0.85, -hh, hd,  -hw * 0.85, -hh, hd,
    -hw * 0.8, hh, -hd,   hw * 0.8, hh, -hd,   hw * 0.85, -hh, -hd,
    -hw * 0.8, hh, -hd,   hw * 0.85, -hh, -hd,  -hw * 0.85, -hh, -hd,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

export function mirrorGeometryX(srcGeo: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = srcGeo.clone();
  geo.scale(-1, 1, 1);

  if (geo.index) {
    const arr = geo.index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    geo.index.needsUpdate = true;
  } else {
    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i += 3) {
        const x1 = pos.getX(i + 1);
        const y1 = pos.getY(i + 1);
        const z1 = pos.getZ(i + 1);
        const x2 = pos.getX(i + 2);
        const y2 = pos.getY(i + 2);
        const z2 = pos.getZ(i + 2);
        pos.setXYZ(i + 1, x2, y2, z2);
        pos.setXYZ(i + 2, x1, y1, z1);
      }
      pos.needsUpdate = true;
    }
    const uv = geo.attributes.uv;
    if (uv) {
      for (let i = 0; i < uv.count; i += 3) {
        const u1 = uv.getX(i + 1);
        const v1 = uv.getY(i + 1);
        const u2 = uv.getX(i + 2);
        const v2 = uv.getY(i + 2);
        uv.setXY(i + 1, u2, v2);
        uv.setXY(i + 2, u1, v1);
      }
      uv.needsUpdate = true;
    }
  }

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
  const isLeft = isLeftSlot(slotId) && !slotId.startsWith("extra");

  for (const sp of specs) {
    let geo: THREE.BufferGeometry;
    const n = sp.n ?? segs;
    if (sp.geo) {
      geo = sp.geo;
    } else if (sp.t === "box") {
      const [bw, bh, bd] = sp.s;
      const minSide = Math.min(bw, bh, bd);
      const isCurved = rec.quad === "SR" || rec.quad === "RR";
      const segs = isCurved ? (rec.quad === "RR" ? 3 : 2) : 1; // 1 segment = clean polished 45-deg chamfer facet
      // Chamfer scales with the plate: a flat cap made every edge the same
      // absolute width, so big armour panels read as unbevelled. With AO on,
      // a proportional chamfer is what catches the light along an edge.
      const radius = Math.min(minSide * (isCurved ? 0.22 : 0.15), isCurved ? 0.046 : 0.03);
      const safeRadius = Math.max(0.0012, radius);
      geo = new RoundedBoxGeometry(bw, bh, bd, segs, safeRadius);
    } else if (sp.t === "wedge") {
      geo = createWedgeGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "trap") {
      geo = createTrapezoidGeometry(sp.s[0], sp.s[1], sp.s[2], sp.n ?? 0.04);
    } else if (sp.t === "cowl") {
      geo = createCowlGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "claw") {
      geo = createClawGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "heel") {
      geo = createHighHeelGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "hover") {
      geo = createHoverGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "wing") {
      geo = createWingMeshGeometry(sp.s[0], sp.s[1], sp.s[2]);
    } else if (sp.t === "layer") {
      geo = createLayerMeshGeometry(sp.s[0], sp.s[1], sp.s[2]);
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

    if (isLeft) {
      geo = mirrorGeometryX(geo);
    }

    const mesh = new THREE.Mesh(geo, pal[sp.m]);
    if (isLeft) {
      mesh.position.set(-sp.p[0], sp.p[1], sp.p[2]);
      if (sp.r) {
        mesh.rotation.set(sp.r[0], -sp.r[1], -sp.r[2]);
      }
    } else {
      mesh.position.set(sp.p[0], sp.p[1], sp.p[2]);
      if (sp.r) mesh.rotation.set(sp.r[0], sp.r[1], sp.r[2]);
    }
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

  return g;
}
