import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <span className={cn("font-display text-2xl uppercase tracking-tight text-primary", className)}>Xcape</span>;
}

export function Avatar({ url, name, size = 48 }: { url?: string | null; name?: string | null; size?: number }) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span style={{ width: size, height: size }} className="glass-chip inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-primary">
      {url ? <img src={url} alt={name ?? "Avatar"} className="h-full w-full object-cover" /> : <span style={{ fontSize: size * 0.42 }}>{initial}</span>}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label, disabled }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="glass-chip inline-flex rounded-full p-1">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn("rounded-full px-4 py-1.5 text-sm font-bold transition-colors", value === o.value ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ label, value, display, onChange, min, max, step, disabled }: { label: string; value: number; display: string; onChange: (v: number) => void; min: number; max: number; step: number; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Less ${label}`} disabled={disabled || value <= min} onClick={() => onChange(value - step)} className="glass-chip flex size-9 items-center justify-center rounded-full disabled:opacity-40"><Minus className="size-4" /></button>
        <span className="w-20 text-center font-display text-lg">{display}</span>
        <button type="button" aria-label={`More ${label}`} disabled={disabled || value >= max} onClick={() => onChange(value + step)} className="glass-chip flex size-9 items-center justify-center rounded-full disabled:opacity-40"><Plus className="size-4" /></button>
      </div>
    </div>
  );
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 pb-10 pt-6", className)}>{children}</main>;
}
