import type { MatKey } from "../palette";
import type { Recipe } from "../recipes";
import type { Spec } from "./types";

export const B = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "box",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const C = (
  m: MatKey,
  rt: number,
  rb: number,
  h: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  n?: number,
): Spec => ({
  t: "cyl",
  m,
  s: [rt, rb, h],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
  n,
});

export const Sp = (m: MatKey, r: number, x = 0, y = 0, z = 0, n?: number): Spec => ({
  t: "sph",
  m,
  s: [r, r, r],
  p: [x, y, z],
  n,
});

export const N = (
  m: MatKey,
  rt: number,
  rb: number,
  h: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "cone",
  m,
  s: [rt, rb, h],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Torus = (
  m: MatKey,
  r: number,
  tube: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  n?: number,
): Spec => ({
  t: "torus",
  m,
  s: [r, tube, 0],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
  n,
});

export const Capsule = (
  m: MatKey,
  r: number,
  len: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  n?: number,
): Spec => ({
  t: "capsule",
  m,
  s: [r, len, 0],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
  n,
});

export const Octa = (m: MatKey, r: number, x = 0, y = 0, z = 0): Spec => ({
  t: "octa",
  m,
  s: [r, 0, 0],
  p: [x, y, z],
});

export const Wedge = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "wedge",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Trap = (
  m: MatKey,
  wTop: number,
  wBot: number,
  h: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "trap",
  m,
  s: [wTop, wBot, h],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Cowl = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "cowl",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Claw = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "claw",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Heel = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "heel",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const Hover = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "hover",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const WingMesh = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "wing",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export const LayerMesh = (
  m: MatKey,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec => ({
  t: "layer",
  m,
  s: [w, h, d],
  p: [x, y, z],
  r: rx || ry || rz ? [rx, ry, rz] : undefined,
});

export function base(slot: string): string {
  return slot.replace(/[LR]$/, "");
}

export function nSeg(r: Recipe, extra = 0): number {
  if (r.quad === "SS") return Math.min(8, Math.max(4, r.segs + extra));
  return Math.max(8, r.segs + extra);
}

export function layersFor(r: Recipe): number {
  return 2 + Math.floor((r.density - 1) / 3);
}

export function poly(
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

export function mass(
  r: Recipe,
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
): Spec {
  if (r.quad === "SS") return B(m, w, h, d, x, y, z, rx, ry, rz);
  if (r.quad === "SR") return B(m, w, h, d, x, y, z, rx, ry, rz);
  if (r.quad === "RR") {
    if (Math.abs(w - h) < 0.08 && Math.abs(h - d) < 0.08) {
      return Sp(m, Math.max(w, h, d) * 0.5, x, y, z, r.segs);
    }
    const rad = Math.min(w, d) * 0.5;
    return C(m, rad, rad * 0.92, h, x, y, z, rx, ry, rz, r.segs);
  }
  const rad = Math.min(w, d) * 0.48;
  return C(m, rad, rad * 0.88, h, x, y, z, rx, ry, rz, r.segs);
}

/**
 * Realistic Linear Servo Actuator (Hydraulic / Electric Piston).
 * Generates an outer cylinder sleeve, an inner polished piston rod, collar rings,
 * and clevis mounting eyelets.
 */
export function makeServoActuator(
  mBarrel: MatKey,
  mPiston: MatKey,
  x: number,
  y: number,
  z: number,
  totalLen: number,
  radius: number,
  rx = 0,
  ry = 0,
  rz = 0,
  segs = 12,
): Spec[] {
  const barrelLen = totalLen * 0.58;
  const rodLen = totalLen * 0.52;
  const rodRad = radius * 0.55;
  const collarRad = radius * 1.25;

  return [
    // Outer Barrel Sleeve
    C(mBarrel, radius, radius, barrelLen, x, y - totalLen * 0.2, z, rx, ry, rz, segs),
    // Reinforcement / Port Ring
    C("joint", collarRad, collarRad, barrelLen * 0.16, x, y - totalLen * 0.06, z, rx, ry, rz, segs),
    // Hydraulic Port Nipple
    B("acc", radius * 0.6, radius * 0.6, radius * 0.8, x, y - totalLen * 0.06, z + radius * 0.9, rx, ry, rz),
    // Endcap mount bracket
    C("joint", radius * 1.1, radius * 1.1, barrelLen * 0.14, x, y - totalLen * 0.45, z, rx, ry, rz, segs),
    // Polished Piston Rod
    C(mPiston, rodRad, rodRad, rodLen, x, y + totalLen * 0.22, z, rx, ry, rz, segs),
    // Rod Eyelet End Mount
    C("joint", radius * 0.85, radius * 0.85, rodRad * 1.8, x, y + totalLen * 0.46, z, rx + Math.PI / 2, ry, rz, segs),
  ];
}

/**
 * Rotary Servo Actuator Unit.
 * Concentric motor drum with mounting flange, bolt detail, and central axle pivot.
 */
export function makeRotaryServo(
  mBody: MatKey,
  mCore: MatKey,
  x: number,
  y: number,
  z: number,
  radius: number,
  width: number,
  rx = 0,
  ry = 0,
  rz = 0,
  segs = 16,
): Spec[] {
  return [
    // Outer Motor Housing Drum
    C(mBody, radius, radius, width * 0.88, x, y, z, rx, ry, rz, segs),
    // Flange Retaining Ring
    C("joint", radius * 1.12, radius * 1.12, width * 0.25, x, y, z, rx, ry, rz, segs),
    // Toroidal Seal / Bearing Race
    Torus("trim", radius * 0.92, radius * 0.07, x, y, z, rx + Math.PI / 2, ry, rz),
    // Central Axle Hub
    C(mCore, radius * 0.46, radius * 0.46, width * 1.05, x, y, z, rx, ry, rz, segs),
    // Hex Center Pin / Nut Cap
    C("metal", radius * 0.26, radius * 0.26, width * 1.15, x, y, z, rx, ry, rz, 6),
  ];
}

/**
 * Interlocking Dual-Clevis Hinge Assembly.
 * Robust mechanical hinge with side bracket plates and center pivot knuckle.
 */
export function makeHingeBracket(
  mBracket: MatKey,
  mPin: MatKey,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec[] {
  const plateThick = Math.max(0.012, w * 0.16);
  const flankOff = (w - plateThick) * 0.5;
  const pinRad = Math.min(h, d) * 0.26;

  return [
    // Left bracket flank plate
    B(mBracket, plateThick, h, d, x - flankOff, y, z, rx, ry, rz),
    // Right bracket flank plate
    B(mBracket, plateThick, h, d, x + flankOff, y, z, rx, ry, rz),
    // Center interlocking knuckle
    B("joint", w * 0.44, h * 0.72, d * 0.82, x, y, z, rx, ry, rz),
    // Through-hole Pivot Pin
    C(mPin, pinRad, pinRad, w * 1.14, x, y, z, rx, ry, rz + Math.PI / 2, 12),
    // Pin Hex Retainer on Left
    C("metal", pinRad * 1.3, pinRad * 1.3, plateThick * 0.6, x - flankOff - plateThick * 0.5, y, z, rx, ry, rz + Math.PI / 2, 6),
    // Pin Hex Retainer on Right
    C("metal", pinRad * 1.3, pinRad * 1.3, plateThick * 0.6, x + flankOff + plateThick * 0.5, y, z, rx, ry, rz + Math.PI / 2, 6),
  ];
}

/**
 * Exposed Skeletal Chassis / Truss Beam with structural cutouts.
 */
export function makeSkeletalTruss(
  mFrame: MatKey,
  mCutout: MatKey,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec[] {
  return [
    // Main structural spine
    B(mFrame, w * 0.75, h, d * 0.7, x, y, z, rx, ry, rz),
    // Side structural rails
    B(mFrame, w * 0.18, h * 0.95, d * 0.85, x - w * 0.38, y, z, rx, ry, rz),
    B(mFrame, w * 0.18, h * 0.95, d * 0.85, x + w * 0.38, y, z, rx, ry, rz),
    // Dark recessed relief cutouts (weight reduction lightening holes)
    B(mCutout, w * 0.48, h * 0.22, d * 0.78, x, y + h * 0.24, z, rx, ry, rz),
    B(mCutout, w * 0.48, h * 0.22, d * 0.78, x, y - h * 0.24, z, rx, ry, rz),
    // Cross-brace diagonal tie rod
    C("metal", 0.012, 0.012, h * 0.8, x, y, z, rx + 0.3, ry, rz, 8),
  ];
}

/**
 * Standoff Armor Plate Layer (for M~Z Ornate Kits).
 * Adds a floating geometric armor plate elevated above the frame with visible mounting studs.
 */
export function makeStandoffArmor(
  recipe: Recipe,
  mArmor: MatKey,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  standoffDist = 0.035,
  rx = 0,
  ry = 0,
  rz = 0,
): Spec[] {
  if (!recipe.ornate) return [];

  const plateThick = Math.max(0.014, d * 0.28);
  const out: Spec[] = [
    // Floating Outer Armor Plate
    mass(recipe, mArmor, w, h, plateThick, x, y, z + standoffDist, rx, ry, rz),
    // Corner Mounting Standoff Studs / Fasteners
    C("metal", 0.009, 0.009, standoffDist * 1.5, x - w * 0.38, y + h * 0.36, z + standoffDist * 0.5, rx + Math.PI / 2, ry, rz, 6),
    C("metal", 0.009, 0.009, standoffDist * 1.5, x + w * 0.38, y + h * 0.36, z + standoffDist * 0.5, rx + Math.PI / 2, ry, rz, 6),
    C("metal", 0.009, 0.009, standoffDist * 1.5, x - w * 0.38, y - h * 0.36, z + standoffDist * 0.5, rx + Math.PI / 2, ry, rz, 6),
    C("metal", 0.009, 0.009, standoffDist * 1.5, x + w * 0.38, y - h * 0.36, z + standoffDist * 0.5, rx + Math.PI / 2, ry, rz, 6),
  ];

  // High density add-on: Reactive Armor / Aerodynamic Slat
  if (recipe.density >= 6) {
    out.push(
      B("trim", w * 0.7, h * 0.12, plateThick * 1.25, x, y, z + standoffDist + plateThick * 0.6, rx, ry, rz),
    );
  }
  if (recipe.density >= 9) {
    out.push(
      B("acc", w * 0.14, h * 0.65, plateThick * 1.3, x, y, z + standoffDist + plateThick * 0.65, rx, ry, rz),
    );
  }

  return out;
}

/**
 * Mechanical Cooling / Radiator Fins.
 */
export function makeCoolingFins(
  mFin: MatKey,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  count = 4,
  axis: "y" | "x" = "y",
): Spec[] {
  const out: Spec[] = [];
  const finThick = 0.008;
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : (i / (count - 1) - 0.5);
    if (axis === "y") {
      out.push(B(mFin, w, finThick, d, x, y + t * h, z));
    } else {
      out.push(B(mFin, finThick, h, d, x + t * w, y, z));
    }
  }
  return out;
}

export function densitySeams(r: Recipe, w: number, h: number, d: number, zf: number): Spec[] {
  if (r.ornate) return [];
  const n = Math.floor((r.density - 1) / 3);
  const out: Spec[] = [];
  for (let i = 0; i < n; i++) {
    const yy = -h * 0.28 + i * (h * 0.26);
    out.push(B("dark", w * 0.72, Math.max(0.008, h * 0.04), Math.max(0.01, d * 0.1), 0, yy, zf));
  }
  if (r.density >= 8) {
    out.push(B("dark", Math.max(0.01, w * 0.04), h * 0.62, d * 0.08, 0, 0, zf * 0.8));
  }
  return out;
}

export function rsNubs(r: Recipe, pts: Array<[number, number, number, number?]>): Spec[] {
  if (r.quad !== "RS") return [];
  return pts.map(([x, y, z, h]) => N("acc", 0.006, 0.016, h ?? 0.07, x, y, z));
}

const P2_MATS = new Set<MatKey>(["sec", "acc", "trim", "dark", "metal", "joint"]);

export function flipX(s: Spec): Spec {
  const r = s.r ? ([s.r[0], -s.r[1], -s.r[2]] as [number, number, number]) : undefined;
  return { ...s, p: [-s.p[0], s.p[1], s.p[2]], r };
}

export function ensureLR(specs: Spec[], eps = 0.012): Spec[] {
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

export function primBounds(specs: Spec[]) {
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

export function slotSalt(id: string) {
  const b = base(id);
  let n = 0;
  for (let i = 0; i < b.length; i++) n = (n * 33 + b.charCodeAt(i)) | 0;
  return Math.abs(n);
}

export function dressPart2(prim: Spec[], r: Recipe, slotId: string): Spec[] {
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
