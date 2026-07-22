import { Deal } from "@/types";
import { Phone, Mail, Video, Edit, Archive, MoreHorizontal } from "lucide-react";

interface ActionButtonsProps {
  deal: Deal;
}

export function ActionButtons({ deal }: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <button className="flex flex-col items-center gap-1.5 rounded-lg border border-[#e6e7eb] bg-white px-3 py-3 text-[12px] font-medium text-[#707483] transition hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] dark:text-gray-400 dark:hover:bg-[#250f40]">
          <Phone size={16} />
          <span>Call</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 rounded-lg border border-[#e6e7eb] bg-white px-3 py-3 text-[12px] font-medium text-[#707483] transition hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] dark:text-gray-400 dark:hover:bg-[#250f40]">
          <Mail size={16} />
          <span>Email</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 rounded-lg border border-[#e6e7eb] bg-white px-3 py-3 text-[12px] font-medium text-[#707483] transition hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] dark:text-gray-400 dark:hover:bg-[#250f40]">
          <Video size={16} />
          <span>Meeting</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-brand-dark">
          <Edit size={14} />
          <span>Edit Deal</span>
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg border border-[#e6e7eb] bg-white px-4 py-2.5 text-[13px] font-medium text-[#707483] transition hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] dark:text-gray-400 dark:hover:bg-[#250f40]">
          <Archive size={14} />
          <span>Archive</span>
        </button>
      </div>

      <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e6e7eb] bg-white px-4 py-2.5 text-[13px] font-medium text-[#707483] transition hover:bg-[#f6f6f8] dark:border-[#2a2f3a] dark:bg-[#1a0b2e] dark:text-gray-400 dark:hover:bg-[#250f40]">
        <MoreHorizontal size={14} />
        <span>More Options</span>
      </button>
    </div>
  );
}
