"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg2 border border-[#ececef] bg-white shadow-card dark:border-[#2a2f3a] dark:bg-[#1a0b2e]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function CardPad({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">{children}</h1>;
}

export function Sub({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[14px] text-[#8b8f9b] dark:text-gray-400">{children}</p>;
}

export function Pill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "bad" | "brand";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
        tone === "neutral" && "bg-[#f0f1f4] text-[#646b7a] dark:bg-white/10 dark:text-gray-300",
        tone === "brand" && "bg-[#f4daea] text-brand dark:bg-brand/20 dark:text-brand",
        tone === "good" && "bg-[#d7f4df] text-[#216637] dark:bg-emerald-500/15 dark:text-emerald-300",
        tone === "bad" && "bg-[#ffe0e0] text-[#9f3030] dark:bg-red-500/15 dark:text-red-300"
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  className,
  variant = "ghost",
  onClick,
  type = "button"
}: {
  children: ReactNode;
  className?: string;
  variant?: "ghost" | "primary";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const base =
    variant === "primary"
      ? "rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-button hover:bg-brand-dark"
      : "rounded-soft border border-[#e1e3e9] bg-white px-4 py-2 text-[13px] font-semibold text-[#646b7a] hover:bg-[#f7f8fb] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400 dark:hover:bg-white/5";

  return (
    <button type={type} onClick={onClick} className={clsx("inline-flex items-center justify-center gap-2 transition", base, className)}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] font-semibold text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200",
        props.className
      )}
    />
  );
}
