import { type ReactNode, useRef } from "react";
import { Pin, PinOff, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PanelRect } from "@/lib/mech/types";
import { HEADER_H } from "@/lib/mech/store";

function hangarBox() {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  return { w: vw, h: Math.max(160, vh - HEADER_H) };
}

function clampPos(x: number, y: number, w: number) {
  const { w: vw, h: vh } = hangarBox();
  return {
    x: Math.min(Math.max(0, vw - w), Math.max(0, x)),
    y: Math.min(Math.max(0, vh - 36), Math.max(0, y)),
  };
}

export function FloatPanel({
  title,
  rect,
  z,
  onChange,
  onReset,
  onFocus,
  children,
  extra,
}: {
  title: string;
  rect: PanelRect;
  z: number;
  onChange: (patch: Partial<PanelRect>) => void;
  onReset: () => void;
  onFocus: () => void;
  children: ReactNode;
  extra?: ReactNode;
}) {
  const drag = useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
  const resize = useRef<{ my: number; h: number } | null>(null);

  if (rect.folded) {
    return (
      <button
        type="button"
        onClick={() => {
          onFocus();
          onChange({ folded: false });
        }}
        className="absolute z-20 h-8 rounded-sm border border-border bg-elevated/95 px-3 text-xs text-fg shadow-sm"
        style={{ left: rect.x, top: rect.y }}
      >
        {title}
      </button>
    );
  }

  return (
    <section
      className="absolute flex flex-col overflow-hidden rounded-md border border-border bg-elevated/95 shadow-sm backdrop-blur-sm"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: z,
        maxWidth: "100%",
        maxHeight: "100%",
      }}
      onPointerDown={onFocus}
      onWheel={(e) => e.stopPropagation()}
    >
      <header
        className={cn(
          "flex h-9 shrink-0 items-center gap-1 border-b border-border px-2",
          rect.pinned ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        )}
        onPointerDown={(e) => {
          if (rect.pinned) return;
          if ((e.target as HTMLElement).closest("button")) return;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { mx: e.clientX, my: e.clientY, x: rect.x, y: rect.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          onChange(
            clampPos(
              drag.current.x + (e.clientX - drag.current.mx),
              drag.current.y + (e.clientY - drag.current.my),
              rect.w,
            ),
          );
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
      >
        <span className="min-w-0 flex-1 truncate text-xs font-medium tracking-wide">{title}</span>
        {extra}
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
          aria-label={rect.pinned ? "Unpin" : "Pin"}
          onClick={() => onChange({ pinned: !rect.pinned })}
        >
          {rect.pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
        </button>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
          aria-label="Reset position"
          onClick={onReset}
        >
          <RotateCcw className="size-3.5" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      <div
        className="h-2 shrink-0 cursor-ns-resize bg-transparent hover:bg-surface"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          resize.current = { my: e.clientY, h: rect.h };
        }}
        onPointerMove={(e) => {
          if (!resize.current) return;
          const { h: vh } = hangarBox();
          const next = resize.current.h + (e.clientY - resize.current.my);
          onChange({ h: Math.min(Math.max(160, next), Math.max(160, vh - rect.y)) });
        }}
        onPointerUp={() => {
          resize.current = null;
        }}
      />
    </section>
  );
}
