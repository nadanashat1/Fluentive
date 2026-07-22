import { Deal } from "@/types";
import { Building2, Mail, Phone, User } from "lucide-react";

interface ClientInfoProps {
  deal: Deal;
}

export function ClientInfo({ deal }: ClientInfoProps) {
  return (
    <div className="border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
      <h3 className="mb-3 text-[13px] font-semibold text-[#1f2430] dark:text-gray-100">
        Client Information
      </h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
            <User size={16} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-[#1f2430] dark:text-gray-100">
              {deal.clientName}
            </p>
            <p className="text-[12px] text-[#707483] dark:text-gray-400">
              {deal.clientCompany}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-11">
          <Mail size={14} className="text-[#707483] dark:text-gray-400" />
          <a
            href={`mailto:${deal.clientEmail}`}
            className="text-[12px] text-[#707483] hover:text-brand dark:text-gray-400 dark:hover:text-brand"
          >
            {deal.clientEmail}
          </a>
        </div>

        <div className="flex items-center gap-3 pl-11">
          <Phone size={14} className="text-[#707483] dark:text-gray-400" />
          <a
            href={`tel:${deal.clientPhone}`}
            className="text-[12px] text-[#707483] hover:text-brand dark:text-gray-400 dark:hover:text-brand"
          >
            {deal.clientPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
