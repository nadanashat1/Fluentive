import React from "react";

export function AddDealSelect({
  label,
  options,
  defaultValue,
  value,
  onChange,
  leftSlot,
  rightIcon
}: {
  label: string;
  options: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  leftSlot?: React.ReactNode;
  rightIcon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
        {label}
      </div>

      <div className="relative flex h-9 items-center rounded-soft border border-[#e4e6ec] bg-white px-3 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
        {leftSlot ? <div className="mr-2 flex-shrink-0">{leftSlot}</div> : null}

        <select
          defaultValue={value === undefined ? defaultValue : undefined}
          value={value}
          className="h-full w-full appearance-none bg-transparent pr-7 text-[12px] font-medium text-[#2f3440] outline-none dark:text-gray-200"
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {rightIcon || <span className="text-[12px] font-semibold text-[#9aa0ad]">▾</span>}
        </div>
      </div>
    </label>
  );
}
