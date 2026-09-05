import type { MappingGroupId, MappingSlotDef } from "./types";
import slotsJson from "./slots.json";

/** Canonical slot schema (Body1/Body2 — not Body12; LegL + LegR). */
export const SLOT_GROUPS: Record<MappingGroupId, readonly string[]> = {
  Head: ["Head1", "Head2", "Head3", "Face", "Eye", "Acc1", "Acc2", "Acc3"],
  Torso: ["Chest1", "Chest2", "Chest3", "Body1", "Body2"],
  Waist: ["Front", "Side", "Back"],
  ArmL: ["Shoulder1", "Shoulder2", "Upper", "Forearm", "Vambrace", "Hand"],
  ArmR: ["Shoulder1", "Shoulder2", "Upper", "Forearm", "Vambrace", "Hand"],
  LegL: ["Thigh", "Shin1", "Shin2", "Foot"],
  LegR: ["Thigh", "Shin1", "Shin2", "Foot"],
  Back: ["PackCore", "Thruster", "BinderR", "BinderL", "Stabilizer"],
  Weapons: ["WeaponR", "WeaponL"],
};

export const MAPPING_GROUP_ORDER: MappingGroupId[] = [
  "Head",
  "Torso",
  "Waist",
  "ArmL",
  "ArmR",
  "LegL",
  "LegR",
  "Back",
  "Weapons",
];

/** Unique runtime slot id — ArmL/ArmR and LegL/LegR share local names. */
export function slotId(group: MappingGroupId, localName: string): string {
  if (group === "ArmL" || group === "ArmR" || group === "LegL" || group === "LegR") {
    return `${group}_${localName}`;
  }
  if (group === "Waist") {
    return `Waist_${localName}`;
  }
  return localName;
}

export function buildSlotDefs(): MappingSlotDef[] {
  const defs: MappingSlotDef[] = [];
  for (const group of MAPPING_GROUP_ORDER) {
    for (const local of SLOT_GROUPS[group]) {
      const id = slotId(group, local);
      const optional =
        group === "Back" ||
        group === "Weapons" ||
        local.startsWith("Acc") ||
        local === "Eye" ||
        local === "Face";
      defs.push({
        id,
        group,
        label: local,
        optional,
        groupKey: group,
      });
    }
  }
  return defs;
}

export const MAPPING_SLOTS: MappingSlotDef[] = buildSlotDefs();

export const MAPPING_SLOT_BY_ID: Record<string, MappingSlotDef> = Object.fromEntries(
  MAPPING_SLOTS.map((s) => [s.id, s]),
);

export function slotsInGroup(group: MappingGroupId): MappingSlotDef[] {
  return MAPPING_SLOTS.filter((s) => s.group === group);
}

/** Omit one or more slots from the active set (does not delete schema). */
export function omitSlots(activeIds: string[], omitIds: Iterable<string>): string[] {
  const omit = new Set(omitIds);
  return activeIds.filter((id) => !omit.has(id));
}

/** Group several slot ids under a shared key (UI / export helper). */
export function groupSlots(
  groups: Record<string, string[]>,
  key: string,
  memberIds: string[],
): Record<string, string[]> {
  return { ...groups, [key]: [...memberIds] };
}

/** Ungroup — remove a group key. */
export function ungroupSlots(
  groups: Record<string, string[]>,
  key: string,
): Record<string, string[]> {
  const next = { ...groups };
  delete next[key];
  return next;
}

/** Validate against bundled slots.json (source of truth from product schema). */
export function assertSlotsJsonMatches(): void {
  const json = slotsJson as {
    slots: Record<string, string[]>;
  };
  for (const group of MAPPING_GROUP_ORDER) {
    const expected = SLOT_GROUPS[group];
    const fromJson = json.slots[group];
    if (!fromJson || fromJson.length !== expected.length) {
      throw new Error(`slots.json mismatch for group ${group}`);
    }
    for (let i = 0; i < expected.length; i++) {
      if (fromJson[i] !== expected[i]) {
        throw new Error(`slots.json mismatch ${group}[${i}]: ${fromJson[i]} vs ${expected[i]}`);
      }
    }
  }
}
