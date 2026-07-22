export function AddDealTextarea({
  label,
  placeholder,
  value,
  onChange
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      {label ? (
        <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
          {label}
        </div>
      ) : null}
      <textarea
        className="min-h-[84px] w-full resize-none rounded-soft border border-[#e4e6ec] bg-white px-3 py-2 text-[12px] font-medium text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </label>
  );
}
