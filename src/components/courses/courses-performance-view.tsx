"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { fetchCoursePerformance, type CourseListItem, type CourseSummary } from "@/lib/courses";
import { useToast } from "@/components/ui/toast";

const statusClasses: Record<"ACTIVE" | "PAUSED" | "ARCHIVED", string> = {
  ACTIVE: "bg-[#e7f7ee] text-[#0f8f4f]",
  PAUSED: "bg-[#ffe9e9] text-[#cc334b]",
  ARCHIVED: "bg-[#edf0f4] text-[#758092]"
};

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") return "-";
  return `$${value.toLocaleString()}`;
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number") return "-";
  return value.toLocaleString();
}

function progressWidthClass(percent: number) {
  if (percent >= 95) return "w-full";
  if (percent >= 80) return "w-4/5";
  if (percent >= 66) return "w-2/3";
  if (percent >= 50) return "w-1/2";
  if (percent >= 33) return "w-1/3";
  if (percent >= 20) return "w-1/4";
  return "w-[8%]";
}

export function CoursesPerformanceView() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<CourseSummary | null>(null);
  const [rows, setRows] = useState<CourseListItem[]>([]);
  const [topCourses, setTopCourses] = useState<Array<{ id: string; name: string; revenue?: number | null }>>([]);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const displayRows = useMemo(() => rows.slice(0, 8), [rows]);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const state = await fetchCoursePerformance({ category: categoryFilter, status: statusFilter, page });
    if (state.status === "success") {
      const payload = state.data;
      setSummary(payload?.summary || null);
      setRows(payload?.courses || []);
      setTopCourses(payload?.topCourses || []);
    } else if (state.status === "error") {
      setSummary(null);
      setRows([]);
      setTopCourses([]);
      showToast(state.error || "Failed to load courses.", "error");
    } else {
      setSummary(null);
      setRows([]);
      setTopCourses([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadData();
  }, [categoryFilter, statusFilter, page]);

  const mappedRows = displayRows.map((row) => ({
    ...row,
    status: ((row.status || "active").toUpperCase() as "ACTIVE" | "PAUSED" | "ARCHIVED"),
    trend: row.trend || "flat"
  }));

  const topMaxRevenue = topCourses.reduce((max, current) => Math.max(max, current.revenue || 0), 0);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[42px] font-semibold leading-[1.05] text-[#21242e] dark:text-gray-100">Courses Performance</h1>
          <p className="mt-1 text-[15px] text-[#707888] dark:text-gray-400">
            Real-time data architecture for your educational ecosystem.
          </p>
        </div>
        <Link
          href="/courses/new"
          className="inline-flex h-11 items-center justify-center rounded-soft bg-brand px-6 text-[12px] font-semibold uppercase tracking-wide text-white shadow-button transition hover:bg-brand/90"
        >
          + Add Course
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-lg2 border border-[#ececef] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <p className="text-[10px] font-semibold tracking-wide text-[#8b93a2] dark:text-gray-500">TOTAL REVENUE</p>
          <p className="mt-2 text-[36px] font-semibold leading-none text-[#222632] dark:text-gray-100">{formatCurrency(summary?.totalRevenue)}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#e7f7ee] px-2 py-0.5 text-[10px] font-semibold text-[#0f8f4f]">Live</span>
        </article>
        <article className="rounded-lg2 border border-[#ececef] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <p className="text-[10px] font-semibold tracking-wide text-[#8b93a2] dark:text-gray-500">TOTAL SALES</p>
          <p className="mt-2 text-[36px] font-semibold leading-none text-[#222632] dark:text-gray-100">{formatNumber(summary?.totalSales)}</p>
          <span className="mt-3 inline-flex rounded-full bg-[#e7f7ee] px-2 py-0.5 text-[10px] font-semibold text-[#0f8f4f]">Live</span>
        </article>
        <article className="rounded-lg2 border border-brand bg-brand p-4 text-white shadow-button">
          <p className="text-[10px] font-semibold tracking-wide text-[#f5d6e4]">BEST SELLING</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-white">{summary?.bestSellingName || "-"}</p>
          <p className="mt-1 text-[12px] text-[#f0bed3]">{formatCurrency(summary?.bestSellingRevenue)}</p>
        </article>
        <article className="rounded-lg2 border border-[#ececef] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <p className="text-[10px] font-semibold tracking-wide text-[#8b93a2] dark:text-gray-500">NEEDS REVIEW</p>
          <p className="mt-2 text-[30px] font-semibold leading-none text-[#222632] dark:text-gray-100">{summary?.needsReviewName || "-"}</p>
          <p className="mt-1 text-[12px] text-[#cc334b]">{summary?.needsReviewDelta ?? 0}% this week</p>
        </article>
        <article className="rounded-lg2 border border-[#ececef] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <p className="text-[10px] font-semibold tracking-wide text-[#8b93a2] dark:text-gray-500">AVG CONVERSION</p>
          <p className="mt-2 text-[36px] font-semibold leading-none text-[#222632] dark:text-gray-100">
            {typeof summary?.averageConversion === "number" ? `${summary.averageConversion}%` : "-"}
          </p>
          <span className="mt-3 inline-flex rounded-full bg-[#e7f7ee] px-2 py-0.5 text-[10px] font-semibold text-[#0f8f4f]">Stable</span>
        </article>
      </section>

      <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[30px] font-semibold text-[#2a2f3a] dark:text-gray-100">Detailed Performance</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowCategoryMenu((prev) => !prev);
                  setShowStatusMenu(false);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-soft border border-[#e6e8ee] bg-[#fafbfc] px-3 text-[12px] font-medium text-[#535c6d] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300"
              >
                {categoryFilter || "Category"}
                <ChevronDown size={14} />
              </button>
              {showCategoryMenu ? (
                <div className="absolute right-0 z-20 mt-1 min-w-40 rounded-soft border border-[#e6e8ee] bg-white p-1 shadow-card dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
                  {["", "Design", "Development", "Marketing"].map((opt) => (
                    <button
                      key={opt || "all"}
                      onClick={() => {
                        setCategoryFilter(opt);
                        setPage(1);
                        setShowCategoryMenu(false);
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-[#4e5666] hover:bg-[#f6f7fa] dark:text-gray-300 dark:hover:bg-[#0f0820]"
                    >
                      {opt || "All Categories"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowStatusMenu((prev) => !prev);
                  setShowCategoryMenu(false);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-soft border border-[#e6e8ee] bg-[#fafbfc] px-3 text-[12px] font-medium text-[#535c6d] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300"
              >
                {statusFilter || "Status"}
                <ChevronDown size={14} />
              </button>
              {showStatusMenu ? (
                <div className="absolute right-0 z-20 mt-1 min-w-40 rounded-soft border border-[#e6e8ee] bg-white p-1 shadow-card dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
                  {["", "active", "paused", "archived"].map((opt) => (
                    <button
                      key={opt || "all"}
                      onClick={() => {
                        setStatusFilter(opt);
                        setPage(1);
                        setShowStatusMenu(false);
                      }}
                      className="block w-full rounded px-2 py-1.5 text-left text-[12px] text-[#4e5666] hover:bg-[#f6f7fa] dark:text-gray-300 dark:hover:bg-[#0f0820]"
                    >
                      {opt || "All Statuses"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              onClick={() => void loadData(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-soft border border-[#e6e8ee] bg-[#fafbfc] text-[#535c6d] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300"
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => {
                setCategoryFilter("");
                setStatusFilter("");
                setPage(1);
              }}
              className="inline-flex h-9 items-center rounded-soft border border-[#e6e8ee] bg-[#fafbfc] px-3 text-[12px] font-medium text-[#535c6d] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="skeleton h-52 w-full rounded-lg2" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full">
              <thead className="border-b border-[#edf0f4] text-left dark:border-[#2a2f3a]">
                <tr className="text-[10px] uppercase tracking-wide text-[#8b93a2] dark:text-gray-500">
                  <th className="pb-3 font-semibold">Course Name</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Leads</th>
                  <th className="pb-3 font-semibold">Sales</th>
                  <th className="pb-3 font-semibold">Revenue</th>
                  <th className="pb-3 font-semibold">Top Agent</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {mappedRows.length > 0 ? (
                  mappedRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#f1f3f6] dark:border-[#2a2f3a]">
                      <td className="py-4">
                        <p className="text-[24px] font-semibold leading-tight text-[#21242e] dark:text-gray-100">{row.name || "-"}</p>
                        <p className="text-[11px] text-[#8b93a2] dark:text-gray-500">{row.category || "-"}</p>
                      </td>
                      <td className="text-[20px] font-medium text-[#2f3440] dark:text-gray-300">{formatCurrency(row.price)}</td>
                      <td className="text-[20px] font-medium text-[#2f3440] dark:text-gray-300">{formatNumber(row.leads)}</td>
                      <td className="text-[20px] font-semibold text-brand">{formatNumber(row.sales)}</td>
                      <td className="text-[20px] font-semibold text-[#21242e] dark:text-gray-100">{formatCurrency(row.revenue)}</td>
                      <td className="text-[20px] text-[#2f3440] dark:text-gray-300">{row.topAgentName || "-"}</td>
                      <td>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClasses[row.status as keyof typeof statusClasses]}`}>{row.status}</span>
                      </td>
                      <td>
                        {row.trend === "up" ? (
                          <TrendingUp size={15} className="text-[#0f8f4f]" />
                        ) : row.trend === "down" ? (
                          <TrendingDown size={15} className="text-[#cc334b]" />
                        ) : (
                          <span className="text-[#9ba2b1]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[13px] text-[#8b93a2] dark:text-gray-400">
                      No courses data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[12px] text-[#7c8696] dark:text-gray-400">
          <p>Showing {mappedRows.length} courses</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="h-7 rounded border border-[#e3e6ec] px-2 text-[11px] text-[#5f6674] disabled:opacity-50 dark:border-[#2a2f3a] dark:text-gray-300"
            >
              Prev
            </button>
            <span className="inline-flex h-7 items-center rounded border border-[#e3e6ec] px-2 text-[11px] text-[#5f6674] dark:border-[#2a2f3a] dark:text-gray-300">
              {page}
            </span>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="h-7 rounded border border-[#e3e6ec] px-2 text-[11px] text-[#5f6674] dark:border-[#2a2f3a] dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[24px] font-semibold text-[#2a2f3a] dark:text-gray-100">Sales & Revenue Trends</h3>
              <p className="text-[12px] text-[#8b93a2] dark:text-gray-500">Monthly performance breakdown</p>
            </div>
            <button className="rounded-soft border border-[#e6e8ee] bg-[#fafbfc] px-3 py-1.5 text-[11px] font-semibold text-[#606878] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300">
              LAST 6 MONTHS
            </button>
          </div>
          <div className="mt-5 h-48 rounded-soft border border-[#edf0f4] bg-[linear-gradient(180deg,#fdfdff_0%,#f7f8fb_100%)] p-4 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="grid h-full place-items-center rounded-soft border border-dashed border-[#dce1e8] text-[12px] text-[#8c95a4] dark:border-[#2a2f3a] dark:text-gray-500">
              Waiting for trend data from backend
            </div>
          </div>
          <div className="mt-3 grid grid-cols-6 text-center text-[10px] font-semibold tracking-wide text-[#9aa2b0]">
            <span>JAN</span>
            <span>FEB</span>
            <span>MAR</span>
            <span>APR</span>
            <span>MAY</span>
            <span>JUN</span>
          </div>
        </section>

        <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
          <h3 className="text-[24px] font-semibold text-[#2a2f3a] dark:text-gray-100">Top 5 Performing Courses</h3>
          <p className="text-[12px] text-[#8b93a2] dark:text-gray-500">Based on revenue generated</p>
          <div className="mt-4 space-y-3">
            {topCourses.length > 0 ? (
              topCourses.slice(0, 5).map((course, index) => {
                const percent = topMaxRevenue > 0 ? Math.max(8, Math.round(((course.revenue || 0) / topMaxRevenue) * 100)) : 8;
                return (
                  <div key={course.id}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <p className="font-medium text-[#2f3440] dark:text-gray-200">
                        <span className="mr-2 font-semibold text-[#a33b69]">{String(index + 1).padStart(2, "0")}</span>
                        {course.name}
                      </p>
                      <span className="font-semibold text-[#2f3440] dark:text-gray-200">{formatCurrency(course.revenue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#eceff3] dark:bg-[#2a2f3a]">
                      <div className={`h-2 rounded-full bg-brand ${progressWidthClass(percent)}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-soft border border-dashed border-[#dce1e8] p-6 text-center text-[12px] text-[#8c95a4] dark:border-[#2a2f3a] dark:text-gray-500">
                No top courses yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
