export function PipelineInfoAgentRow({
  name,
  role,
  email,
  dateLabel,
  dateValue
}: {
  name: string;
  role: string;
  email: string;
  dateLabel: string;
  dateValue: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand to-brand-dark" />
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
            {name}
          </div>
          <div className="text-[10.5px] text-[#9aa0ad] dark:text-gray-400">{role}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
            Email
          </div>
          <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
            {email}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
            {dateLabel}
          </div>
          <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
            {dateValue}
          </div>
        </div>
      </div>
    </div>
  );
}
