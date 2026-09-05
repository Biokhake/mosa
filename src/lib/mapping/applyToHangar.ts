import { SLOTS } from "@/lib/mech/catalog";
import { useStudio } from "@/lib/mech/store";
import type { GroupId } from "@/lib/mech/types";
import type { MappedSegment, MappingGroupId } from "./types";

/** Mapping group → mech store group id. */
export const MAPPING_GROUP_TO_MECH: Record<MappingGroupId, GroupId> = {
  Head: "head",
  Torso: "torso",
  Waist: "waist",
  ArmL: "armL",
  ArmR: "armR",
  LegL: "legL",
  LegR: "legR",
  Back: "back",
  Weapons: "weapon",
};

/**
 * Best-effort mapping slot → mech PART ids (from catalog / types).
 * Unlisted slots fall back to whole-group visibility.
 */
export const MAPPING_SLOT_TO_MECH: Record<string, string[]> = {
  Head1: ["helm"],
  Head2: ["brow", "vfin"],
  Head3: ["jaw", "chin", "cheekL", "cheekR"],
  Face: ["nose", "mouth"],
  Eye: ["visor", "eyeL", "eyeR"],
  Acc1: ["antennaL", "antennaR"],
  Acc2: ["earL", "earR"],
  Acc3: ["extra5", "extra7"],

  Chest1: ["chestCore", "cockpit"],
  Chest2: ["pecL", "pecR"],
  Chest3: ["collar"],
  Body1: ["abdomen"],
  Body2: ["abdomen"],

  Waist_Front: ["skirtF", "pelvis"],
  Waist_Side: ["skirtL", "skirtR"],
  Waist_Back: ["skirtB"],

  ArmL_Shoulder1: ["shoulderL"],
  ArmL_Shoulder2: ["shoulderL"],
  ArmL_Upper: ["upperL", "elbowL"],
  ArmL_Forearm: ["forearmL"],
  ArmL_Vambrace: ["vambraceL"],
  ArmL_Hand: ["handL"],

  ArmR_Shoulder1: ["shoulderR"],
  ArmR_Shoulder2: ["shoulderR"],
  ArmR_Upper: ["upperR", "elbowR"],
  ArmR_Forearm: ["forearmR"],
  ArmR_Vambrace: ["vambraceR"],
  ArmR_Hand: ["handR"],

  LegL_Thigh: ["hipL", "thighL"],
  LegL_Shin1: ["kneeL", "shinL"],
  LegL_Shin2: ["ankleL"],
  LegL_Foot: ["footL"],

  LegR_Thigh: ["hipR", "thighR"],
  LegR_Shin1: ["kneeR", "shinR"],
  LegR_Shin2: ["ankleR"],
  LegR_Foot: ["footR"],

  PackCore: ["pack"],
  Thruster: ["thrusterL", "thrusterR"],
  BinderR: ["binderR"],
  BinderL: ["binderL"],
  Stabilizer: ["stabilizer"],

  WeaponR: ["weaponR"],
  WeaponL: ["weaponL", "shield"],
};

function groupHasVisible(segments: MappedSegment[], group: MappingGroupId): boolean {
  return segments.some((s) => s.group === group && s.visibility === "visible");
}

/**
 * Sync hangar mech visibility from mapping segments.
 * - With an active kit (hasKit): mapped visible groups/slots stay visible; hidden hide.
 * - Without a kit: restore chrome defaults (variant !== "none").
 */
export function applySegmentsToHangar(segments: MappedSegment[], hasKit: boolean): void {
  const studio = useStudio.getState();

  if (!hasKit) {
    studio.showAllParts();
    return;
  }

  // Start from defaults, then override from mapping.
  const visibility: Record<string, boolean> = {};
  for (const def of SLOTS) {
    const cur = studio.slots[def.id];
    // Armor defaults on; weapons/extras stay off unless mapped visible.
    if (def.kind === "weapon" || def.kind === "extra") {
      visibility[def.id] = false;
    } else {
      visibility[def.id] = cur ? cur.variant !== "none" : def.defaultVariant !== "none";
    }
  }

  // Group-level gate first.
  for (const [mGroup, mechGroup] of Object.entries(MAPPING_GROUP_TO_MECH) as [
    MappingGroupId,
    GroupId,
  ][]) {
    const on = groupHasVisible(segments, mGroup);
    for (const def of SLOTS) {
      if (def.group !== mechGroup) continue;
      if (def.kind === "weapon" || def.kind === "extra") {
        // weapons handled per-slot below
        if (!on) visibility[def.id] = false;
      } else {
        visibility[def.id] = on && (studio.slots[def.id]?.variant !== "none");
      }
    }
  }

  // Slot-level refinement when we have an explicit map.
  for (const seg of segments) {
    const mechIds = MAPPING_SLOT_TO_MECH[seg.slotId];
    if (!mechIds?.length) continue;
    const on = seg.visibility === "visible";
    for (const id of mechIds) {
      const cur = studio.slots[id];
      if (!cur) continue;
      const def = SLOTS.find((d) => d.id === id);
      // Weapons/extras with variant "none" stay off here; palette pass equips them.
      if (on && cur.variant === "none" && def && def.kind !== "weapon") {
        visibility[id] = false;
      } else if (on && cur.variant === "none" && def?.kind === "weapon") {
        // Mark intent — applyPaletteFromViews will set rifle/shield variants.
        visibility[id] = true;
      } else {
        visibility[id] = on;
      }
    }
  }

  // Extra group: leave default (usually hidden) unless we mapped Acc → extras.
  for (const def of SLOTS) {
    if (def.group !== "extra") continue;
    if (visibility[def.id] == null) visibility[def.id] = false;
  }

  useStudio.setState((st) => {
    const slots = { ...st.slots };
    for (const id of Object.keys(visibility)) {
      const cur = slots[id];
      if (!cur) continue;
      const nextVis = visibility[id]!;
      if (cur.visible !== nextVis) {
        slots[id] = { ...cur, visible: nextVis };
      }
    }
    return { slots };
  });
}
