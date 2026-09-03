/**
 * =========================================================================
 * KIT DNA — Procedural Seed Generation (Master Prompt 8.0)
 * =========================================================================
 *
 * The problem this solves: an AI that "just varies things" ends up reusing
 * the same box-shrunk-a-bit recipe for all 100 kits. Instead we turn the kit
 * ID itself (e.g. "SSG-007") into a deterministic hash and derive a small set
 * of orthogonal design parameters from it. Every part factory then *reads*
 * these numbers rather than eyeballing a shape, so:
 *
 *   - two kits can never collapse to the same silhouette by accident
 *   - the base shape, the layer count, the panel depth and the bevel style
 *     all move independently (decorrelated PRNG streams)
 *   - the accent layer is forced to a *different* primitive than the base
 *     (cross-combination) so panels read as assembled parts, not one blob
 *
 * The band grammar still rules the shape vocabulary (SS = angular prisms,
 * RR = round volumes …) — DNA picks *within* the band-legal pool.
 */

export type Quad = "SS" | "SR" | "RS" | "RR";

/** Primitive families the layered factories can stack. */
export const SHAPE = {
  BOX: 0,
  HEX: 1,
  CYL: 2,
  TRAP: 3,
  DOME: 4,
  CONE: 5,
  WEDGE: 6,
  OCTA: 7,
} as const;
export type ShapeId = (typeof SHAPE)[keyof typeof SHAPE];

/** Band-legal primitive pools. DNA indexes into these, never outside. */
const SHAPE_POOL: Record<Quad, ShapeId[]> = {
  // angular, sharp — boxes and low-count prisms only
  SS: [SHAPE.BOX, SHAPE.HEX, SHAPE.TRAP, SHAPE.WEDGE, SHAPE.OCTA, SHAPE.BOX],
  // straight body with filleted corners — boxes / traps, a soft cylinder
  SR: [SHAPE.BOX, SHAPE.TRAP, SHAPE.HEX, SHAPE.CYL, SHAPE.WEDGE, SHAPE.TRAP],
  // curved silhouette with pointed accents — cylinders, cones, wedges
  RS: [SHAPE.CYL, SHAPE.CONE, SHAPE.TRAP, SHAPE.WEDGE, SHAPE.HEX, SHAPE.CYL],
  // spheres / capsules / high-segment curves — no sharp prisms
  RR: [SHAPE.CYL, SHAPE.DOME, SHAPE.CYL, SHAPE.TRAP, SHAPE.CONE, SHAPE.DOME],
};

export interface KitDNA {
  id: string;
  quad: Quad;
  /** 32-bit unsigned avalanche hash of the kit ID. */
  hash: number;
  /** Base armor primitive (Layer 0/1) — band-legal. */
  baseShape: ShapeId;
  /** Accent primitive (Layer 2+) — band-legal AND guaranteed != baseShape. */
  accentShape: ShapeId;
  /** How many armor plates stack per part. 2..5. */
  layerCount: number;
  /** Depth amplifier for shells/shields/chest. 1.5..4.0. */
  zVolume: number;
  /** 0 = sharp, 1 = chamfer, 2 = round. */
  bevelType: number;
  /** Per-layer yaw offset (rad) so stacked plates fan out. -0.32..0.32 */
  twist: number;
  /** Top/bottom width ratio for tapered plates. 0.55..1.0 */
  taper: number;
  /** Lateral spread applied to each successive layer. -0.28..0.40 */
  splay: number;
  /** Each layer's z step-out as a fraction of part depth. 0.28..0.62 */
  step: number;
}

/** FNV-1a + final avalanche. Deterministic, well-distributed over short IDs. */
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** mulberry32 PRNG — one call = one decorrelated [0,1) stream. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function quadOf(id: string): Quad {
  const q = id.slice(0, 2).toUpperCase();
  return q === "SR" || q === "RS" || q === "RR" ? (q as Quad) : "SS";
}

const DNA_CACHE = new Map<string, KitDNA>();

/**
 * Parse a kit ID into its procedural design DNA. Pure + memoised.
 */
export function generateKitDNA(kitId: string): KitDNA {
  const id = (kitId || "SSA-001").trim().toUpperCase();
  const cached = DNA_CACHE.get(id);
  if (cached) return cached;

  const hash = hashStr(id);
  const quad = quadOf(id);
  const pool = SHAPE_POOL[quad];

  // Separate the hash into independent nibbles/bytes, then jitter each with
  // its own PRNG so no two parameters track each other.
  const rShape = mulberry32(hash ^ 0x9e3779b9);
  const rAccent = mulberry32(hash ^ 0x7f4a7c15);
  const rLayer = mulberry32(hash ^ 0x2545f491);
  const rVol = mulberry32(hash ^ 0x94d049bb);
  const rBevel = mulberry32(hash ^ 0xff51afd7);
  const rForm = mulberry32(hash ^ 0xc4ceb9fe);

  const baseShape = pool[Math.floor(rShape() * pool.length)]!;
  // accent: walk the pool until we land on a different family
  let accentShape = pool[Math.floor(rAccent() * pool.length)]!;
  if (accentShape === baseShape) {
    const alt = pool.filter((s) => s !== baseShape);
    accentShape = alt.length ? alt[Math.floor(rAccent() * alt.length)]! : accentShape;
  }

  const layerCount = 2 + Math.floor(rLayer() * 4); // 2..5
  const zVolume = lerp(1.5, 4.0, rVol());
  const bevelType = quad === "SS" ? 0 : Math.floor(rBevel() * 3); // SS stays sharp
  const twist = lerp(-0.32, 0.32, rForm());
  const taper = lerp(0.55, 1.0, rShape());
  const splay = lerp(-0.28, 0.4, rAccent());
  const step = lerp(0.28, 0.62, rLayer());

  const dna: KitDNA = {
    id,
    quad,
    hash,
    baseShape,
    accentShape,
    layerCount,
    zVolume,
    bevelType,
    twist,
    taper,
    splay,
    step,
  };
  DNA_CACHE.set(id, dna);
  return dna;
}
