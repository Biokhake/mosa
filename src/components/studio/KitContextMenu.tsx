import { useEffect, useRef } from "react";
import { Copy, Pencil, Trash2, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type KitContextAction = "edit" | "copy" | "delete" | "rename";

export function KitContextMenu({
  x,
  y,
  kitName,
  onAction,
  onClose,
}: {
  x: number;
  y: number;
  kitName: string;
  onAction: (action: KitContextAction) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw - 8) left = Math.max(8, vw - rect.width - 8);
    if (top + rect.height > vh - 8) top = Math.max(8, vh - rect.height - 8);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y]);

  const items: { id: KitContextAction; label: string; icon: typeof Pencil; danger?: boolean }[] = [
    { id: "edit", label: "Edit", icon: Pencil },
    { id: "rename", label: "Rename", icon: Type },
    { id: "copy", label: "Copy", icon: Copy },
    { id: "delete", label: "Delete", icon: Trash2, danger: true },
  ];

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`${kitName} kit menu`}
      className="fixed z-[90] min-w-[148px] overflow-hidden rounded-md border border-border bg-elevated py-1 shadow-lg"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="truncate border-b border-border px-3 py-1.5 font-mono text-[10px] text-muted">{kitName}</p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface",
              item.danger ? "text-red-500 hover:text-red-400" : "text-fg",
            )}
            onClick={() => {
              onAction(item.id);
              onClose();
            }}
          >
            <Icon className="size-3.5 opacity-70" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
