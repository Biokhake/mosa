/**
 * =========================================================================
 * WHOLE-KIT CRITIC
 * =========================================================================
 *
 * The per-part critic can only see one part. Several of the properties that
 * decide whether a design reads as *composed* exist only across the assembly:
 *
 *   - accent colour is a BUDGET, not a per-part choice. Ten parts each
 *     "tastefully" spending 15% on accent produce a harlequin.
 *   - edge language must be consistent. A kit that mixes razor chamfers with
 *     pillow fillets reads as parts from two different models.
 *   - the assembled silhouette is what a viewer actually sees; a leg that is
 *     individually fine can still stack into a shapeless column.
 *   - part boundaries should flow. A sharp width jump at the knee reads as a
 *     join, not a limb.
 */

import { clamp } from "./rng";
import type { Brief, KitArtifact, Prim } from "./types";
import { rasterize, measureSilhouette } from "./raster";
import type { SilhouetteMetrics } from "./raster";

export interface KitCritique {
  score: number;
  penalties: Record<string, number>;
  notes: string[];
  silhouette: SilhouetteMetrics;
  /** share of total volume spent on the accent role */
  accentShare: number;
}

function primVolume(p: Prim): number {
  const [a, b, c] = p.size.map(Math.abs) as [number, number, number];
  switch (p.kind) {
    case "box":
    case "wedge":
      return a * b * c * (p.kind === "wedge" ? 0.5 : 1);
    case "trapPrism":
      return ((a + b) / 2) * c * (p.depth ?? 0.04);
    case "cyl":
      return Math.PI * ((a + b) / 2) ** 2 * c;
    case "cone":
      return (Math.PI / 3) * b ** 2 * c;
    case "capsule":
      return Math.PI * a ** 2 * b + (4 / 3) * Math.PI * a ** 3;
    case "sphere":
      return (4 / 3) * Math.PI * a ** 3;
    case "hemi":
      return (2 / 3) * Math.PI * a ** 3;
    case "octa":
      return (4 / 3) * a ** 3;
    case "torus":
      return 2 * Math.PI ** 2 * a * b ** 2;
    default:
      return a * a * a;
  }
}

/** Mean bevel of the armour masses in one part — its "edge language". */
function edgeLanguage(prims: Prim[]): number | null {
  const m = prims.filter((p) => p.tier === "mass" && p.zone === "armor");
  if (!m.length) return null;
  return m.reduce((s, p) => s + (p.bevel ?? 0), 0) / m.length;
}

/**
 * `placed` is the kit's prims already transformed into a common body frame.
 * Without it the parts would be measured stacked on top of one another rather
 * than end to end, and every assembled reading would be meaningless.
 */
export function critiqueKit(kit: KitArtifact, brief: Brief, placed?: Prim[]): KitCritique {
  const pen: Record<string, number> = {};
  const notes: string[] = [];
  const slots = Object.values(kit.slots).filter(Boolean);
  const all: Prim[] = placed ?? slots.flatMap((s) => s!.prims);

  const sil = measureSilhouette(rasterize(all, "front", 128));

  // --- 1. accent is a budget spent across the whole kit --------------------
  let total = 0;
  let accent = 0;
  for (const p of all) {
    const v = primVolume(p);
    total += v;
    if (p.role === "accent") accent += v;
  }
  const accentShare = total > 0 ? accent / total : 0;
  const accentCap = 0.06 + brief.decoration * 0.06; // 6%..12%
  if (accentShare > accentCap) {
    pen.accentBudget = clamp((accentShare - accentCap) * 3.5, 0, 0.28);
    notes.push(`accent spends ${(accentShare * 100).toFixed(0)}% of the kit (cap ${(accentCap * 100).toFixed(0)}%)`);
  }

  // --- 2. one edge language across the assembly ----------------------------
  const langs = slots.map((s) => edgeLanguage(s!.prims)).filter((v): v is number => v != null);
  if (langs.length > 1) {
    const mean = langs.reduce((a, b) => a + b, 0) / langs.length;
    const spread = Math.max(...langs) - Math.min(...langs);
    void mean;
    if (spread > 0.35) {
      pen.edgeLanguage = clamp((spread - 0.35) * 0.7, 0, 0.25);
      notes.push(`edge treatment varies ${spread.toFixed(2)} across parts — mixed language`);
    }
  }

  // --- 3. the assembled silhouette, not the parts --------------------------
  if (sil.readability < 0.8) {
    pen.kitReadability = clamp((0.8 - sil.readability) * 1.2, 0, 0.26);
    notes.push(`assembled silhouette weak at thumbnail size (${sil.readability.toFixed(2)})`);
  }
  // NB. while only one leg is engine-driven, the "assembly" is a single limb,
  // which is not obliged to be symmetric about its own axis — this catches
  // genuine lopsidedness, not normal limb asymmetry.
  if (sil.balance > 0.13) {
    pen.kitBalance = clamp((sil.balance - 0.13) * 1.6, 0, 0.24);
    notes.push(`assembly leans ${(sil.balance * 100).toFixed(0)}% to one side`);
  }
  // a shapeless column: tall, uniform width, nothing to read
  if (sil.profileJitter < 0.035 && sil.verticality > 2.2) {
    pen.kitMonotony = 0.14;
    notes.push("assembled profile is a uniform column — no hierarchy along its length");
  }

  // --- 4. parts should flow into each other --------------------------------
  // compare the width of each part's silhouette where they meet
  if (slots.length > 1) {
    const widths = slots.map((s) => {
      const r = rasterize(s!.prims, "front", 64);
      return (r.box.u1 - r.box.u0 + 1) / Math.max(1, r.res);
    });
    let jump = 0;
    for (let i = 1; i < widths.length; i++) {
      const a = widths[i - 1]!;
      const b = widths[i]!;
      jump = Math.max(jump, Math.abs(a - b) / Math.max(a, b, 1e-4));
    }
    if (jump > 0.42) {
      pen.partContinuity = clamp((jump - 0.42) * 0.5, 0, 0.2);
      notes.push(`${Math.round(jump * 100)}% width jump between adjacent parts`);
    }
  }

  const totalPen = Object.values(pen).reduce((a, b) => a + b, 0);
  return { score: clamp(1 - totalPen, 0, 1), penalties: pen, notes, silhouette: sil, accentShare };
}
