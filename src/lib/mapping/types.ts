/**
 * Mapping / capture engine types.
 * Front + back views map onto part slots; empty segments are hidden.
 * Pipeline: 2D label/cut → tint/edit → then 3D mapping (volume later).
 */

export type MappingGroupId =
  | "Head"
  | "Torso"
  | "Waist"
  | "ArmL"
  | "ArmR"
  | "LegL"
  | "LegR"
  | "Back"
  | "Weapons";

export type SegmentVisibility = "visible" | "hidden";

export interface MappingSlotDef {
  id: string;
  group: MappingGroupId;
  label: string;
  /** When true, slot may be omitted from the active set without breaking topology. */
  optional?: boolean;
  /** Optional group alias — multiple slot ids can share a display group key. */
  groupKey?: string;
}

export interface MappedSegment {
  slotId: string;
  group: MappingGroupId;
  label: string;
  /** Source view that contributed this segment, if any. */
  sourceView: "front" | "back" | "both" | null;
  /** Empty / unmapped segments use "hidden" and must not render. */
  visibility: SegmentVisibility;
  /** Display crop (may be tinted). */
  imageDataUrl?: string | null;
  /** Untinted original crop — used when re-applying tint. */
  baseImageDataUrl?: string | null;
  /** Optional part paint hex applied via setSegmentTint (2D first). */
  tint?: string | null;
  /** Confidence stub for future vision/LLM mapping. */
  confidence?: number;
  /**
   * Optional polygonal label boundary in normalized image coords (0–1).
   * Preferred for Head1/2/3 smart detection; overlays stroke this instead of rects.
   */
  polygon?: { x: number; y: number }[] | null;
  /** Axis-aligned bbox (optional when polygon present). */
  normRect?: { x: number; y: number; w: number; h: number } | null;
  /** View the polygon / crop was taken from. */
  labelView?: "front" | "back" | null;
}

export interface MappingViews {
  front: string | null;
  back: string | null;
}

export interface MappingState {
  views: MappingViews;
  segments: MappedSegment[];
  /** Slot ids explicitly omitted by the user (grouped/omitted). */
  omittedSlotIds: string[];
  /** Slot ids grouped under a shared key → member ids. */
  groups: Record<string, string[]>;
  selectedSlotId: string | null;
  selectedGroup: MappingGroupId;
  status: "idle" | "mapping" | "ready" | "error";
  message?: string;
}

export interface MapViewsResult {
  segments: MappedSegment[];
  /** Documented next step: real vision/LLM mapping replaces this stub. */
  note: string;
}

export interface MappingKit {
  id: string;
  name: string;
  front: string;
  back: string;
  createdAt: number;
}
