import Link from "next/link";
import { Pencil, Eye } from "lucide-react";
import { StatusBadge } from "@/components/leads/status-badge";
import { useAPI } from "@/hooks/use-api";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { isLoading, isEmpty, isError } from "@/types/api-state";
import type { Lead } from "@/types";

export function LeadsTable() {
  const leadsState = useAPI<{ leads: Lead[]; total: number }>('/api/leads');
  
  // Using API data directly - WebSocket removed for Vercel compatibility
  const leads = leadsState.status === 'success' ? leadsState.data.leads : [];

  if (isLoading(leadsState)) {
    return (
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-8">
        <LoadingState message="Loading leads..." size="md" />
      </div>
    );
  }

  if (isError(leadsState)) {
    return (
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-8">
        <ErrorState message={leadsState.error} />
      </div>
    );
  }

  if (isEmpty(leadsState) || leads.length === 0) {
    return (
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-8">
        <EmptyState 
          message="No leads yet" 
          description="Start adding leads to see them here!"
          icon="users"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e]">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-[940px] w-full">
          <thead className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-[#fbfbfd] dark:bg-[#0f0820] text-left">
            <tr className="text-[10px] uppercase tracking-wide text-[#9599a6] dark:text-gray-500">
              <th className="px-4 py-3 font-semibold">Full Name</th>
              <th className="px-4 py-3 font-semibold">Course/Interest</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Assigned Agent</th>
              <th className="px-4 py-3 font-semibold">Last Follow Up</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-[#f0f1f3] dark:border-[#2a2f3a] text-[12px] text-[#333a47] dark:text-gray-300">
                <td className="px-4 py-3">
                  <p className="font-semibold">{lead.name}</p>
                  <p className="text-[11px] text-[#9094a1] dark:text-gray-500">{lead.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{lead.course}</p>
                  <p className="text-[11px] text-[#9094a1] dark:text-gray-500">Course interest</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3">{lead.owner?.name || "Unassigned"}</td>
                <td className="px-4 py-3 text-[#6f7481] dark:text-gray-500">{lead.lastFollowUp}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-[#777c8a] dark:text-gray-400">
                    <Link href={`/leads/${lead.id}`}>
                      <Eye size={14} />
                    </Link>
                    <Link href={`/leads/${lead.id}/edit`}>
                      <Pencil size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
