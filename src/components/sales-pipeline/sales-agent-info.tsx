import { Deal } from "@/types";
import { User, Mail } from "lucide-react";

interface SalesAgentInfoProps {
  deal: Deal;
}

export function SalesAgentInfo({ deal }: SalesAgentInfoProps) {
  return (
    <div className="border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
      <h3 className="mb-3 text-[13px] font-semibold text-[#1f2430] dark:text-gray-100">
        Sales Agent
      </h3>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
          {deal.salesAgent.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-[#1f2430] dark:text-gray-100">
            {deal.salesAgent.name}
          </p>
          <div className="flex items-center gap-1.5 text-[12px] text-[#707483] dark:text-gray-400">
            <Mail size={12} />
            <a
              href={`mailto:${deal.salesAgent.email}`}
              className="hover:text-brand dark:hover:text-brand"
            >
              {deal.salesAgent.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
