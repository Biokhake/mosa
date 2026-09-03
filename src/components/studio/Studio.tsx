import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Dices,
  Download,
  RefreshCw,
  Save,
  Upload,
  Camera,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HangarCanvas } from "@/components/hangar/HangarCanvas";
import { GROUPS } from "@/lib/mech/types";
import { SLOTS, SLOT_BY_ID, variantLabel } from "@/lib/mech/catalog";
import { QUAD_RANGES, STYLES } from "@/lib/mech/codes";
import { clampPanel, defaultPanels, defaultScaleFor, useStudio } from "@/lib/mech/store";
import { AxisSliders, HsbSliders } from "./AxisSliders";
import { DEFAULT_VISOR } from "@/lib/mech/palette";
import { getRecipe } from "@/lib/mech/recipes";
import { FloatPanel } from "./FloatPanel";
import { cn } from "@/lib/utils";

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

const EXTRA_CHIPS = [
  { id: "all" as const, label: "All" },
  { id: "M" as const, label: "Module" },
  { id: "W" as const, label: "Weapon" },
  { id: "A" as const, label: "Accent" },
  { id: "G" as const, label: "Shape" },
];

export function Studio() {
  const mounted = useClient();
  const lg = useLg();
  const [mobilePane, setMobilePane] = useState<"parts" | "adjust">("adjust");
  const [quad, setQuad] = useState<string>("all");
  const [extraClass, setExtraClass] = useState<"all" | "M" | "W" | "A" | "G">("all");

  const name = useStudio((s) => s.name);
  const setName = useStudio((s) => s.setName);
  const selected = useStudio((s) => s.selected);
  const slots = useStudio((s) => s.slots);
  const groupFilter = useStudio((s) => s.groupFilter);
  const setGroupFilter = useStudio((s) => s.setGroupFilter);
  const setSelected = useStudio((s) => s.setSelected);
  const setVariant = useStudio((s) => s.setVariant);
  const patchSlot = useStudio((s) => s.patchSlot);
  const applyFamily = useStudio((s) => s.applyFamily);
  const applyPaint = useStudio((s) => s.applyPaint);
  const applyPaint2 = useStudio((s) => s.applyPaint2);
  const applyVisorPaint = useStudio((s) => s.applyVisorPaint);
  const light = useStudio((s) => s.light);
  const setLight = useStudio((s) => s.setLight);
  const randomMix = useStudio((s) => s.randomMix);
  const resetSlotDefault = useStudio((s) => s.resetSlotDefault);
  const resetGroupDefault = useStudio((s) => s.resetGroupDefault);
  const setGroupVisible = useStudio((s) => s.setGroupVisible);
  const groupXform = useStudio((s) => s.groupXform);
  const patchGroupXform = useStudio((s) => s.patchGroupXform);
  const resetGroupXform = useStudio((s) => s.resetGroupXform);
  const explode = useStudio((s) => s.explode);
  const setExplode = useStudio((s) => s.setExplode);
  const autoRotate = useStudio((s) => s.autoRotate);
  const edges = useStudio((s) => s.edges);
  const symmetry = useStudio((s) => s.symmetry);
  const uniformScale = useStudio((s) => s.uniformScale);
  const toggle = useStudio((s) => s.toggle);
  const exportJson = useStudio((s) => s.exportJson);
  const importJson = useStudio((s) => s.importJson);
  const saveNow = useStudio((s) => s.saveNow);
  const rehydrate = useStudio((s) => s.rehydrate);
  const theme = useStudio((s) => s.theme);
  const setTheme = useStudio((s) => s.setTheme);
  const panels = useStudio((s) => s.panels);
  const setPanel = useStudio((s) => s.setPanel);
  const showAllParts = useStudio((s) => s.showAllParts);
  const hideAllParts = useStudio((s) => s.hideAllParts);
  const refreshAll = useStudio((s) => s.refreshAll);
  const resetCamera = useStudio((s) => s.resetCamera);
  const focusPanel = useStudio((s) => s.focusPanel);
  const panelZ = useStudio((s) => s.panelZ);
  const detailsTick = useStudio((s) => s.detailsTick);
  const poseId = useStudio((s) => s.poseId);
  const setPose = useStudio((s) => s.setPose);
  const poseMenu = useStudio((s) => s.poseMenu);
  const closePoseMenu = useStudio((s) => s.closePoseMenu);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    rehydrate();
    const flush = () => useStudio.getState().saveNow();
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onHide);
    const onResize = () => {
      const cur = useStudio.getState().panels;
      for (const id of Object.keys(cur)) {
        const rect = cur[id];
        if (!rect) continue;
        useStudio.getState().setPanel(id, clampPanel(id, rect));
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("resize", onResize);
    };
  }, [rehydrate]);

  useEffect(() => {
    if (!detailsTick) return;
    setMobilePane("adjust");
  }, [detailsTick]);

  useEffect(() => {
    if (!poseMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePoseMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [poseMenu, closePoseMenu]);

  const def = SLOT_BY_ID[selected];
  const st = slots[selected];
  const groupSlots = SLOTS.filter((s) => s.group === groupFilter);
  const groupVisible = groupSlots.some((s) => slots[s.id]?.visible);
  const gx = groupXform[groupFilter] ?? { px: 0, py: 0, pz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
  const anyVisible = Object.values(slots).some((s) => s.visible);

  const filteredStyles = useMemo(() => {
    return STYLES.filter((s) => {
      if (quad === "all") return true;
      const q = QUAD_RANGES.find((r) => r.id === quad);
      if (q && (s.serial < q.from || s.serial > q.to)) return false;
      return true;
    });
  }, [quad]);

  const zOf = (id: string) => 30 + panelZ.indexOf(id);

  const stylePicker = def && st && def.kind === "armor" && (
    <StylePicker
      current={st.variant}
      filtered={filteredStyles}
      quad={quad}
      onQuad={setQuad}
      onPick={(id) => setVariant(selected, id)}
      onApplyAll={(id) => applyFamily(id)}
      onApplyGroup={(id) => applyFamily(id, groupFilter)}
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

  const visToggle = (
    <button
      type="button"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
      aria-label={anyVisible ? "Hide all" : "Show all"}
      onClick={() => (anyVisible ? hideAllParts() : showAllParts())}
    >
      {anyVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </button>
  );

  const partsBody = (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-border p-2 lg:flex-wrap">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGroupFilter(g.id)}
            className={cn(
              "h-8 shrink-0 rounded-sm px-2.5 text-xs",
              groupFilter === g.id ? "bg-primary text-primary-foreground" : "text-muted hover:bg-surface hover:text-fg",
            )}
          >
            {g.label}
          </button>
        ))}
        <span className="ml-auto lg:hidden">{visToggle}</span>
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="space-y-1 p-2">
          {groupSlots.map((s) => {
            const cur = slots[s.id];
            return (
              <li key={s.id}>
                <button
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm",
                    selected === s.id ? "bg-surface text-fg" : "text-muted hover:bg-elevated hover:text-fg",
                  )}
                >
                  <span>{s.label}</span>
                  <span className="truncate font-mono text-[10px] text-subtle">
                    {variantLabel(s.id, cur?.variant ?? "")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="space-y-4 border-t border-border px-2 py-3">
          <AxisSliders
            title="Position"
            x={gx.px}
            y={gx.py}
            z={gx.pz}
            min={-0.8}
            max={0.8}
            step={0.005}
            onChange={(axis, v) =>
              patchGroupXform(groupFilter, { [axis === "x" ? "px" : axis === "y" ? "py" : "pz"]: v })
            }
            onReset={() => resetGroupXform(groupFilter, ["px", "py", "pz"])}
          />
          <AxisSliders
            title="Rotate (°)"
            x={gx.rx}
            y={gx.ry}
            z={gx.rz}
            min={-180}
            max={180}
            step={1}
            onChange={(axis, v) =>
              patchGroupXform(groupFilter, { [axis === "x" ? "rx" : axis === "y" ? "ry" : "rz"]: v })
            }
            onReset={() => resetGroupXform(groupFilter, ["rx", "ry", "rz"])}
          />
          <AxisSliders
            title={uniformScale ? "Scale (Uniform)" : "Scale"}
            x={gx.sx}
            y={gx.sy}
            z={gx.sz}
            min={0.15}
            max={2.6}
            step={0.01}
            onChange={(axis, v) =>
              patchGroupXform(groupFilter, { [axis === "x" ? "sx" : axis === "y" ? "sy" : "sz"]: v })
            }
            onReset={() => resetGroupXform(groupFilter, ["sx", "sy", "sz"])}
          />
        </div>
      </div>
      <div className="border-t border-border p-2">
        <div className="mb-2 flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setGroupVisible(groupFilter, !groupVisible)}>
            {groupVisible ? "Hide" : "Show"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => resetGroupDefault(groupFilter)}>
            Default
          </Button>
        </div>
        <p className="mb-1 text-[11px] text-muted">Explode</p>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={explode}
          onChange={(e) => setExplode(Number(e.target.value))}
          className="h-8 w-full accent-fg"
        />
      </div>
    </div>
  );

  const adjustBody = def && st && (
    <div className="h-full overflow-y-auto">
      <div className="px-3 pt-3 pb-3">
        <h2 className="font-display text-lg tracking-tight">{def.label}</h2>
        <p className="font-mono text-xs text-muted">{variantLabel(selected, st.variant)}</p>
      </div>

      <div className="border-t border-b border-border px-3 py-3">
        {stylePicker}
        {otherPicker}
      </div>

      <div className="border-b border-border px-3 py-3">
        <HsbSliders
          title="Part 1 Color"
          hex={st.paint ?? getRecipe(st.variant).palette.prim}
          onChange={(hex) => patchSlot(selected, { paint: hex })}
        />
        <div className="mb-4 flex gap-1">
          <Button size="sm" variant="outline" onClick={() => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim, def.group)}>
            Group
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPaint(st.paint ?? getRecipe(st.variant).palette.prim)}>
            Body
          </Button>
        </div>
        <HsbSliders
          title="Part 2 Color"
          hex={st.paint2 ?? getRecipe(st.variant).palette.sec}
          onChange={(hex) => patchSlot(selected, { paint2: hex })}
        />
        <div className="mb-4 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec, def.group)}
          >
            Group
          </Button>
          <Button size="sm" variant="outline" onClick={() => applyPaint2(st.paint2 ?? getRecipe(st.variant).palette.sec)}>
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

      <div className="border-b border-border px-3 py-3 space-y-4">
        <AxisSliders
          title="Position"
          x={st.px}
          y={st.py}
          z={st.pz}
          min={-0.8}
          max={0.8}
          step={0.005}
          onChange={(axis, v) => patchSlot(selected, { [axis === "x" ? "px" : axis === "y" ? "py" : "pz"]: v })}
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
          onChange={(axis, v) => patchSlot(selected, { [axis === "x" ? "rx" : axis === "y" ? "ry" : "rz"]: v })}
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
          onChange={(axis, v) => patchSlot(selected, { [axis === "x" ? "sx" : axis === "y" ? "sy" : "sz"]: v })}
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
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => patchSlot(selected, { visible: !st.visible })}>
            {st.visible ? "Hide" : "Show"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => resetSlotDefault(selected)}>
            Default
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <img
          src="/MOSA.png"
          alt="MOSA"
          className={cn("h-[22px] w-auto shrink-0 select-none", theme === "light" && "brightness-0")}
        />
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
          <Button size="iconSm" variant="ghost" aria-label="Theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
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
              mobilePane === "parts" ? "flex max-h-[40%] border-t" : "hidden",
            )}
          >
            {partsBody}
          </aside>
        )}

        <section className="relative order-1 min-h-[38vh] min-w-0 flex-1 overflow-hidden bg-bg lg:order-2 lg:min-h-0">
          {mounted ? <HangarCanvas /> : <HangarFallback />}
          {mounted && poseMenu && (
            <PoseMenu
              x={poseMenu.x}
              y={poseMenu.y}
              poseId={poseId}
              onPick={setPose}
            />
          )}
          <p className="pointer-events-none absolute bottom-3 right-3 hidden font-mono text-[11px] text-subtle sm:block">
            Drag to orbit
          </p>
          {mounted && (
            <div className="hidden lg:block">
              {panels.parts && (
                <FloatPanel
                  title="Parts"
                  rect={panels.parts}
                  z={zOf("parts")}
                  onChange={(p) => setPanel("parts", p)}
                  onReset={() => setPanel("parts", defaultPanels().parts)}
                  onFocus={() => focusPanel("parts")}
                  extra={visToggle}
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
                  extra={
                    <button
                      type="button"
                      className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
                      aria-label="Reset camera"
                      onClick={resetCamera}
                    >
                      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="8" r="5.5" />
                        <circle cx="8" cy="8" r="2.25" />
                      </svg>
                    </button>
                  }
                >
                  {adjustBody}
                </FloatPanel>
              )}
            </div>
          )}
        </section>

        {!lg && (
          <aside
            className={cn(
              "order-3 w-full max-w-none shrink-0 flex-col border-border lg:hidden",
              mobilePane === "adjust" ? "flex max-h-[44%] overflow-y-auto border-t" : "hidden",
            )}
          >
            {adjustBody}
          </aside>
        )}

        <div className="order-4 grid grid-cols-2 border-t border-border lg:hidden">
          <button
            className={cn("h-11 text-sm", mobilePane === "parts" ? "bg-surface text-fg" : "text-muted")}
            onClick={() => setMobilePane("parts")}
          >
            Parts
          </button>
          <button
            className={cn("h-11 text-sm", mobilePane === "adjust" ? "bg-surface text-fg" : "text-muted")}
            onClick={() => setMobilePane("adjust")}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

function PoseIcon({ kind }: { kind: string }) {
  const p = { className: "size-6", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (kind === "attention") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="9.5" y="2.2" width="5" height="4.6" rx="0.7" />
        <path d="M12 7.2v8" />
        <path d="M8.6 8.6v6.6M15.4 8.6v6.6" />
        <path d="M12 15.2v6.4" />
        <path d="M10.4 21.6h3.2" />
      </svg>
    );
  }
  if (kind === "flight") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="3.4" y="4.6" width="4.4" height="4.4" rx="0.7" transform="rotate(38 5.6 6.8)" />
        <path d="M8 8.6 17 13" />
        <path d="M9.5 6.5 4 3.6M9.5 10.5 4 12.8" />
        <path d="m17 13 4.5 3.4M17 13l3.6 4.6" />
      </svg>
    );
  }
  if (kind === "shooting") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="13" y="2.4" width="5" height="4.4" rx="0.7" />
        <path d="M15.5 7v6" />
        <path d="M15.5 8.8 5 8" />
        <path d="M15.5 10.5h-4v3" />
        <path d="M15.5 13l-2.5 8M15.5 13l3 8" />
      </svg>
    );
  }
  if (kind === "sword") {
    return (
      <svg viewBox="0 0 24 24" {...p}>
        <rect x="8" y="2.2" width="5" height="4.4" rx="0.7" />
        <path d="M10.5 7v5.5" />
        <path d="m10.5 8.6 8-4.2M10.5 11l-5 1.5" />
        <path d="M10.5 12.5 8 21M10.5 12.5 14 21" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" {...p}>
      <rect x="9.3" y="2" width="5" height="4.4" rx="0.7" />
      <path d="M12 6.6v7.2" />
      <path d="M7.4 9.4h4.2v4.4" />
      <path d="M16.6 9.4h-4.2v3.6" />
      <path d="M12 13.8 8.8 21.6M12 13.8l3.4 7.8" />
    </svg>
  );
}

function PoseMenu({
  x,
  y,
  poseId,
  onPick,
}: {
  x: number;
  y: number;
  poseId: string;
  onPick: (id: string) => void;
}) {
  const left = `clamp(8px, ${x + 6}px, calc(100% - 268px))`;
  const top = `clamp(8px, ${y + 6}px, calc(100% - 60px))`;
  const items: { id: string; label: string }[] = [
    { id: "attention", label: "Attention pose" },
    { id: "aim", label: "Aim pose" },
    { id: "flight", label: "Flight pose" },
    { id: "shooting", label: "Shooting pose" },
    { id: "sword", label: "Sword-strike pose" },
  ];
  return (
    <div
      data-pose-menu
      role="menu"
      aria-label="Posing"
      className="pose-menu absolute z-50 flex rounded-md border border-border bg-elevated/95 p-1 shadow-sm backdrop-blur-sm"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="menuitem"
          aria-label={it.label}
          aria-pressed={poseId === it.id}
          onClick={() => onPick(it.id)}
          className={cn(
            "flex size-11 items-center justify-center rounded-sm text-muted transition-[background-color,color] duration-[var(--motion-quick)] ease-[var(--ease-out)] hover:bg-surface hover:text-fg",
            poseId === it.id && "bg-surface text-fg",
          )}
        >
          <PoseIcon kind={it.id} />
        </button>
      ))}
    </div>
  );
}

function StylePicker({
  current,
  filtered,
  quad,
  onQuad,
  onPick,
  onApplyAll,
  onApplyGroup,
}: {
  current: string;
  filtered: typeof STYLES;
  quad: string;
  onQuad: (v: string) => void;
  onPick: (id: string) => void;
  onApplyAll: (id: string) => void;
  onApplyGroup: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-muted">ID</p>
      <div className="mb-2 flex flex-wrap gap-1">
        <Chip on={quad === "all"} onClick={() => onQuad("all")} label="TTL" />
        {QUAD_RANGES.map((q) => (
          <Chip key={q.id} on={quad === q.id} onClick={() => onQuad(q.id)} label={q.id} />
        ))}
      </div>
      <div className="mb-2 grid max-h-48 grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-1 overflow-y-auto">
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className={cn(
              "h-8 w-full rounded-sm border px-1 font-mono text-[10px]",
              current === s.id ? "border-fg bg-surface text-fg" : "border-border text-muted hover:text-fg",
            )}
          >
            {s.id}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" onClick={() => onApplyGroup(current)}>
          Group
        </Button>
        <Button size="sm" variant="outline" onClick={() => onApplyAll(current)}>
          Body
        </Button>
      </div>
    </div>
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("h-7 rounded-sm border px-2 text-[11px]", on ? "border-fg bg-surface text-fg" : "border-border text-muted")}
    >
      {label}
    </button>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("h-8 rounded-sm border px-2 text-[11px]", on ? "border-fg bg-surface text-fg" : "border-border text-muted")}
    >
      {label}
    </button>
  );
}

function HangarFallback() {
  return <div className="h-full w-full bg-bg" />;
}
