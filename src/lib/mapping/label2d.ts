/**
 * 2D labeling foundation — map each segment to a label box / polygon on front/back.
 * Head1/2/3 prefer polygonal masks from smartHead; other slots keep heuristic rects.
 * Pipeline: 2D label/cut → tint/edit → then 3D mapping (volume later).
 */

import { resolveSegmentLabelBox, type NormRect } from "./crops";
import type { MappedSegment } from "./types";

export type Label2dView = "front" | "back";

export type NormPoint = { x: number; y: number };

export interface Label2d {
  slotId: string;
  label: string;
  view: Label2dView;
  /** Axis-aligned box — optional when polygon is present. */
  normRect?: NormRect;
  /** Polygonal lasso boundary in normalized image coords (0–1). */
  polygon?: NormPoint[];
  tint: string | null;
  visibility: MappedSegment["visibility"];
}

/** Convert one mapped segment into a 2D label (or null if no region). */
export function segmentToLabel2d(seg: MappedSegment): Label2d | null {
  const box = resolveSegmentLabelBox(seg);
  if (!box) return null;
  if (!box.normRect && !(box.polygon && box.polygon.length >= 3)) return null;
  return {
    slotId: seg.slotId,
    label: seg.label,
    view: box.view,
    normRect: box.normRect,
    polygon: box.polygon,
    tint: seg.tint ?? null,
    visibility: seg.visibility,
  };
}

/** All segments that have a resolvable label (including hidden — callers filter). */
export function segmentsToLabels2d(segments: MappedSegment[]): Label2d[] {
  const out: Label2d[] = [];
  for (const seg of segments) {
    const label = segmentToLabel2d(seg);
    if (label) out.push(label);
  }
  return out;
}

/** Visible segments only — for faint overlays on the 2D figure. */
export function visibleLabels2d(segments: MappedSegment[]): Label2d[] {
  return segmentsToLabels2d(segments).filter((l) => l.visibility === "visible");
}

const HEAD_OVERLAY_IDS = new Set(["Head1", "Head2", "Head3", "Face", "Eye"]);

/**
 * When the Head group is active, only draw Head1/2/3 + Face/Eye overlays so
 * torso heuristic rects (Back/PackCore etc.) do not visually swallow the helmet.
 */
export function labelsForOverlay(
  segments: MappedSegment[],
  selectedGroup: string | null | undefined,
): Label2d[] {
  const labs = visibleLabels2d(segments);
  if (selectedGroup === "Head") {
    return labs.filter((l) => HEAD_OVERLAY_IDS.has(l.slotId));
  }
  return labs;
}
