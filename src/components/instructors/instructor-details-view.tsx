"use client";

import Link from "next/link";
import { Activity, Edit3, Eye, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { instructorDetailsById, instructors } from "@/data/instructors";
import { formatMoney, formatPct } from "@/lib/format";
import type { InstructorActivity, InstructorCourse } from "@/types";
import { Avatar, Badge, GhostButton, MiniBar, Panel, Title } from "@/components/instructors/instructors.ui";

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
}

function Delta({ value }: { value: number }) {
  const good = value >= 0;
  return (
    <span className={good ? "text-[11px] font-semibold text-emerald-600" : "text-[11px] font-semibold text-[#f25572]"}>
      {good ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

function ActivityIcon({ type }: { type: InstructorActivity["type"] }) {
  const base =
    type === "course_updated"
      ? "bg-brand/10 text-brand"
      : type === "student_enrolled"
        ? "bg-emerald-500/10 text-emerald-600"
        : "bg-amber-500/10 text-amber-600";
  const Icon = type === "course_updated" ? Edit3 : type === "student_enrolled" ? Activity : TrendingUp;
  return (
    <div className={clsx("grid h-9 w-9 place-items-center rounded-full", base, "dark:bg-white/10 dark:text-gray-200")}>
      <Icon size={15} />
    </div>
  );
}

function CourseStatus({ status }: { status: InstructorCourse["status"] }) {
  return (
    <Badge tone={status === "active" ? "active" : "inactive"} className="px-3 py-1">
      {status}
    </Badge>
  );
}

export function InstructorDetailsView({ id }: { id: string }) {
  const base = instructors.find((x) => x.id === id);
  const details =
    instructorDetailsById[id] ??
    (base
      ? {
          headlineRole: `${base.specialization} • Senior Instructor`,
          kpis: {
            totalRevenue: base.revenue,
            totalRevenueDeltaPct: Math.max(-12, Math.min(18, base.revenueDeltaPct - 2)),
            totalStudents: base.students,
            totalStudentsDeltaPct: Math.max(-10, Math.min(16, base.revenueDeltaPct - 3)),
            activeCourses: base.courses,
            conversionRatePct: Math.max(6, Math.min(22, 12 + base.revenueDeltaPct / 4)),
            conversionRateDeltaPct: base.revenueDeltaPct >= 0 ? 0.6 : -0.6,
            avgRevenuePerCourse: Math.round(base.revenue / Math.max(1, base.courses)),
            avgRevenuePerCourseDeltaPct: base.revenueDeltaPct >= 0 ? 7.2 : -5.1
          },
          salesPerformance: {
            totalLeads: 520 + base.courses * 40,
            totalSales: 70 + Math.round(base.courses * 6.2),
            conversionRatePct: 12.5,
            revenueBreakdown: [
              { label: base.specialization, pct: 45, color: "brand" as const },
              { label: "Core Courses", pct: 35, color: "slate" as const },
              { label: "Other", pct: 20, color: "emerald" as const }
            ]
          },
          activeCourses: [
            {
              id: "cx1",
              name: "Foundations & Systems",
              students: Math.round(base.students * 0.28),
              revenue: Math.round(base.revenue * 0.32),
              conversionRatePct: 16.8,
              status: "active" as const
            },
            {
              id: "cx2",
              name: "Advanced Practice Lab",
              students: Math.round(base.students * 0.22),
              revenue: Math.round(base.revenue * 0.26),
              conversionRatePct: 14.9,
              status: "active" as const
            },
            {
              id: "cx3",
              name: "Specialization Deep Dive",
              students: Math.round(base.students * 0.17),
              revenue: Math.round(base.revenue * 0.18),
              conversionRatePct: 12.3,
              status: "draft" as const
            }
          ],
          activity: [
            { id: "ax1", type: "course_updated", title: "Course Updated", subtitle: "Curriculum improvements published", timeAgo: "2 days ago" },
            { id: "ax2", type: "student_enrolled", title: "New Student Enrolled", subtitle: "New enrollment from enterprise cohort", timeAgo: "4 hours ago" },
            { id: "ax3", type: "goal_reached", title: "Goal Reached", subtitle: "Weekly engagement target achieved", timeAgo: "Yesterday" }
          ]
        }
      : null);

  if (!base || !details) {
    return (
      <div className="rounded-lg2 border border-[#ececef] bg-white p-8 text-center dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
        <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Instructor not found</div>
        <div className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">This instructor doesn’t exist in mock data.</div>
        <div className="mt-4">
          <Link
            href="/instructors"
            className="inline-flex items-center justify-center rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-button hover:bg-brand-dark"
          >
            Back to Instructors
          </Link>
        </div>
      </div>
    );
  }

  const breakdown = details.salesPerformance.revenueBreakdown;
  const ring = `conic-gradient(#8b0b45 0 ${breakdown[0].pct}%, #111827 ${breakdown[0].pct}% ${breakdown[0].pct + breakdown[1].pct}%, #22c55e ${breakdown[0].pct + breakdown[1].pct}% 100%)`;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar initials={initials(base.fullName)} tone={base.avatarColor ?? "brand"} className="h-14 w-14 rounded-2xl" />
          <div className="min-w-0">
            <Title>{base.fullName}</Title>
            <div className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">{details.headlineRole}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={base.status === "active" ? "active" : "inactive"}>{base.status}</Badge>
              <Badge tone="brand">{base.specialization}</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/instructors/${base.id}`}>
            <GhostButton className="gap-2">
              <Edit3 size={16} />
              Edit Instructor
            </GhostButton>
          </Link>
          <GhostButton className="text-[#f25572] border-[#f2c7d8] hover:bg-[#fff5f8] dark:border-[#5a1730] dark:hover:bg-[#2a0c1a]">
            Deactivate
          </GhostButton>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Total Revenue</div>
          <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">{formatMoney(details.kpis.totalRevenue)}</div>
          <div className="mt-2">
            <Delta value={details.kpis.totalRevenueDeltaPct} />
          </div>
        </Panel>
        <Panel className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Total Students</div>
          <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">
            {details.kpis.totalStudents.toLocaleString()}
          </div>
          <div className="mt-2">
            <Delta value={details.kpis.totalStudentsDeltaPct} />
          </div>
        </Panel>
        <Panel className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Active Courses</div>
          <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">{details.kpis.activeCourses}</div>
          <div className="mt-2 text-[11px] font-semibold text-[#9aa0ad]">Stable</div>
        </Panel>
        <Panel className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Conversion Rate</div>
          <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">{formatPct(details.kpis.conversionRatePct)}</div>
          <div className="mt-2">
            <Delta value={details.kpis.conversionRateDeltaPct} />
          </div>
        </Panel>
        <Panel className="px-5 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad]">Avg Rev / Course</div>
          <div className="mt-2 text-[22px] font-bold text-[#202530] dark:text-gray-100">
            {formatMoney(details.kpis.avgRevenuePerCourse)}
          </div>
          <div className="mt-2">
            <Delta value={details.kpis.avgRevenuePerCourseDeltaPct} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Revenue Growth</div>
              <div className="text-[12px] text-[#9aa0ad]">Comparative performance over last 12 months</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-soft border border-[#e1e3e9] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#646b7a] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400">
              <Eye size={14} />
              1Y
            </div>
          </div>

          <div className="mt-4 h-[240px] rounded-lg2 border border-[#eef0f4] bg-[#fbfbfd] p-4 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="relative h-full w-full overflow-hidden rounded-lg2">
              <div className="absolute inset-0 bg-gradient-to-t from-brand/10 to-transparent" />
              <svg viewBox="0 0 600 220" className="absolute inset-0 h-full w-full">
                <path
                  d="M10,190 C60,170 80,120 130,130 C170,138 210,110 250,95 C290,80 320,120 360,90 C410,55 450,40 500,55 C540,68 565,40 590,30"
                  fill="none"
                  stroke="#8b0b45"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-semibold text-[#9aa0ad]">
                {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</div>
          <div className="mt-4 rounded-lg2 border border-[#eef0f4] bg-white p-4 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="flex items-center justify-between text-[12px] text-[#9aa0ad]">
              <span>Total Leads</span>
              <span className="font-semibold text-[#2f3440] dark:text-gray-100">{details.salesPerformance.totalLeads}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-[#9aa0ad]">
              <span>Total Sales</span>
              <span className="font-semibold text-[#2f3440] dark:text-gray-100">{details.salesPerformance.totalSales}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px] text-[#9aa0ad]">
              <span>Conv. Rate</span>
              <span className="font-semibold text-[#2f3440] dark:text-gray-100">
                {details.salesPerformance.conversionRatePct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">Revenue Breakdown</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative grid h-28 w-28 place-items-center rounded-full border border-[#eef0f4] bg-white dark:border-[#2a2f3a] dark:bg-[#0f0820]">
                <div className="absolute inset-3 rounded-full" style={{ background: ring }} />
                <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-[11px] font-bold text-[#2f3440] shadow-sm dark:bg-[#0b0614] dark:text-gray-100">
                  100%
                </div>
              </div>
              <div className="space-y-2 text-[12px]">
                {breakdown.map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span
                      className={clsx(
                        "h-2.5 w-2.5 rounded-full",
                        b.color === "brand" && "bg-brand",
                        b.color === "slate" && "bg-[#111827]",
                        b.color === "emerald" && "bg-emerald-500"
                      )}
                    />
                    <span className="text-[#8b8f9b] dark:text-gray-400">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1.15fr]">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Active Courses</div>
              <div className="text-[12px] text-[#9aa0ad]">Detailed performance per curriculum module</div>
            </div>
            <Link href="/courses" className="text-[12px] font-semibold text-brand hover:underline">
              View All →
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg2 border border-[#eef0f4] dark:border-[#2a2f3a]">
            <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] bg-[#fafafd] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:bg-[#0f0820]">
              <div>Course Name</div>
              <div>Students</div>
              <div>Revenue</div>
              <div>Conv. Rate</div>
              <div>Status</div>
            </div>
            <div className="divide-y divide-[#eef0f4] dark:divide-[#2a2f3a]">
              {details.activeCourses.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_0.8fr] items-center px-5 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#fbfbfd] dark:bg-white/5">
                      <div className="h-5 w-5 rounded bg-brand/15" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">{c.name}</div>
                    </div>
                  </div>
                  <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{c.students.toLocaleString()}</div>
                  <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">{formatMoney(c.revenue)}</div>
                  <div className="space-y-2">
                    <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">
                      {c.conversionRatePct.toFixed(1)}%
                    </div>
                    <MiniBar valuePct={Math.max(8, Math.min(100, c.conversionRatePct * 4))} />
                  </div>
                  <div>
                    <CourseStatus status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Activity Timeline</div>
          <div className="mt-4 space-y-3">
            {details.activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg2 border border-[#eef0f4] bg-white p-3 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
                <ActivityIcon type={a.type} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">{a.title}</div>
                  <div className="mt-0.5 text-[12px] text-[#9aa0ad]">{a.subtitle}</div>
                </div>
                <div className="text-[11px] font-semibold text-[#9aa0ad]">{a.timeAgo}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
