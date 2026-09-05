import { MAPPING_SLOTS } from "./slots";
import type { MapViewsResult, MappedSegment, MappingViews } from "./types";

/**
 * mapViewsToSegments — heuristic mapping pass (no vision LLM yet).
 *
 * Product intent: front + back images → assign crops/textures onto part slots → render.
 * Empty / unmapped segments MUST use visibility "hidden" (UI + renderer hide them).
 *
 * Crops are attached asynchronously via applyMappingCrops() after this pass.
 * This function:
 * - Builds the full segment list from the slot schema
 * - Marks optional / accessory slots hidden until a real mapper fills them
 * - When front and/or back data URLs exist, marks core body / back slots visible
 */
export function mapViewsToSegments(
  front: string | null,
  back: string | null,
): MapViewsResult {
  const hasFront = Boolean(front);
  const hasBack = Boolean(back);
  const hasAny = hasFront || hasBack;

  const frontBias = new Set([
    "Head",
    "Torso",
    "Waist",
    "ArmL",
    "ArmR",
    "LegL",
    "LegR",
    "Weapons",
  ]);
  const backBias = new Set(["Back", "Head", "Torso", "Waist"]);

  const segments: MappedSegment[] = MAPPING_SLOTS.map((slot) => {
    let sourceView: MappedSegment["sourceView"] = null;
    let visibility: MappedSegment["visibility"] = "hidden";

    if (hasAny) {
      const wantsFront = frontBias.has(slot.group);
      const wantsBack = backBias.has(slot.group);

      if (hasFront && hasBack && wantsFront && wantsBack) {
        sourceView = "both";
        visibility = slot.optional ? "hidden" : "visible";
      } else if (hasFront && wantsFront) {
        sourceView = "front";
        visibility = slot.optional ? "hidden" : "visible";
      } else if (hasBack && wantsBack) {
        sourceView = "back";
        visibility =
          slot.group === "Back" ? "visible" : slot.optional ? "hidden" : "visible";
      } else {
        visibility = "hidden";
        sourceView = null;
      }

      // Acc stay hidden until a real mapper fills them
      if (slot.label.startsWith("Acc")) {
        visibility = "hidden";
      }
      // Eye / Face — show generously when front present (RX-78 visor look)
      if ((slot.label === "Eye" || slot.label === "Face") && hasFront) {
        visibility = "visible";
        sourceView = hasBack ? "both" : "front";
      }
      // Weapons: show shield+rifle slots when back view present (RX-78 loadout)
      if (slot.group === "Weapons") {
        if (hasBack) {
          visibility = "visible";
          sourceView = hasFront ? "both" : "back";
        } else {
          visibility = "hidden";
          sourceView = hasFront ? "front" : null;
        }
      }
      // Back pack / thrusters visible when back present (already via backBias);
      // force PackCore + Thruster on for backpack silhouette
      if (slot.group === "Back" && hasBack && (slot.label === "PackCore" || slot.label === "Thruster")) {
        visibility = "visible";
        sourceView = hasFront ? "both" : "back";
      }
    }

    return {
      slotId: slot.id,
      group: slot.group,
      label: slot.label,
      sourceView,
      visibility,
      imageDataUrl: null,
      confidence: visibility === "visible" ? 0.4 : 0,
    };
  });

  return {
    segments,
    note:
      "Heuristic mapper + canvas crops. Vision/LLM mapViewsToSegments still not real — crops are fixed-region heuristics.",
  };
}

export function applyViews(views: MappingViews): MapViewsResult {
  return mapViewsToSegments(views.front, views.back);
}

/** Filter helpers — empty segments hide. */
export function visibleSegments(segments: MappedSegment[]): MappedSegment[] {
  return segments.filter((s) => s.visibility === "visible");
}

export function hideEmptySegments(segments: MappedSegment[]): MappedSegment[] {
  return segments.map((s) =>
    !s.imageDataUrl && s.confidence === 0 && s.sourceView === null
      ? { ...s, visibility: "hidden" as const }
      : s,
  );
}
