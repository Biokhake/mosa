import { create } from "zustand";
import { applySegmentsToHangar } from "./applyToHangar";
import { applyPaletteAfterMapping } from "./applyPaletteFromViews";
import { applyMappingCrops } from "./crops";
import { mapViewsToSegments, visibleSegments } from "./engine";
import { clearSmartHeadCache, type MergeHead12Mode } from "./smartHead";
import { groupSlots, slotsInGroup, ungroupSlots } from "./slots";
import { tintImageDataUrl } from "./tint";
import type { MappingGroupId, MappingKit, MappingState, MappedSegment } from "./types";

const initial = mapViewsToSegments(null, null);

function newKitId(): string {
  return `kit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface MappingStore extends MappingState {
  hideEmpty: boolean;
  kits: MappingKit[];
  activeKitId: string | null;
  setFront: (dataUrl: string | null) => void;
  setBack: (dataUrl: string | null) => void;
  runMap: () => void;
  setSelectedSlotId: (id: string | null) => void;
  setSelectedGroup: (g: MappingGroupId) => void;
  setHideEmpty: (v: boolean) => void;
  omitSlot: (id: string) => void;
  restoreSlot: (id: string) => void;
  groupSelected: (key: string, ids: string[]) => void;
  ungroup: (key: string) => void;
  visibleForUi: () => MappedSegment[];
  /** Parts list: schema slots for group, optionally filtering empty→hidden. */
  slotsForGroupUi: (group: MappingGroupId) => MappedSegment[];
  addKit: (input: { name: string; front: string; back: string }) => string;
  selectKit: (id: string) => void;
  removeKit: (id: string) => void;
  copyKit: (id: string) => string | null;
  renameKit: (id: string, name: string) => void;
  updateActiveKitViews: (front: string | null, back: string | null) => void;
  updateKitViews: (id: string, front: string | null, back: string | null) => void;
  /**
   * Recolor a mapping segment's crop toward hex and store tint.
   * Updates imageDataUrl from baseImageDataUrl via canvas tint.
   */
  setSegmentTint: (slotId: string, hex: string | null) => void;
  /**
   * Head1+Head2 merge mode:
   * - auto: detector merges when top protrusion is weak (Zaku-like)
   * - forceMerge: always fold Head2 into Head1
   * - forceSplit: always keep Head1 / Head2 separate (Gundam V-fin)
   */
  mergeHead12Mode: MergeHead12Mode;
  setMergeHead12Mode: (mode: MergeHead12Mode) => void;
  /** Last detector suggestion (true = weak top protrusion). */
  suggestMergeHead12: boolean;
  /** Effective merge after mode + suggestion. */
  mergeHead12: boolean;
  finRatio: number;
}

function remap(front: string | null, back: string | null, omitted: string[]): MappedSegment[] {
  const { segments } = mapViewsToSegments(front, back);
  const omit = new Set(omitted);
  return segments.map((s) => (omit.has(s.slotId) ? { ...s, visibility: "hidden" as const } : s));
}

function tintMapFrom(segments: MappedSegment[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const s of segments) {
    if (s.tint) m.set(s.slotId, s.tint);
  }
  return m;
}

async function reapplyTints(
  segments: MappedSegment[],
  tints: Map<string, string>,
): Promise<MappedSegment[]> {
  const out: MappedSegment[] = [];
  for (const s of segments) {
    const hex = tints.get(s.slotId) ?? s.tint ?? null;
    if (!hex || !s.baseImageDataUrl) {
      out.push({ ...s, tint: hex });
      continue;
    }
    try {
      const tinted = await tintImageDataUrl(s.baseImageDataUrl, hex);
      out.push({ ...s, tint: hex, imageDataUrl: tinted });
    } catch {
      out.push({ ...s, tint: hex });
    }
  }
  return out;
}

let mapGen = 0;

function activeKitName(get: () => MappingStore): string | null {
  const { activeKitId, kits } = get();
  if (!activeKitId) return null;
  return kits.find((k) => k.id === activeKitId)?.name ?? null;
}

async function finishMap(
  set: (p: Partial<MappingStore>) => void,
  get: () => MappingStore,
  front: string | null,
  back: string | null,
  omitted: string[],
  statusHint?: MappingStore["status"],
  messageHint?: string,
) {
  const gen = ++mapGen;
  const prevTints = tintMapFrom(get().segments);
  const base = remap(front, back, omitted).map((s) => ({
    ...s,
    tint: prevTints.get(s.slotId) ?? s.tint ?? null,
  }));
  const note = messageHint ?? mapViewsToSegments(front, back).note;
  set({
    segments: base,
    status: statusHint ?? (front || back ? "mapping" : "idle"),
    message: note,
  });
  applySegmentsToHangar(base, Boolean(front || back));
  applyPaletteAfterMapping({
    kitName: activeKitName(get),
    front,
    back,
    segments: base,
  });

  if (!(front || back)) {
    set({ status: "idle", message: note });
    return;
  }

  try {
    let suggestMergeHead12 = get().suggestMergeHead12;
    let finRatio = get().finRatio;
    let mergeHead12 = get().mergeHead12;
    const cropped = await applyMappingCrops(base, front, back, {
      mergeHead12Mode: get().mergeHead12Mode,
      onSmartHead: (info) => {
        suggestMergeHead12 = info.suggestMergeHead12;
        finRatio = info.finRatio;
        mergeHead12 = info.merged;
      },
    });
    if (gen !== mapGen) return;
    const omit = new Set(omitted);
    let segments = cropped.map((s) =>
      omit.has(s.slotId)
        ? { ...s, visibility: "hidden" as const, imageDataUrl: null, baseImageDataUrl: null }
        : s,
    );
    segments = await reapplyTints(segments, prevTints);
    if (gen !== mapGen) return;
    set({
      segments,
      status: "ready",
      message: note,
      suggestMergeHead12,
      finRatio,
      mergeHead12,
    });
    applySegmentsToHangar(segments, true);
    applyPaletteAfterMapping({
      kitName: activeKitName(get),
      front,
      back,
      segments,
    });
  } catch (err) {
    if (gen !== mapGen) return;
    set({
      status: "ready",
      message: `${note} (crop pass failed: ${err instanceof Error ? err.message : String(err)})`,
    });
    // Still paint even if crops fail
    applyPaletteAfterMapping({
      kitName: activeKitName(get),
      front,
      back,
    });
  }
}

export const useMapping = create<MappingStore>((set, get) => ({
  views: { front: null, back: null },
  segments: initial.segments,
  omittedSlotIds: [],
  groups: {},
  selectedSlotId: null,
  selectedGroup: "Head",
  status: "idle",
  message: initial.note,
  /** When true, empty/hidden segments are omitted from the parts list. */
  hideEmpty: false,
  kits: [],
  activeKitId: null,
  mergeHead12Mode: "auto",
  suggestMergeHead12: false,
  mergeHead12: false,
  finRatio: 0,

  setFront: (dataUrl) => {
    const views = { ...get().views, front: dataUrl };
    set({ views });
    void finishMap(set, get, views.front, views.back, get().omittedSlotIds);
  },

  setBack: (dataUrl) => {
    const views = { ...get().views, back: dataUrl };
    set({ views });
    void finishMap(set, get, views.front, views.back, get().omittedSlotIds);
  },

  runMap: () => {
    const { views, omittedSlotIds } = get();
    void finishMap(set, get, views.front, views.back, omittedSlotIds, "mapping");
  },

  setSelectedSlotId: (id) => set({ selectedSlotId: id }),
  setSelectedGroup: (g) => set({ selectedGroup: g }),
  setHideEmpty: (v) => set({ hideEmpty: v }),

  setMergeHead12Mode: (mode) => {
    clearSmartHeadCache();
    set({ mergeHead12Mode: mode });
    const { views, omittedSlotIds } = get();
    void finishMap(set, get, views.front, views.back, omittedSlotIds, "mapping");
  },

  omitSlot: (id) => {
    const omittedSlotIds = [...new Set([...get().omittedSlotIds, id])];
    const { views } = get();
    set({ omittedSlotIds });
    void finishMap(set, get, views.front, views.back, omittedSlotIds);
  },

  restoreSlot: (id) => {
    const omittedSlotIds = get().omittedSlotIds.filter((x) => x !== id);
    const { views } = get();
    set({ omittedSlotIds });
    void finishMap(set, get, views.front, views.back, omittedSlotIds);
  },

  groupSelected: (key, ids) => {
    set({ groups: groupSlots(get().groups, key, ids) });
  },

  ungroup: (key) => {
    set({ groups: ungroupSlots(get().groups, key) });
  },

  visibleForUi: () => visibleSegments(get().segments),

  slotsForGroupUi: (group) => {
    const defs = slotsInGroup(group);
    const byId = Object.fromEntries(get().segments.map((s) => [s.slotId, s]));
    const rows = defs
      .map((d) => byId[d.id])
      .filter((s): s is MappedSegment => Boolean(s));
    if (get().hideEmpty) {
      return rows.filter((s) => s.visibility === "visible");
    }
    return rows;
  },

  setSegmentTint: (slotId, hex) => {
    const seg = get().segments.find((s) => s.slotId === slotId);
    if (!seg) return;

    const nextHex = hex && hex.trim() ? hex.trim() : null;

    // Optimistic: store tint immediately so Details / overlays update
    set({
      segments: get().segments.map((s) =>
        s.slotId === slotId ? { ...s, tint: nextHex } : s,
      ),
    });

    if (!nextHex) {
      // Clear tint → restore base crop
      set({
        segments: get().segments.map((s) =>
          s.slotId === slotId
            ? {
                ...s,
                tint: null,
                imageDataUrl: s.baseImageDataUrl ?? s.imageDataUrl ?? null,
              }
            : s,
        ),
      });
      return;
    }

    const base = seg.baseImageDataUrl ?? seg.imageDataUrl;
    if (!base) return;

    void tintImageDataUrl(base, nextHex)
      .then((tinted) => {
        // Only apply if still the same tint request for this slot
        const cur = get().segments.find((s) => s.slotId === slotId);
        if (!cur || cur.tint !== nextHex) return;
        set({
          segments: get().segments.map((s) =>
            s.slotId === slotId
              ? {
                  ...s,
                  tint: nextHex,
                  baseImageDataUrl: s.baseImageDataUrl ?? base,
                  imageDataUrl: tinted,
                }
              : s,
          ),
        });
      })
      .catch(() => {
        /* keep tint hex even if canvas fails */
      });
  },

  addKit: ({ name, front, back }) => {
    const id = newKitId();
    const kit: MappingKit = {
      id,
      name: name.trim() || `Kit ${get().kits.length + 1}`,
      front,
      back,
      createdAt: Date.now(),
    };
    set({ kits: [...get().kits, kit] });
    get().selectKit(id);
    return id;
  },

  selectKit: (id) => {
    const kit = get().kits.find((k) => k.id === id);
    if (!kit) return;
    const views = { front: kit.front, back: kit.back };
    set({ activeKitId: id, views });
    void finishMap(set, get, views.front, views.back, get().omittedSlotIds, "mapping");
  },

  removeKit: (id) => {
    const wasActive = get().activeKitId === id;
    const kits = get().kits.filter((k) => k.id !== id);
    set({ kits, activeKitId: wasActive ? null : get().activeKitId });
    if (!wasActive) return;
    if (kits[0]) {
      get().selectKit(kits[0].id);
      return;
    }
    set({
      views: { front: null, back: null },
      activeKitId: null,
    });
    void finishMap(set, get, null, null, get().omittedSlotIds, "idle");
  },

  copyKit: (id) => {
    const src = get().kits.find((k) => k.id === id);
    if (!src) return null;
    const newId = newKitId();
    const kit: MappingKit = {
      id: newId,
      name: `${src.name} copy`,
      front: src.front,
      back: src.back,
      createdAt: Date.now(),
    };
    set({ kits: [...get().kits, kit] });
    get().selectKit(newId);
    return newId;
  },

  renameKit: (id, name) => {
    set({
      kits: get().kits.map((k) => (k.id === id ? { ...k, name } : k)),
    });
  },

  updateActiveKitViews: (front, back) => {
    const { activeKitId } = get();
    if (!activeKitId) return;
    get().updateKitViews(activeKitId, front, back);
  },

  updateKitViews: (id, front, back) => {
    const kits = get().kits.map((k) =>
      k.id === id
        ? {
            ...k,
            front: front ?? k.front,
            back: back ?? k.back,
          }
        : k,
    );
    set({ kits });
    if (get().activeKitId === id) {
      const kit = kits.find((k) => k.id === id);
      if (!kit) return;
      const views = { front: kit.front, back: kit.back };
      set({ views });
      void finishMap(set, get, views.front, views.back, get().omittedSlotIds, "mapping");
    }
  },
}));
