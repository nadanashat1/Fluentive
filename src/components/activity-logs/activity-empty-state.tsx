"use client";

import { ClipboardList, Users, Briefcase, Bot, Shield } from "lucide-react";

export function ActivityEmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-[16px] font-semibold text-[#2f3440] dark:text-gray-200">
          No matching activity
        </p>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-[#8b8f9b] dark:text-gray-400">
          Try clearing filters or widening the date range. Routine heartbeat activity stays hidden
          unless you turn on &quot;Show heartbeats&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf2f6] dark:bg-[#2a1020]">
        <ClipboardList size={28} className="text-[#840A36]" aria-hidden />
      </div>
      <p className="text-[16px] font-semibold text-[#2f3440] dark:text-gray-200">
        Your team activity will appear here
      </p>
      <p className="mx-auto mt-2 max-w-lg text-[14px] text-[#8b8f9b] dark:text-gray-400">
        This is your operational timeline — a human-readable history of what happens in Fluentive.
        As people work, you&apos;ll see sign-ins, lead updates, deals, exports, and AI actions.
      </p>
      <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-[13px] text-[#646b7a] dark:text-gray-400">
        <li className="flex items-center gap-2">
          <Users size={14} className="text-emerald-600" /> Lead and contact changes
        </li>
        <li className="flex items-center gap-2">
          <Briefcase size={14} className="text-blue-600" /> Deal pipeline movement
        </li>
        <li className="flex items-center gap-2">
          <Bot size={14} className="text-fuchsia-600" /> AI summaries and scoring
        </li>
        <li className="flex items-center gap-2">
          <Shield size={14} className="text-red-600" /> Sign-ins and security alerts
        </li>
      </ul>
    </div>
  );
}
