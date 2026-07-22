type TimelineItem = {
  title: string;
  subtitle: string;
};

export function PipelineInfoTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="rounded-md border border-[#eef0f4] bg-white dark:border-[#1f2230] dark:bg-[#0b0614]">
      <div className="px-3 py-2.5">
        <div className="space-y-0">
          {items.map((item, idx) => (
            <div key={`${idx}-${item.title}`} className="relative pl-5">
              <div className="absolute left-0 top-[11px] h-2 w-2 rounded-full bg-[#b0144f]" />
              {idx !== items.length - 1 ? (
                <div className="absolute left-[3px] top-[19px] h-[calc(100%-8px)] w-px bg-[#f0d2dd] dark:bg-[#3a2030]" />
              ) : null}

              <div className="flex items-start justify-between gap-4 border-b border-[#f3f4f7] py-2.5 last:border-b-0 dark:border-[#141827]">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#2f3440] dark:text-gray-100">
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[#9aa0ad] dark:text-gray-400">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
