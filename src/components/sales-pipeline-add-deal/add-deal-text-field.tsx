import React from "react";

export function AddDealTextField({
  label,
  placeholder,
  leftAdornment,
  name,
  value,
  onChange,
  type
}: {
  label: string;
  placeholder?: string;
  leftAdornment?: string;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
        {label}
      </div>
      <div className="relative">
        {leftAdornment ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#9aa0ad]">
            {leftAdornment}
          </div>
        ) : null}
        <input
          className={
            "h-9 w-full rounded-soft border border-[#e4e6ec] bg-white px-3 text-[12px] font-medium text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]" +
            (leftAdornment ? " pl-7" : "")
          }
          name={name}
          type={type || "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    </label>
  );
}
