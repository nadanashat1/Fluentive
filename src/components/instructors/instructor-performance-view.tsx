"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { instructors, instructorsKpis, revenueContribution, topPerformers } from "@/data/instructors";
import { formatMoney } from "@/lib/format";
import {
  Avatar,
  Badge,
  HighlightCard,
  KpiCard,
  MiniBar,
  Panel,
  ProgressRow,
  Rating,
  SoftCard,
  SpecTag,
  Subtitle,
  Title
} from "@/components/instructors/instructors.ui";

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

export function InstructorPerformanceView() {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [specialization, setSpecialization] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  const specializations = useMemo(() => {
    const set = new Set(instructors.map((i) => i.specialization));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instructors.filter((i) => {
      const matchesQuery = !q
        ? true
        : i.fullName.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.specialization.toLowerCase().includes(q);
      const matchesStatus = status === "all" ? true : i.status === status;
      const matchesSpec = specialization === "all" ? true : i.specialization === specialization;
      return matchesQuery && matchesStatus && matchesSpec;
    });
  }, [query, status, specialization]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const top = instructors[0];
  const low = instructors.find((x) => x.fullName === "Mark Thorne") ?? instructors[instructors.length - 1];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Title>Instructor Performance</Title>
          <Subtitle>Real-time revenue and engagement metrics across your faculty.</Subtitle>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr_1.2fr]">
        <KpiCard
          label="Total Instructors"
          value={`${instructorsKpis.totalInstructors.value}`}
          delta={`+${instructorsKpis.totalInstructors.deltaPct}%`}
        />
        <KpiCard
          label="Revenue Growth Rate"
          value={`+${instructorsKpis.revenueGrowthRate.valuePct.toFixed(1)}%`}
        />
        <KpiCard
          label="Total Revenue"
          value={formatMoney(instructorsKpis.totalRevenue.value)}
          delta={`+${instructorsKpis.totalRevenue.delta}%`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <HighlightCard title="Top Revenue Generator" name={top.fullName} value={formatMoney(top.revenue)} variant="top" />
        <HighlightCard title="Lowest Performance Alert" name={low.fullName} value={formatMoney(low.revenue)} variant="low" />
      </div>

      <SoftCard>
        <div className="flex flex-col gap-4 border-b border-[#eef0f4] px-5 py-4 dark:border-[#2a2f3a] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Instructor Directory</div>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-[#e7e9ef] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#646b7a] hover:bg-[#f7f8fb] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400 dark:hover:bg-white/5"
            >
              <Filter size={13} />
              Filter
            </button>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[280px]">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa0ad]" />
              <input
                placeholder="Search instructors..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-soft border border-[#e1e3e9] bg-[#fafbfd] pl-9 pr-3 text-[13px] text-[#313744] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]"
              />
            </div>
            <Link
              href="/instructors/new"
              className="inline-flex items-center justify-center gap-2 rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-button transition hover:bg-brand-dark"
            >
              <Plus size={16} />
              Add Instructor
            </Link>
          </div>
        </div>

        {filterOpen && (
          <div className="grid gap-3 border-b border-[#eef0f4] bg-[#fbfbfd] px-5 py-4 dark:border-[#2a2f3a] dark:bg-[#0f0820] sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Status</div>
              <div className="flex rounded-soft border border-[#e1e3e9] bg-white p-1 dark:border-[#2a2f3a] dark:bg-[#0b0614]">
                {(["all", "active", "inactive"] as const).map((v) => {
                  const active = status === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setStatus(v);
                        setPage(1);
                      }}
                      className={
                        active
                          ? "flex-1 rounded-soft bg-brand px-3 py-1.5 text-[12px] font-semibold text-white"
                          : "flex-1 rounded-soft px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:bg-[#f7f8fb] dark:text-gray-300 dark:hover:bg-white/5"
                      }
                    >
                      {v === "all" ? "All" : v === "active" ? "Active" : "Inactive"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Specialization</div>
              <select
                value={specialization}
                onChange={(e) => {
                  setSpecialization(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] font-semibold text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:text-gray-200"
              >
                {specializations.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All specializations" : s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setSpecialization("all");
                  setPage(1);
                }}
                className="h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-4 text-[13px] font-semibold text-[#646b7a] hover:bg-[#f7f8fb] dark:border-[#2a2f3a] dark:bg-[#0b0614] dark:text-gray-400 dark:hover:bg-white/5"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <thead className="bg-[#fafafd] text-left dark:bg-[#0f0820]">
              <tr>
                <th className="w-[30%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Instructor
                </th>
                <th className="w-[18%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Specialization
                </th>
                <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Courses
                </th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Students
                </th>
                <th className="w-[16%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Revenue
                </th>
                <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Rating
                </th>
                <th className="w-[8%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((inst) => (
                <tr
                  key={inst.id}
                  className="border-t border-[#eef0f4] transition-colors hover:bg-[#fafbfd] dark:border-[#2a2f3a] dark:hover:bg-[#0f0820]"
                >
                  <td className="px-5 py-4">
                    <Link href={`/instructors/${inst.id}`} className="flex items-center gap-3">
                      <Avatar initials={initials(inst.fullName)} tone={inst.avatarColor ?? "brand"} className="h-9 w-9" />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">
                          {inst.fullName}
                        </div>
                        <div className="truncate text-[11px] text-[#9aa0ad]">{inst.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <SpecTag>{inst.specialization}</SpecTag>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
                    {inst.courses}
                  </td>
                  <td className="px-5 py-4 text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
                    {inst.students.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
                      {formatMoney(inst.revenue)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <MiniBar valuePct={Math.max(8, Math.min(100, (inst.revenue / 150_000) * 100))} className="w-[110px]" />
                      <span className={inst.revenueDeltaPct >= 0 ? "text-[11px] font-semibold text-emerald-600" : "text-[11px] font-semibold text-[#f25572]"}>
                        {inst.revenueDeltaPct >= 0 ? "+" : ""}
                        {inst.revenueDeltaPct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Rating value={inst.rating} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={inst.status === "active" ? "active" : "inactive"}>{inst.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-[11px] text-[#9aa0ad] dark:text-gray-500">
          <span>
            Showing {pageItems.length} of {filtered.length} instructors
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-soft px-2 py-1 font-semibold hover:bg-[#f7f8fb] disabled:opacity-50 dark:hover:bg-white/5"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const active = p === safePage;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={
                    active
                      ? "rounded-soft bg-[#f0f1f4] px-2 py-1 font-semibold text-[#2f3440] dark:bg-white/10 dark:text-gray-100"
                      : "rounded-soft px-2 py-1 font-semibold hover:bg-[#f7f8fb] dark:hover:bg-white/5"
                  }
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-soft px-2 py-1 font-semibold hover:bg-[#f7f8fb] disabled:opacity-50 dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      </SoftCard>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Revenue Contribution</div>
            <Badge tone="neutral">% of Total $1.2M</Badge>
          </div>
          <div className="space-y-4">
            {revenueContribution.map((row) => (
              <ProgressRow key={row.name} label={row.name} pct={row.pct} tone="brand" />
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Top Performers</div>
          <div className="space-y-4">
            {topPerformers.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-[#111827]" />
                    <span className="truncate font-semibold text-[#2f3440] dark:text-gray-200">{p.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#9aa0ad]">{formatMoney(p.value)}</span>
                </div>
                <MiniBar valuePct={Math.max(10, Math.min(100, (p.value / topPerformers[0].value) * 100))} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
