import type { MappedSegment, MappingGroupId } from "./types";
import {
  analyzeSmartHead,
  cropPolygonToDataUrl,
  isHeadSmartSlot,
  pickHeadPart,
  type MergeHead12Mode,
  type SmartHeadAnalysis,
  effectiveMergeHead12,
} from "./smartHead";

/** Normalized crop rect in image space (0–1). These are the 2D label boxes. */
export type NormRect = { x: number; y: number; w: number; h: number };

/** Heuristic body-region crops for front / back kit art (editable label boxes later). */
const GROUP_REGION: Record<
  MappingGroupId,
  { front?: NormRect; back?: NormRect }
> = {
  Head: {
    front: { x: 0.34, y: 0.02, w: 0.32, h: 0.16 },
    back: { x: 0.34, y: 0.02, w: 0.32, h: 0.14 },
  },
  Torso: {
    front: { x: 0.28, y: 0.16, w: 0.44, h: 0.26 },
    back: { x: 0.28, y: 0.14, w: 0.44, h: 0.28 },
  },
  Waist: {
    front: { x: 0.32, y: 0.4, w: 0.36, h: 0.12 },
    back: { x: 0.32, y: 0.4, w: 0.36, h: 0.12 },
  },
  ArmL: {
    front: { x: 0.04, y: 0.18, w: 0.26, h: 0.34 },
  },
  ArmR: {
    front: { x: 0.7, y: 0.18, w: 0.26, h: 0.34 },
  },
  LegL: {
    front: { x: 0.2, y: 0.5, w: 0.28, h: 0.44 },
  },
  LegR: {
    front: { x: 0.52, y: 0.5, w: 0.28, h: 0.44 },
  },
  Back: {
    back: { x: 0.26, y: 0.12, w: 0.48, h: 0.42 },
  },
  Weapons: {
    front: { x: 0.72, y: 0.32, w: 0.24, h: 0.36 },
  },
};

/** Per-slot nudge inside the group region so crops are not identical. */
const SLOT_NUDGE: Record<string, Partial<NormRect>> = {
  Head1: { y: 0 },
  Head2: { y: 0.02, h: 0.9 },
  Head3: { y: 0.08, h: 0.85 },
  Face: { y: 0.06, h: 0.7, w: 0.7, x: 0.15 },
  Eye: { y: 0.04, h: 0.35, w: 0.55, x: 0.22 },
  Chest1: { y: 0 },
  Chest2: { y: 0.08 },
  Chest3: { y: -0.04, h: 0.55 },
  Body1: { y: 0.35, h: 0.65 },
  Body2: { y: 0.45, h: 0.55 },
  Waist_Front: { y: 0 },
  Waist_Side: { x: 0.1, w: 0.8 },
  Waist_Back: { y: 0.05 },
  PackCore: { y: 0 },
  Thruster: { y: 0.35, h: 0.55 },
  BinderR: { x: 0.55, w: 0.45 },
  BinderL: { x: 0, w: 0.45 },
  Stabilizer: { y: 0.55, h: 0.4 },
};

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = dataUrl;
  });
}

export function applyNudge(base: NormRect, nudge?: Partial<NormRect>): NormRect {
  if (!nudge) return base;
  const w = base.w * (nudge.w ?? 1);
  const h = base.h * (nudge.h ?? 1);
  const x = base.x + base.w * (nudge.x ?? 0);
  const y = base.y + base.h * (nudge.y ?? 0);
  return {
    x: Math.max(0, Math.min(1 - w, x)),
    y: Math.max(0, Math.min(1 - h, y)),
    w: Math.max(0.05, Math.min(1, w)),
    h: Math.max(0.05, Math.min(1, h)),
  };
}

function cropToDataUrl(img: HTMLImageElement, rect: NormRect, maxPx = 160): string | null {
  if (typeof document === "undefined") return null;
  const sx = Math.floor(rect.x * img.naturalWidth);
  const sy = Math.floor(rect.y * img.naturalHeight);
  const sw = Math.max(1, Math.floor(rect.w * img.naturalWidth));
  const sh = Math.max(1, Math.floor(rect.h * img.naturalHeight));
  const scale = Math.min(1, maxPx / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
  try {
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

export type LabelBox = {
  view: "front" | "back";
  normRect?: NormRect;
  polygon?: { x: number; y: number }[];
};

/**
 * Resolve the 2D label box (view + normRect and/or polygon) for a segment.
 * Head1/2/3 use smartHead polygons when analysis is provided; else heuristic rects.
 */
export function resolveSegmentLabelBox(
  seg: Pick<MappedSegment, "group" | "label" | "slotId" | "sourceView" | "polygon" | "normRect" | "labelView">,
  smart?: SmartHeadAnalysis | null,
): LabelBox | null {
  // Prefer already-attached polygon from crop pass
  if (seg.polygon && seg.polygon.length >= 3) {
    const view = seg.labelView ?? (seg.sourceView === "back" ? "back" : "front");
    return {
      view,
      polygon: seg.polygon,
      normRect: seg.normRect ?? polygonBBox(seg.polygon),
    };
  }

  if (smart && isHeadSmartSlot(seg.slotId)) {
    const part = pickHeadPart(
      smart,
      seg.slotId as "Head1" | "Head2" | "Head3",
      seg.sourceView,
    );
    if (part && part.polygon.length >= 3) {
      return {
        view: part.view,
        polygon: part.polygon,
        normRect: part.normRect,
      };
    }
  }

  const regions = GROUP_REGION[seg.group];
  if (!regions) return null;
  const nudge = SLOT_NUDGE[seg.label] ?? SLOT_NUDGE[seg.slotId];

  const preferBack =
    seg.sourceView === "back" ||
    (seg.group === "Back" && seg.sourceView !== "front");

  if (preferBack && regions.back) {
    return { view: "back", normRect: applyNudge(regions.back, nudge) };
  }
  if (regions.front) {
    return { view: "front", normRect: applyNudge(regions.front, nudge) };
  }
  if (regions.back) {
    return { view: "back", normRect: applyNudge(regions.back, nudge) };
  }
  return null;
}

function polygonBBox(poly: { x: number; y: number }[]): NormRect {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX,
    y: minY,
    w: Math.max(0.01, maxX - minX),
    h: Math.max(0.01, maxY - minY),
  };
}

function pickSource(
  seg: MappedSegment,
  frontImg: HTMLImageElement | null,
  backImg: HTMLImageElement | null,
): { img: HTMLImageElement; rect: NormRect; view: "front" | "back" } | null {
  const box = resolveSegmentLabelBox(seg);
  if (!box?.normRect) return null;
  if (box.view === "back" && backImg) {
    return { img: backImg, rect: box.normRect, view: "back" };
  }
  if (box.view === "front" && frontImg) {
    return { img: frontImg, rect: box.normRect, view: "front" };
  }
  if (frontImg && GROUP_REGION[seg.group]?.front) {
    const nudge = SLOT_NUDGE[seg.label] ?? SLOT_NUDGE[seg.slotId];
    return {
      img: frontImg,
      rect: applyNudge(GROUP_REGION[seg.group]!.front!, nudge),
      view: "front",
    };
  }
  if (backImg && GROUP_REGION[seg.group]?.back) {
    const nudge = SLOT_NUDGE[seg.label] ?? SLOT_NUDGE[seg.slotId];
    return {
      img: backImg,
      rect: applyNudge(GROUP_REGION[seg.group]!.back!, nudge),
      view: "back",
    };
  }
  return null;
}

export interface ApplyMappingCropsOptions {
  mergeHead12Mode?: MergeHead12Mode;
  /** Filled with last smart-head suggestion for UI. */
  onSmartHead?: (info: {
    suggestMergeHead12: boolean;
    finRatio: number;
    merged: boolean;
  }) => void;
}

/**
 * Attach heuristic canvas crops as `imageDataUrl` / `baseImageDataUrl` for visible segments.
 * Head1/2/3 use smartHead polygon masks (outside transparent PNG).
 * Browser-only (uses document.createElement('canvas')).
 */
export async function applyMappingCrops(
  segments: MappedSegment[],
  front: string | null,
  back: string | null,
  options: ApplyMappingCropsOptions = {},
): Promise<MappedSegment[]> {
  if (typeof document === "undefined") {
    return segments.map((s) => ({
      ...s,
      imageDataUrl: s.imageDataUrl ?? null,
      baseImageDataUrl: s.baseImageDataUrl ?? s.imageDataUrl ?? null,
    }));
  }

  let frontImg: HTMLImageElement | null = null;
  let backImg: HTMLImageElement | null = null;
  try {
    if (front) frontImg = await loadImage(front);
  } catch {
    frontImg = null;
  }
  try {
    if (back) backImg = await loadImage(back);
  } catch {
    backImg = null;
  }

  if (!frontImg && !backImg) {
    return segments.map((s) => ({
      ...s,
      imageDataUrl: null,
      baseImageDataUrl: null,
      visibility: "hidden" as const,
      confidence: 0,
      polygon: null,
      normRect: null,
      labelView: null,
    }));
  }

  const mode: MergeHead12Mode = options.mergeHead12Mode ?? "auto";

  // First pass: detect suggestion with merge=false to know auto intent
  let suggestMerge = false;
  let finRatio = 0;
  let smart: SmartHeadAnalysis | null = null;
  const needsHead = segments.some((s) => isHeadSmartSlot(s.slotId));
  if (needsHead && (front || back)) {
    const probe = await analyzeSmartHead(front, back, false);
    suggestMerge = probe.suggestMergeHead12;
    finRatio = probe.finRatio;
    const merged = effectiveMergeHead12(mode, suggestMerge);
    smart = merged
      ? await analyzeSmartHead(front, back, true)
      : probe;
    // Keep suggest from probe (pre-merge geometry)
    smart = { ...smart, suggestMergeHead12: suggestMerge, finRatio };
    options.onSmartHead?.({
      suggestMergeHead12: suggestMerge,
      finRatio,
      merged,
    });
  }

  const mergedNow = smart
    ? effectiveMergeHead12(mode, smart.suggestMergeHead12)
    : false;

  return segments.map((seg) => {
    if (seg.visibility !== "visible") {
      return {
        ...seg,
        imageDataUrl: null,
        baseImageDataUrl: null,
        polygon: null,
        normRect: null,
        labelView: null,
      };
    }

    // Head2 hidden when Head1+2 merged
    if (seg.slotId === "Head2" && mergedNow) {
      return {
        ...seg,
        visibility: "hidden" as const,
        imageDataUrl: null,
        baseImageDataUrl: null,
        confidence: 0,
        polygon: null,
        normRect: null,
        labelView: null,
      };
    }

    if (smart && isHeadSmartSlot(seg.slotId)) {
      const part = pickHeadPart(
        smart,
        seg.slotId as "Head1" | "Head2" | "Head3",
        seg.sourceView,
      );
      if (!part || !part.visible || part.polygon.length < 3) {
        return {
          ...seg,
          visibility: "hidden" as const,
          imageDataUrl: null,
          baseImageDataUrl: null,
          confidence: 0,
          polygon: null,
          normRect: null,
          labelView: null,
        };
      }
      const img = part.view === "back" ? backImg : frontImg;
      if (!img) {
        return {
          ...seg,
          visibility: "hidden" as const,
          imageDataUrl: null,
          baseImageDataUrl: null,
          confidence: 0,
          polygon: part.polygon,
          normRect: part.normRect,
          labelView: part.view,
        };
      }
      const dataUrl = cropPolygonToDataUrl(img, part.polygon, part.normRect);
      if (!dataUrl) {
        return {
          ...seg,
          visibility: "hidden" as const,
          imageDataUrl: null,
          baseImageDataUrl: null,
          confidence: 0,
          polygon: part.polygon,
          normRect: part.normRect,
          labelView: part.view,
        };
      }
      return {
        ...seg,
        imageDataUrl: dataUrl,
        baseImageDataUrl: dataUrl,
        polygon: part.polygon,
        normRect: part.normRect,
        labelView: part.view,
        confidence: Math.max(seg.confidence ?? 0.35, 0.55),
      };
    }

    const picked = pickSource(seg, frontImg, backImg);
    if (!picked) {
      return {
        ...seg,
        visibility: "hidden" as const,
        imageDataUrl: null,
        baseImageDataUrl: null,
        confidence: 0,
        polygon: null,
        normRect: null,
        labelView: null,
      };
    }
    const dataUrl = cropToDataUrl(picked.img, picked.rect);
    if (!dataUrl) {
      return {
        ...seg,
        visibility: "hidden" as const,
        imageDataUrl: null,
        baseImageDataUrl: null,
        confidence: 0,
        polygon: null,
        normRect: null,
        labelView: null,
      };
    }
    return {
      ...seg,
      imageDataUrl: dataUrl,
      baseImageDataUrl: dataUrl,
      polygon: null,
      normRect: picked.rect,
      labelView: picked.view,
      confidence: Math.max(seg.confidence ?? 0.35, 0.45),
    };
  });
}
