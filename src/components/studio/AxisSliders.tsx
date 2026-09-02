import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { hexToHsb, hsbToHex } from "@/lib/mech/palette";

function fmt(value: number, step: number) {
  if (step >= 1) return String(Math.round(value));
  const digits = step <= 0.005 ? 3 : 2;
  return value.toFixed(digits);
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1.5rem_minmax(0,1fr)_4.75rem] items-center gap-2">
      <span className="font-mono text-xs text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full accent-fg"
      />
      <input
        type="text"
        inputMode="decimal"
        className="h-8 min-w-0 rounded-sm border border-border bg-elevated px-1.5 font-mono text-xs tabular-nums text-fg"
        value={fmt(value, step)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) e.currentTarget.value = fmt(value, step);
        }}
      />
    </label>
  );
}

function ColorBar({
  label,
  value,
  min,
  max,
  step,
  gradient,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  gradient: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1.5rem_minmax(0,1fr)_4.75rem] items-center gap-2">
      <span className="font-mono text-xs text-muted">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="hsb-bar w-full"
        style={{ backgroundImage: gradient }}
      />
      <input
        type="text"
        inputMode="decimal"
        className="h-8 min-w-0 rounded-sm border border-border bg-elevated px-1.5 font-mono text-xs tabular-nums text-fg"
        value={fmt(value, step)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(n);
        }}
      />
    </label>
  );
}

export function AxisSliders({
  title,
  x,
  y,
  z,
  min,
  max,
  step,
  onChange,
  onReset,
}: {
  title: string;
  x: number;
  y: number;
  z: number;
  min: number;
  max: number;
  step: number;
  onChange: (axis: "x" | "y" | "z", v: number) => void;
  onReset?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted">{title}</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            aria-label={`Reset ${title}`}
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface hover:text-fg"
          >
            <RefreshCw className="size-3.5" />
          </button>
        )}
      </div>
      <SliderRow label="X" value={x} min={min} max={max} step={step} onChange={(v) => onChange("x", v)} />
      <SliderRow label="Y" value={y} min={min} max={max} step={step} onChange={(v) => onChange("y", v)} />
      <SliderRow label="Z" value={z} min={min} max={max} step={step} onChange={(v) => onChange("z", v)} />
    </div>
  );
}

function hueBar() {
  const stops = Array.from({ length: 13 }, (_, i) => hsbToHex(i * 30, 100, 100));
  return `linear-gradient(to right, ${stops.join(",")})`;
}

export function HsbSliders({
  title,
  hex,
  onChange,
}: {
  title: string;
  hex: string;
  onChange: (hex: string) => void;
}) {
  const { h, s, b } = hexToHsb(hex);
  return (
    <div className="mb-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted">{title}</p>
        <span className="size-5 rounded-md border border-[#c4bfb6]" style={{ background: hex }} />
      </div>
      <ColorBar
        label="H"
        value={h}
        min={0}
        max={360}
        step={1}
        gradient={hueBar()}
        onChange={(v) => onChange(hsbToHex(v, s, b))}
      />
      <ColorBar
        label="S"
        value={s}
        min={0}
        max={100}
        step={1}
        gradient={`linear-gradient(to right, ${hsbToHex(h, 0, b)}, ${hsbToHex(h, 100, b)})`}
        onChange={(v) => onChange(hsbToHex(h, v, b))}
      />
      <ColorBar
        label="B"
        value={b}
        min={0}
        max={100}
        step={1}
        gradient={`linear-gradient(to right, #000000, ${hsbToHex(h, s, 100)})`}
        onChange={(v) => onChange(hsbToHex(h, s, v))}
      />
    </div>
  );
}

export function UniformHint({ className }: { className?: string }) {
  return <p className={cn("text-[11px] text-subtle", className)} />;
}
