import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import {
  Camera,
  Dices,
  Download,
  Eye,
  EyeOff,
  ImagePlus,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HangarCanvas } from "@/components/hangar/HangarCanvas";
import { MappingViewport } from "@/components/hangar/MappingViewport";
import { FloatPanel } from "./FloatPanel";
import { AxisSliders, HsbSliders } from "./AxisSliders";
import { KitContextMenu, type KitContextAction } from "./KitContextMenu";
import { cn } from "@/lib/utils";
import { MAPPING_GROUP_ORDER } from "@/lib/mapping/slots";
import { MAPPING_SLOT_TO_MECH } from "@/lib/mapping/applyToHangar";
import { useMapping } from "@/lib/mapping/store";
import { seedRx78Kit } from "@/lib/mapping/seedRx78";
import type { MappingGroupId, MappingKit } from "@/lib/mapping/types";
import { SLOT_BY_ID, variantLabel } from "@/lib/mech/catalog";
import { QUAD_RANGES } from "@/lib/mech/codes";
import { DEFAULT_VISOR } from "@/lib/mech/palette";
import { getRecipe } from "@/lib/mech/recipes";
import { clampPanel, defaultPanels, defaultScaleFor, useStudio } from "@/lib/mech/store";

function useClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function useLg() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth >= 1024,
    () => false,
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const EXTRA_CHIPS = [
  { id: "all" as const, label: "All" },
  { id: "M" as const, label: "Module" },
  { id: "W" as const, label: "Weapon" },
  { id: "A" as const, label: "Accent" },
  { id: "G" as const, label: "Shape" },
];

function mechIdForMappingSlot(slotId: string | null): string | null {
  if (!slotId) return null;
  const ids = MAPPING_SLOT_TO_MECH[slotId];
  return ids?.[0] ?? null;
}

export function Studio() {
  const mounted = useClient();
  const lg = useLg();
  const [mobilePane, setMobilePane] = useState<"parts" | "details">("parts");
  const [addKitOpen, setAddKitOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftFront, setDraftFront] = useState<string | null>(null);
  const [draftBack, setDraftBack] = useState<string | null>(null);
  const draftFrontInput = useRef<HTMLInputElement>(null);
  const draftBackInput = useRef<HTMLInputElement>(null);

  /** null = classic part Details; set when Edit from kit context menu */
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [kitMenu, setKitMenu] = useState<{
    kitId: string;
    x: number;
    y: number;
  } | null>(null);
  const [quad, setQuad] = useState("all");
  const [extraClass, setExtraClass] = useState<(typeof EXTRA_CHIPS)[number]["id"]>("all");

  const editFrontInput = useRef<HTMLInputElement>(null);
  const editBackInput = useRef<HTMLInputElement>(null);

  const theme = useStudio((s) => s.theme);
  const setTheme = useStudio((s) => s.setTheme);
  const name = useStudio((s) => s.name);
  const setName = useStudio((s) => s.setName);
  const panels = useStudio((s) => s.panels);
  const setPanel = useStudio((s) => s.setPanel);
  const panelZ = useStudio((s) => s.panelZ);
  const focusPanel = useStudio((s) => s.focusPanel);
  const rehydrate = useStudio((s) => s.rehydrate);
  const saveNow = useStudio((s) => s.saveNow);
  const refreshAll = useStudio((s) => s.refreshAll);
  const randomMix = useStudio((s) => s.randomMix);
  const exportJson = useStudio((s) => s.exportJson);
  const importJson = useStudio((s) => s.importJson);

  const selected = useStudio((s) => s.selected);
  const setSelected = useStudio((s) => s.setSelected);
  const slots = useStudio((s) => s.slots);
  const patchSlot = useStudio((s) => s.patchSlot);
  const setVariant = useStudio((s) => s.setVariant);
  const applyPaint = useStudio((s) => s.applyPaint);
  const applyPaint2 = useStudio((s) => s.applyPaint2);
  const applyVisorPaint = useStudio((s) => s.applyVisorPaint);
  const light = useStudio((s) => s.light);
  const setLight = useStudio((s) => s.setLight);
  const resetSlotDefault = useStudio((s) => s.resetSlotDefault);
  const symmetry = useStudio((s) => s.symmetry);
  const uniformScale = useStudio((s) => s.uniformScale);
  const edges = useStudio((s) => s.edges);
  const autoRotate = useStudio((s) => s.autoRotate);
  const toggle = useStudio((s) => s.toggle);

  const selectedGroup = useMapping((s) => s.selectedGroup);
  const setSelectedGroup = useMapping((s) => s.setSelectedGroup);
  const selectedSlotId = useMapping((s) => s.selectedSlotId);
  const setSelectedSlotId = useMapping((s) => s.setSelectedSlotId);
  const hideEmpty = useMapping((s) => s.hideEmpty);
  const setHideEmpty = useMapping((s) => s.setHideEmpty);
  const omitSlot = useMapping((s) => s.omitSlot);
  const restoreSlot = useMapping((s) => s.restoreSlot);
  const omittedSlotIds = useMapping((s) => s.omittedSlotIds);
  const status = useMapping((s) => s.status);
  const message = useMapping((s) => s.message);
  const segments = useMapping((s) => s.segments);
  const slotsForGroupUi = useMapping((s) => s.slotsForGroupUi);
  const kits = useMapping((s) => s.kits);
  const activeKitId = useMapping((s) => s.activeKitId);
  const addKit = useMapping((s) => s.addKit);
  const selectKit = useMapping((s) => s.selectKit);
  const removeKit = useMapping((s) => s.removeKit);
  const copyKit = useMapping((s) => s.copyKit);
  const renameKit = useMapping((s) => s.renameKit);
  const updateKitViews = useMapping((s) => s.updateKitViews);
  const viewFront = useMapping((s) => s.views.front);
  const viewBack = useMapping((s) => s.views.back);
  const setSegmentTint = useMapping((s) => s.setSegmentTint);
  const mergeHead12Mode = useMapping((s) => s.mergeHead12Mode);
  const setMergeHead12Mode = useMapping((s) => s.setMergeHead12Mode);
  const mergeHead12 = useMapping((s) => s.mergeHead12);
  const suggestMergeHead12 = useMapping((s) => s.suggestMergeHead12);
  const finRatio = useMapping((s) => s.finRatio);
  const useKitViewport = Boolean(viewFront && viewBack);

  const groupRows = useMemo(
    () => slotsForGroupUi(selectedGroup),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedGroup, segments, hideEmpty, omittedSlotIds, slotsForGroupUi],
  );

  const selectedSeg = useMemo(
    () => segments.find((s) => s.slotId === selectedSlotId) ?? null,
    [segments, selectedSlotId],
  );

  const editingKit = useMemo(
    () => (editingKitId ? kits.find((k) => k.id === editingKitId) ?? null : null),
    [kits, editingKitId],
  );

  const visibleCount = useMemo(
    () => segments.filter((s) => s.visibility === "visible").length,
    [segments],
  );

  const canCreateKit = Boolean(draftFront && draftBack);

  const def = SLOT_BY_ID[selected];
  const st = slots[selected];

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    rehydrate();
    const onResize = () => {
      const cur = useStudio.getState().panels;
      for (const id of Object.keys(cur)) {
        const rect = cur[id];
        if (!rect) continue;
        useStudio.getState().setPanel(id, clampPanel(id, rect));
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [rehydrate]);

  useEffect(() => {
    void seedRx78Kit();
  }, []);

  // Capture / automation bridge (select + tint without UI scrape)
  useEffect(() => {
    const w = window as unknown as {
      __mosaMapping?: {
        selectSlot: (id: string) => void;
        setSegmentTint: (id: string, hex: string | null) => void;
        setMergeHead12Mode: (mode: "auto" | "forceMerge" | "forceSplit") => void;
        getSelected: () => {
          slotId: string | null;
          tint: string | null;
          mergeHead12: boolean;
          polygon?: { x: number; y: number }[] | null;
        };
      };
    };
    w.__mosaMapping = {
      selectSlot: (id: string) => {
        setSelectedSlotId(id);
        const mechId = mechIdForMappingSlot(id);
        if (mechId && SLOT_BY_ID[mechId]) setSelected(mechId);
      },
      setSegmentTint: (id, hex) => setSegmentTint(id, hex),
      setMergeHead12Mode: (mode) => setMergeHead12Mode(mode),
      getSelected: () => {
        const st = useMapping.getState();
        const seg = st.segments.find((x) => x.slotId === st.selectedSlotId);
        return {
          slotId: st.selectedSlotId,
          tint: seg?.tint ?? null,
          mergeHead12: st.mergeHead12,
          polygon: seg?.polygon ?? null,
        };
      },
    };
    return () => {
      delete w.__mosaMapping;
    };
  }, [setSelectedSlotId, setSelected, setSegmentTint, setMergeHead12Mode]);


  // Keep mech selection in sync with mapping slot when possible
  useEffect(() => {
    const mechId = mechIdForMappingSlot(selectedSlotId);
    if (mechId && SLOT_BY_ID[mechId] && mechId !== selected) {
      setSelected(mechId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlotId]);

  const zOf = (id: string) => 30 + panelZ.indexOf(id);

  const openAddKit = () => {
    setDraftName(`Kit ${kits.length + 1}`);
    setDraftFront(null);
    setDraftBack(null);
    setAddKitOpen(true);
  };

  const closeAddKit = () => {
    setAddKitOpen(false);
    setDraftFront(null);
    setDraftBack(null);
  };

  const onDraftPick =
    (side: "front" | "back") => async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const url = await readFileAsDataUrl(f);
      if (side === "front") setDraftFront(url);
      else setDraftBack(url);
      e.target.value = "";
    };

  const confirmAddKit = () => {
    if (!draftFront || !draftBack) return;
    addKit({ name: draftName, front: draftFront, back: draftBack });
    closeAddKit();
  };

  const openKitMenu = (kitId: string, e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setKitMenu({ kitId, x: e.clientX, y: e.clientY });
  };

  const onKitMenuAction = (action: KitContextAction) => {
    if (!kitMenu) return;
    const id = kitMenu.kitId;
    const kit = kits.find((k) => k.id === id);
    if (!kit) return;
    if (action === "edit") {
      selectKit(id);
      setEditingKitId(id);
      return;
    }
    if (action === "copy") {
      copyKit(id);
      return;
    }
    if (action === "delete") {
      if (editingKitId === id) setEditingKitId(null);
      removeKit(id);
      return;
    }
    if (action === "rename") {
      const next = window.prompt("Rename kit", kit.name);
      if (next != null) renameKit(id, next);
    }
  };

  const onEditKitPick =
    (side: "front" | "back") => async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f || !editingKitId) return;
      const url = await readFileAsDataUrl(f);
      if (side === "front") updateKitViews(editingKitId, url, null);
      else updateKitViews(editingKitId, null, url);
      e.target.value = "";
    };

  const selectMappingSlot = (slotId: string) => {
    setSelectedSlotId(slotId);
    const mechId = mechIdForMappingSlot(slotId);
    if (mechId && SLOT_BY_ID[mechId]) setSelected(mechId);
    if (!lg) setMobilePane("details");
  };

  const partsBody = (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border p-2 lg:flex-wrap">
        {MAPPING_GROUP_ORDER.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setSelectedGroup(g as MappingGroupId)}
            className={cn(
              "h-8 shrink-0 rounded-sm px-2.5 text-xs",
              selectedGroup === g
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:bg-surface hover:text-fg",
            )}
          >
            {g}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
          aria-label={hideEmpty ? "Show empty slots" : "Hide empty slots"}
          title={hideEmpty ? "Show empty" : "Hide empty"}
          onClick={() => setHideEmpty(!hideEmpty)}
        >
          {hideEmpty ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {groupRows.length === 0 && (
            <li className="px-2 py-3 text-xs text-muted">
              {hideEmpty
                ? "Empty segments hidden. Add Kit (Front/Back) or show empty."
                : "No slots in this group."}
            </li>
          )}
          {groupRows.map((s) => {
            const omitted = omittedSlotIds.includes(s.slotId);
            return (
              <li key={s.slotId}>
                <button
                  type="button"
                  onClick={() => selectMappingSlot(s.slotId)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm",
                    selectedSlotId === s.slotId
                      ? "bg-surface text-fg"
                      : "text-muted hover:bg-elevated hover:text-fg",
                    s.visibility === "hidden" && "opacity-50",
                  )}
                >
                  <span>{s.label}</span>
                  <span className="truncate font-mono text-[10px] text-subtle">
                    {s.sourceView ?? (omitted ? "omit" : "—")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-2 border-t border-border p-2">
        {selectedGroup === "Head" && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-fg">Head1+2 merge</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["auto", "Auto"],
                  ["forceMerge", "Merge"],
                  ["forceSplit", "Split"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMergeHead12Mode(mode)}
                  className={cn(
                    "h-7 rounded-sm px-2 text-[10px]",
                    mergeHead12Mode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted hover:text-fg",
                  )}
                  title={
                    mode === "auto"
                      ? "Merge Head1+2 when top protrusion is weak (Zaku-like)"
                      : mode === "forceMerge"
                        ? "Force fold Head2 into Head1"
                        : "Force keep Head1 / Head2 separate"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[9px] text-subtle">
              {mergeHead12 ? "merged" : "split"} · fin {finRatio.toFixed(2)}
              {suggestMergeHead12 ? " · auto suggests merge" : " · auto suggests split"}
            </p>
          </div>
        )}
        <p className="text-[10px] text-muted">
          Mapped visible: {visibleCount}/{segments.length}
          {hideEmpty ? " · hiding empty" : " · showing empty"}
        </p>
      </div>
    </div>
  );

  const stylePicker = def && st && (
    <StylePicker
      kits={kits}
      activeKitId={activeKitId}
      quad={quad}
      onQuad={setQuad}
      onSelectKit={selectKit}
      onKitContextMenu={openKitMenu}
      onAddKit={openAddKit}
      onApplyGroup={() => {
        if (activeKitId) selectKit(activeKitId);
      }}
      onApplyAll={() => {
        if (activeKitId) selectKit(activeKitId);
      }}
    />
  );

  const otherPicker = def && st && def.kind !== "armor" && (
    <div>
      {def.kind === "extra" && (
        <div className="mb-2 flex flex-wrap gap-1">
          {EXTRA_CHIPS.map((c) => (
            <Chip key={c.id} on={extraClass === c.id} onClick={() => setExtraClass(c.id)} label={c.label} />
          ))}
        </div>
      )}
      <div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto">
        {def.variants
          .filter((v) => {
            if (def.kind !== "extra" || extraClass === "all" || v.id === "none") return true;
            return (v as { cls?: string }).cls === extraClass;
          })
          .map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariant(selected, v.id)}
              className={cn(
                "h-9 rounded-sm border px-2 text-left text-[11px]",
                st.variant === v.id ? "border-fg bg-surface text-fg" : "border-border text-muted hover:text-fg",
              )}
            >
              {v.name}
            </button>
          ))}
      </div>
    </div>
  );

  const partDetailsBody = def && st && (
    <div className="h-full overflow-y-auto">
      <div className="px-3 pt-3 pb-3">
        <h2 className="font-display text-lg tracking-tight">{def.label}</h2>
        <p className="font-mono text-xs text-muted">{variantLabel(selected, st.variant)}</p>
        {selectedSeg && (
          <p className="mt-1 font-mono text-[10px] text-subtle">
            map · {selectedSeg.label}
            {selectedSeg.sourceView ? ` · ${selectedSeg.sourceView}` : ""}
          </p>
        )}
      </div>

      <div className="border-t border-b border-border px-3 py-3">
        {stylePicker}
        {otherPicker}
      </div>

      <div className="border-b border-border px-3 py-3">
        <HsbSliders
          title="Part 1 Color"
          hex={
            useKitViewport && selectedSlotId && selectedSeg?.tint
              ? selectedSeg.tint
              : (st.paint ?? getRecipe(st.variant).palette.prim)
          }
          onChange={(hex) => {
            if (useKitViewport && selectedSlotId) {
              setSegmentTint(selectedSlotId, hex);
            } else {
              patchSlot(selected, { paint: hex });
            }
          }}
        />
        <div className="mb-4 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim, def.group)}
          >
            Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim)}
          >
            Body
          </Button>
        </div>
        <HsbSliders
          title="Part 2 Color"
          hex={st.paint2 ?? getRecipe(st.variant).palette.sec}
          onChange={(hex) => {
            if (useKitViewport && selectedSlotId) {
              // Secondary also tints the selected mapping crop (same store path)
              setSegmentTint(selectedSlotId, hex);
            }
            patchSlot(selected, { paint2: hex });
          }}
        />
        <div className="mb-4 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec, def.group)}
          >
            Group
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec)}
          >
            Body
          </Button>
        </div>
        <HsbSliders
          title="Light Color"
          hex={light || slots.visor?.paint || DEFAULT_VISOR}
          onChange={(hex) => setLight(hex)}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyVisorPaint(light || DEFAULT_VISOR, def.group)}
          >
            Group
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyVisorPaint(light || DEFAULT_VISOR)}>
            Body
          </Button>
        </div>
      </div>

      <div className="space-y-4 border-b border-border px-3 py-3">
        <AxisSliders
          title="Position"
          x={st.px}
          y={st.py}
          z={st.pz}
          min={-0.8}
          max={0.8}
          step={0.005}
          onChange={(axis, v) =>
            patchSlot(selected, { [axis === "x" ? "px" : axis === "y" ? "py" : "pz"]: v })
          }
          onReset={() => patchSlot(selected, { px: 0, py: 0, pz: 0 })}
        />
        <AxisSliders
          title="Rotate (°)"
          x={st.rx}
          y={st.ry}
          z={st.rz}
          min={-180}
          max={180}
          step={1}
          onChange={(axis, v) =>
            patchSlot(selected, { [axis === "x" ? "rx" : axis === "y" ? "ry" : "rz"]: v })
          }
          onReset={() => patchSlot(selected, { rx: 0, ry: 0, rz: 0 })}
        />
        <AxisSliders
          title={uniformScale ? "Scale (Uniform)" : "Scale"}
          x={st.sx}
          y={st.sy}
          z={st.sz}
          min={0.15}
          max={2.6}
          step={0.01}
          onChange={(axis, v) =>
            patchSlot(selected, { [axis === "x" ? "sx" : axis === "y" ? "sy" : "sz"]: v })
          }
          onReset={() => patchSlot(selected, defaultScaleFor(selected))}
        />
      </div>

      <div className="px-3 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          <Toggle on={symmetry} onClick={() => toggle("symmetry")} label="Mirror" />
          <Toggle on={uniformScale} onClick={() => toggle("uniformScale")} label="Uniform" />
          <Toggle on={edges} onClick={() => toggle("edges")} label="Edges" />
          <Toggle on={autoRotate} onClick={() => toggle("autoRotate")} label="Turntable" />
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          <Button size="sm" variant="outline" onClick={() => patchSlot(selected, { visible: !st.visible })}>
            {st.visible ? "Hide" : "Show"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => resetSlotDefault(selected)}>
            Default
          </Button>
          {selectedSlotId && (
            <>
              <Button size="sm" variant="outline" onClick={() => omitSlot(selectedSlotId)}>
                Omit map
              </Button>
              <Button size="sm" variant="outline" onClick={() => restoreSlot(selectedSlotId)}>
                Restore
              </Button>
            </>
          )}
        </div>
        {selectedSeg?.imageDataUrl && (
          <div className="mb-2 overflow-hidden rounded-md border border-border bg-bg">
            <div className="border-b border-border px-2 py-1 text-[10px] text-muted">Map crop</div>
            <img
              src={selectedSeg.imageDataUrl}
              alt=""
              className="aspect-square w-full object-contain bg-elevated"
            />
          </div>
        )}
        <p className="font-mono text-[10px] text-subtle">{message}</p>
        <p className="font-mono text-[10px] text-muted">status: {status}</p>
      </div>
    </div>
  );

  const detailsBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        {partDetailsBody ?? (
          <div className="space-y-3 px-3 py-6 text-center">
            <p className="text-xs text-muted">Select a part to edit Details.</p>
            <p className="font-mono text-[10px] text-subtle">{message}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) {
    return <div className="flex h-dvh items-center justify-center bg-bg text-muted">Loading…</div>;
  }

  const menuKit = kitMenu ? kits.find((k) => k.id === kitMenu.kitId) : null;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <img
          src="/MOSA.png"
          alt="MOSA"
          className={cn("h-[22px] w-auto shrink-0 select-none", theme === "light" && "brightness-0")}
        />
        <span className="hidden rounded-sm border border-border bg-elevated px-2 py-0.5 font-mono text-[10px] text-fg sm:inline">
          mapping :3020
        </span>
        <p className="hidden min-w-0 flex-1 truncate font-mono text-[10px] leading-none text-muted lg:block">
          Modular Omni-Support Automata / Mimetic Operating System Architecture
        </p>
        <div className="ml-auto flex items-center gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Unit name / ID"
            className="h-8 w-44 rounded-sm border border-border bg-elevated px-2 font-mono text-xs sm:w-64"
            aria-label="Unit name and identification"
          />
          <Button
            size="iconSm"
            variant="ghost"
            aria-label="Theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
          <Button
            size="iconSm"
            variant="ghost"
            onClick={refreshAll}
            className="hidden sm:inline-flex"
            aria-label="Reset panels"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button size="iconSm" variant="ghost" onClick={randomMix} className="hidden sm:inline-flex" aria-label="Random">
            <Dices className="size-4" />
          </Button>
          <Button size="iconSm" variant="ghost" onClick={saveNow} aria-label="Save">
            <Save className="size-4" />
          </Button>
          <Button
            size="iconSm"
            variant="ghost"
            aria-label="Export"
            onClick={() => {
              const blob = new Blob([exportJson()], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${name || "frame"}.json`;
              a.click();
            }}
          >
            <Download className="size-4" />
          </Button>
          <label className="inline-flex size-8 cursor-pointer items-center justify-center rounded-sm hover:bg-surface">
            <Upload className="size-4" />
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                f.text().then((t) => importJson(t));
              }}
            />
          </label>
          <Button
            size="iconSm"
            variant="ghost"
            aria-label="Capture"
            onClick={() => {
              const cap = (window as unknown as { __frameMixCapture?: () => string }).__frameMixCapture;
              if (!cap) return;
              const a = document.createElement("a");
              a.href = cap();
              a.download = `${name || "frame"}.png`;
              a.click();
            }}
          >
            <Camera className="size-4" />
          </Button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        {!lg && (
          <aside
            className={cn(
              "order-2 flex min-h-0 shrink-0 flex-col border-border lg:hidden",
              mobilePane === "parts" ? "flex max-h-[42%] border-t" : "hidden",
            )}
          >
            {partsBody}
          </aside>
        )}
        {!lg && (
          <aside
            className={cn(
              "order-2 flex min-h-0 shrink-0 flex-col border-border lg:hidden",
              mobilePane === "details" ? "flex max-h-[42%] border-t" : "hidden",
            )}
          >
            {detailsBody}
          </aside>
        )}

        <section className="relative order-1 min-h-[38vh] min-w-0 flex-1 overflow-hidden bg-bg lg:order-2 lg:min-h-0">
          {useKitViewport ? <MappingViewport /> : <HangarCanvas />}
          {lg && (
            <>
              {panels.parts && (
                <FloatPanel
                  title="Parts"
                  rect={panels.parts}
                  z={zOf("parts")}
                  onChange={(p) => setPanel("parts", p)}
                  onReset={() => setPanel("parts", defaultPanels().parts)}
                  onFocus={() => focusPanel("parts")}
                >
                  {partsBody}
                </FloatPanel>
              )}
              {panels.adjust && (
                <FloatPanel
                  title="Details"
                  rect={panels.adjust}
                  z={zOf("adjust")}
                  onChange={(p) => setPanel("adjust", p)}
                  onReset={() => setPanel("adjust", defaultPanels().adjust)}
                  onFocus={() => focusPanel("adjust")}
                >
                  {detailsBody}
                </FloatPanel>
              )}
            </>
          )}
        </section>
      </div>

      {!lg && (
        <nav className="flex shrink-0 border-t border-border">
          <button
            type="button"
            className={cn("h-11 flex-1 text-sm", mobilePane === "parts" ? "bg-surface text-fg" : "text-muted")}
            onClick={() => setMobilePane("parts")}
          >
            Parts
          </button>
          <button
            type="button"
            className={cn(
              "h-11 flex-1 text-sm",
              mobilePane === "details" ? "bg-surface text-fg" : "text-muted",
            )}
            onClick={() => setMobilePane("details")}
          >
            Details
          </button>
        </nav>
      )}

      {addKitOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-kit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddKit();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-md border border-border bg-elevated shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 id="add-kit-title" className="text-sm font-medium">
                Add Kit
              </h2>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
                aria-label="Close"
                onClick={closeAddKit}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted">Name (reference id)</span>
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="h-9 w-full rounded-sm border border-border bg-bg px-2 font-mono text-sm"
                  placeholder="e.g. RX-78"
                />
              </label>
              <p className="text-[11px] text-muted">
                Front / Back 모두 import 후 Confirm — 단발성. 이후 Edit은 키트 우클릭 메뉴에서.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <ViewCard
                  title="Front"
                  dataUrl={draftFront}
                  inputRef={draftFrontInput}
                  onChange={onDraftPick("front")}
                  onClear={() => setDraftFront(null)}
                  required
                />
                <ViewCard
                  title="Back"
                  dataUrl={draftBack}
                  inputRef={draftBackInput}
                  onChange={onDraftPick("back")}
                  onClear={() => setDraftBack(null)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-3">
              <Button size="sm" variant="ghost" onClick={closeAddKit}>
                Cancel
              </Button>
              <Button size="sm" disabled={!canCreateKit} onClick={confirmAddKit}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingKit && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-kit-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingKitId(null);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-md border border-border bg-elevated shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <h2 id="edit-kit-title" className="text-sm font-medium">
                Edit Kit — {editingKit.name}
              </h2>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
                aria-label="Close"
                onClick={() => setEditingKitId(null)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted">Name</span>
                <input
                  value={editingKit.name}
                  onChange={(e) => renameKit(editingKit.id, e.target.value)}
                  className="h-9 w-full rounded-sm border border-border bg-bg px-2 font-mono text-sm"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <ViewCard
                  title="Front"
                  dataUrl={editingKit.front}
                  inputRef={editFrontInput}
                  onChange={onEditKitPick("front")}
                  onClear={() => {
                    /* keep required front — no clear to empty */
                  }}
                />
                <ViewCard
                  title="Back"
                  dataUrl={editingKit.back}
                  inputRef={editBackInput}
                  onChange={onEditKitPick("back")}
                  onClear={() => {}}
                />
              </div>
              <p className="font-mono text-[10px] text-subtle">
                Close returns to part Details. Kit name = reference attribution.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-border p-3">
              <Button size="sm" onClick={() => setEditingKitId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {kitMenu && menuKit && (
        <KitContextMenu
          x={kitMenu.x}
          y={kitMenu.y}
          kitName={menuKit.name}
          onAction={onKitMenuAction}
          onClose={() => setKitMenu(null)}
        />
      )}
    </div>
  );
}

function ViewCard({
  title,
  dataUrl,
  inputRef,
  onChange,
  onClear,
  compact,
  required,
}: {
  title: string;
  dataUrl: string | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  compact?: boolean;
  required?: boolean;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-bg p-2", required && !dataUrl && "border-dashed")}>
      <div className="mb-2 flex items-center justify-between gap-1">
        <h3 className="text-sm font-medium">
          {title}
          {required && <span className="ml-1 text-[10px] text-subtle">*</span>}
        </h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-1 size-3.5" />
            {compact ? "" : "Upload"}
          </Button>
          {dataUrl && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-sm border border-dashed border-border bg-elevated",
          compact ? "aspect-[4/3]" : "aspect-square",
        )}
      >
        {dataUrl ? (
          <img src={dataUrl} alt={title} className="h-full w-full object-contain" />
        ) : (
          <button
            type="button"
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-6 opacity-60" />
            <span className="text-[11px]">{title} import</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StylePicker({
  kits,
  activeKitId,
  quad,
  onQuad,
  onSelectKit,
  onKitContextMenu,
  onAddKit,
  onApplyAll,
  onApplyGroup,
}: {
  kits: MappingKit[];
  activeKitId: string | null;
  quad: string;
  onQuad: (v: string) => void;
  onSelectKit: (id: string) => void;
  onKitContextMenu: (id: string, e: ReactMouseEvent) => void;
  onAddKit: () => void;
  onApplyAll: () => void;
  onApplyGroup: () => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">Kits</p>
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
          aria-label="Add Kit"
          title="Add Kit"
          onClick={onAddKit}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        <Chip on={quad === "all"} onClick={() => onQuad("all")} label="TTL" />
        {QUAD_RANGES.map((q) => (
          <Chip key={q.id} on={quad === q.id} onClick={() => onQuad(q.id)} label={q.id} />
        ))}
      </div>
      <div className="mb-2 grid max-h-48 grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-1 overflow-y-auto">
        {kits.length === 0 ? (
          <p className="col-span-full py-2 text-[11px] text-muted">No kits — use + to add Front/Back.</p>
        ) : (
          kits.map((kit) => {
            const active = kit.id === activeKitId;
            return (
              <button
                key={kit.id}
                type="button"
                onClick={() => onSelectKit(kit.id)}
                onContextMenu={(e) => onKitContextMenu(kit.id, e)}
                title={`${kit.name} — right-click for Edit / Copy / Delete / Rename`}
                className={cn(
                  "h-8 w-full truncate rounded-sm border px-1 font-mono text-[10px]",
                  active ? "border-fg bg-surface text-fg" : "border-border text-muted hover:text-fg",
                )}
              >
                {kit.name}
              </button>
            );
          })
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={onApplyGroup}>
          Group
        </Button>
        <Button size="sm" variant="outline" onClick={onApplyAll}>
          Body
        </Button>
      </div>
    </div>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-sm border px-2 text-[11px]",
        on ? "border-fg bg-surface text-fg" : "border-border text-muted",
      )}
    >
      {label}
    </button>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-sm border px-2 text-[11px]",
        on ? "border-fg bg-surface text-fg" : "border-border text-muted",
      )}
    >
      {label}
    </button>
  );
}
