"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Star, TriangleAlert, TrendingDown, TrendingUp } from "lucide-react";

export function Panel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg2 border border-[#ececef] bg-white p-5 shadow-[0_1px_0_rgba(17,24,39,0.02)] dark:border-[#2a2f3a] dark:bg-[#1a0b2e]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SoftCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg2 border border-[#ececef] bg-white shadow-card dark:border-[#2a2f3a] dark:bg-[#0b0614]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
      {children}
    </div>
  );
}

export function Title({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("text-[20px] font-bold text-[#2f3440] dark:text-gray-100", className)}>
      {children}
    </div>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <div className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">{children}</div>;
}

export function PrimaryButton({
  children,
  className,
  type = "button",
  onClick
}: {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-button transition hover:bg-brand-dark",
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  type = "button",
  onClick
}: {
  children: ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-soft border border-[#e1e3e9] bg-white px-4 py-2 text-[13px] font-semibold text-[#646b7a] transition hover:bg-[#f8f9fa] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400 dark:hover:bg-[#250f40]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "active" | "inactive";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        tone === "brand" && "bg-[#f4daea] text-brand dark:bg-brand/20 dark:text-brand",
        tone === "active" && "bg-[#d7f4df] text-[#216637] dark:bg-emerald-500/15 dark:text-emerald-300",
        tone === "inactive" && "bg-[#f0f1f3] text-[#7b8190] dark:bg-white/10 dark:text-gray-300",
        tone === "neutral" && "bg-[#f3f6ff] text-[#3657d6] dark:bg-white/10 dark:text-gray-300",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SpecTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#f0f1f4] px-2.5 py-1 text-[10.5px] font-semibold text-[#6b7280] dark:bg-white/10 dark:text-gray-300">
      {children}
    </span>
  );
}

export function Rating({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
      <Star size={14} className="text-amber-500" fill="currentColor" />
      {value.toFixed(1)}
    </div>
  );
}

export function Avatar({
  initials,
  tone = "brand",
  className
}: {
  initials: string;
  tone?: "brand" | "slate" | "emerald" | "blue" | "amber";
  className?: string;
}) {
  const bg =
    tone === "brand"
      ? "from-brand to-brand-dark"
      : tone === "emerald"
        ? "from-emerald-500 to-emerald-700"
        : tone === "blue"
          ? "from-blue-500 to-blue-700"
          : tone === "amber"
            ? "from-amber-500 to-amber-700"
            : "from-[#1f2937] to-[#111827]";

  return (
    <div
      className={clsx(
        "grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white",
        bg,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  icon
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg2 border border-[#ececef] bg-white px-5 py-4 shadow-card dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
            {label}
          </div>
          <div className="mt-2 text-[24px] font-bold leading-none text-[#202530] dark:text-gray-100">
            {value}
          </div>
        </div>
        {icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#f7edf2] text-brand dark:bg-brand/20">
            {icon}
          </div>
        ) : null}
      </div>
      {delta ? (
        <div className="mt-2 text-[11px] font-semibold text-[#8b8f9b] dark:text-gray-400">{delta}</div>
      ) : null}
    </div>
  );
}

export function HighlightCard({
  title,
  name,
  value,
  variant
}: {
  title: string;
  name: string;
  value: string;
  variant: "top" | "low";
}) {
  const icon =
    variant === "top" ? (
      <TrendingUp size={16} className="text-emerald-500" />
    ) : (
      <TriangleAlert size={16} className="text-[#f25572]" />
    );
  const ring =
    variant === "top" ? "ring-emerald-500/25" : "ring-[#f25572]/25";

  return (
    <div className="rounded-lg2 border border-[#ececef] bg-white px-5 py-4 shadow-card dark:border-[#2a2f3a] dark:bg-[#0b0614]">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
          {title}
        </div>
        <div className={clsx("grid h-8 w-8 place-items-center rounded-xl bg-[#f7f8fb] ring-1", ring, "dark:bg-[#0f0820]")}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative">
          <div className={clsx("h-10 w-10 rounded-full bg-gradient-to-br from-brand to-brand-dark")} />
          <div className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm dark:bg-[#0b0614]">
            {variant === "top" ? (
              <TrendingUp size={12} className="text-emerald-500" />
            ) : (
              <TrendingDown size={12} className="text-[#f25572]" />
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">{name}</div>
          <div className="text-[18px] font-bold text-brand">{value}</div>
        </div>
      </div>
    </div>
  );
}

export function ProgressRow({
  label,
  pct,
  tone = "brand"
}: {
  label: string;
  pct: number;
  tone?: "brand" | "slate";
}) {
  const bar = tone === "brand" ? "bg-brand" : "bg-[#1f2937]";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-[#2f3440] dark:text-gray-200">{label}</span>
        <span className="text-[#9aa0ad] dark:text-gray-500">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#f0f1f4] dark:bg-white/10">
        <div className={clsx("h-2 rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MiniBar({
  valuePct,
  className
}: {
  valuePct: number;
  className?: string;
}) {
  return (
    <div className={clsx("h-2 w-full rounded-full bg-[#f0f1f4] dark:bg-white/10", className)}>
      <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(2, Math.min(100, valuePct))}%` }} />
    </div>
  );
}

export function Switch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-10 items-center rounded-full transition",
        checked ? "bg-brand" : "bg-[#d8dbe3] dark:bg-white/15"
      )}
      aria-pressed={checked}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function Segmented({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex rounded-soft border border-[#e1e3e9] bg-white p-1 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "flex-1 rounded-soft px-3 py-1.5 text-[12px] font-semibold transition",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-[#6b7280] hover:bg-[#f7f8fb] dark:text-gray-300 dark:hover:bg-white/5"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
