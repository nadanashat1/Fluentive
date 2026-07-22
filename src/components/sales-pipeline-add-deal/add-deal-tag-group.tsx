import clsx from "clsx";

type Option<T extends string> = {
  value: T;
  label: string;
};

export function AddDealTagGroup<T extends string>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "h-7 rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.08em] transition",
              active
                ? "bg-[#ffecef] text-[#b0144f] dark:bg-[#2a0f1b] dark:text-[#f1a9c4]"
                : "border border-[#e6e7eb] bg-white text-[#707483] hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
