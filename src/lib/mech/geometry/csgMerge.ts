/**
 * =========================================================================
 * CSG UNION MERGE — fixing the "stack of cans" read
 * =========================================================================
 *
 * `buildPart` used to collapse a material bucket with `mergeGeometries`, which
 * only CONCATENATES buffers into one draw call — every primitive's surface,
 * including the faces buried inside its neighbours, stays in the mesh. Two
 * overlapping boxes of the same material still show as two boxes: their
 * intersection line cuts visibly across whichever one is drawn on top, and at
 * glancing angles the hidden internal faces z-fight. That is the "greebled
 * cans glued together" read, and no amount of chamfering the individual
 * primitives fixes it, because the seam being fixed is between them, not on
 * them.
 *
 * A boolean UNION removes the internal geometry and leaves only the true
 * outer surface — the same volume, but now one continuous solid. Where two
 * masses truly interpenetrate, the seam becomes their real intersection curve
 * instead of two overlapping surfaces, which is what makes a part read as one
 * sculpted mass instead of a bin of parts.
 *
 * This deliberately only unions primitives that share ONE material bucket.
 * The boundary between DIFFERENT materials (white armour meeting a dark
 * frame member, say) is a panel line — a real kit shows that seam on purpose,
 * so it must stay a visible edge, not get dissolved into one blob. Only the
 * same-material "this is one physical piece" boundaries are meant to vanish.
 *
 * `three-bvh-csg` is already a dependency, and this lifts the exact
 * Evaluator/Brush/ADDITION pattern already proven (if unused) in the legacy
 * `geometry/evolution.ts`. No new library, no new technique — just wired into
 * the path that is actually live.
 */

import * as THREE from "three";
import { Evaluator, Brush, ADDITION } from "three-bvh-csg";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const evaluator = new Evaluator();
evaluator.useGroups = false;
evaluator.attributes = ["position", "normal", "uv"];

/**
 * Above this many primitives in one bucket, a chain of N-1 boolean ops starts
 * costing real build time for a benefit no one will see (a busy detail zone
 * reads as detail either way). Parts are memoized per slot, so this only
 * matters once per variant, but it is still a valve worth having.
 */
const MAX_CSG_PARTS = 40;

/**
 * Union every geometry in `list` into one continuous manifold. Falls back to
 * the old plain concatenation on any failure — a degenerate CSG result (open
 * geometry, a primitive shape the library chokes on) must never break the
 * render; it should just miss out on the fusing.
 */
export function mergeBucketCSG(list: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0]!;
  if (list.length > MAX_CSG_PARTS) return mergeGeometries(list, false);

  try {
    // Geometries arriving here already have the spec's placement baked into
    // their vertices (see buildPart), so every Brush sits at identity local
    // transform and `updateMatrixWorld` just needs to run once each.
    let acc = new Brush(list[0]!);
    acc.updateMatrixWorld();
    for (let i = 1; i < list.length; i++) {
      const next = new Brush(list[i]!);
      next.updateMatrixWorld();
      acc = evaluator.evaluate(acc, next, ADDITION);
      acc.updateMatrixWorld();
    }
    const geo = acc.geometry;
    if (!geo?.attributes.position || geo.attributes.position.count === 0) {
      throw new Error("degenerate CSG union");
    }
    geo.computeVertexNormals();
    return geo;
  } catch {
    return mergeGeometries(list, false);
  }
}
