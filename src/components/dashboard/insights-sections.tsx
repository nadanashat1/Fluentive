import { ActionButton } from "@/components/ui/action-button";
import { useAPI } from "@/hooks/use-api";
import { useLiveStatus } from "@/hooks/use-live-state";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { OfflineState } from "@/components/states/OfflineState";
import { isLoading, isSuccess, isEmpty, isError } from "@/types/api-state";

// @AI-Hint: When adding new pages or features (e.g. Sales, Courses, Agents), make sure to update the backend endpoints (like /api/leads/stats or /api/ai/advanced/bulk-analysis) to aggregate the new data and feed it to this dashboard. The dashboard relies on real DB data.

type Dealer = {
  name: string;
  value: string;
  widthClass: string;
};

type Course = {
  title: string;
  sales: string;
  revenue: string;
};

type Agent = {
  name: string;
  deals: string;
  revenue: string;
};

type DashboardStats = {
  topAgents: Agent[];
  topCourses: Course[];
};

export function SalesPerformance() {
  const statsState = useAPI<DashboardStats>('/api/leads/stats');
  const dbStatus = useLiveStatus("unknown", "db:status");

  if (dbStatus === "disconnected" || dbStatus === "error") {
    return (
      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</h2>
        <p className="text-[13px] text-[#9498a5] dark:text-gray-500">Leading Regional Dealers</p>
        <div className="mt-5">
          <OfflineState message="System Offline" description="Backend is disconnected. Sales data unavailable." />
        </div>
      </section>
    );
  }

  if (isLoading(statsState)) {
    return (
      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</h2>
        <p className="text-[13px] text-[#9498a5] dark:text-gray-500">Leading Regional Dealers</p>
        <div className="mt-5">
          <LoadingState message="Loading sales data..." size="sm" />
        </div>
      </section>
    );
  }

  if (isError(statsState)) {
    return (
      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</h2>
        <p className="text-[13px] text-[#9498a5] dark:text-gray-500">Leading Regional Dealers</p>
        <div className="mt-5">
          <ErrorState message={statsState.error} />
        </div>
      </section>
    );
  }

  if (!isSuccess(statsState) || !statsState.data?.topAgents || statsState.data.topAgents.length === 0) {
    return (
      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</h2>
        <p className="text-[13px] text-[#9498a5] dark:text-gray-500">Leading Regional Dealers</p>
        <div className="mt-5">
          <EmptyState 
            message="No sales data yet" 
            description="Start closing deals to see performance metrics here!"
            icon="users"
          />
        </div>
      </section>
    );
  }

  const { topAgents } = statsState.data;
  const displayDealers = topAgents.map((agent: Agent, i: number) => {
    const widths = ["w-full", "w-[85%]", "w-[65%]", "w-[45%]", "w-[30%]"];
    return {
      name: agent.name,
      value: agent.revenue,
      widthClass: widths[i] || "w-[20%]"
    };
  });

  return (
    <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
      <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Sales Performance</h2>
      <p className="text-[13px] text-[#9498a5] dark:text-gray-500">Leading Regional Dealers</p>
      <div className="mt-5 space-y-4">
        {displayDealers.map((dealer: Dealer) => (
          <div key={dealer.name}>
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <p className="font-semibold text-[#2f3440] dark:text-gray-200">{dealer.name}</p>
              <p className="font-semibold text-[#7d223f] dark:text-brand">{dealer.value}</p>
            </div>
            <div className="h-2.5 rounded-full bg-[#f1f1f4] dark:bg-[#1f1035]">
              <div className={`h-2.5 rounded-full bg-brand transition-all duration-700 ${dealer.widthClass}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TopLists() {
  const statsState = useAPI<DashboardStats>('/api/leads/stats');
  const dbStatus = useLiveStatus("unknown", "db:status");

  if (dbStatus === "disconnected" || dbStatus === "error") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Selling Courses</h3>
          <div className="mt-4">
            <OfflineState message="System Offline" description="Backend is disconnected." />
          </div>
        </section>
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Sales Agents</h3>
          <div className="mt-4">
            <OfflineState message="System Offline" description="Backend is disconnected." />
          </div>
        </section>
      </div>
    );
  }

  if (isLoading(statsState)) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Selling Courses</h3>
          <div className="mt-4">
            <LoadingState message="Loading course data..." size="sm" />
          </div>
        </section>
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Sales Agents</h3>
          <div className="mt-4">
            <LoadingState message="Loading agent data..." size="sm" />
          </div>
        </section>
      </div>
    );
  }

  if (isError(statsState)) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Selling Courses</h3>
          <div className="mt-4">
            <ErrorState message={statsState.error} />
          </div>
        </section>
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Sales Agents</h3>
          <div className="mt-4">
            <ErrorState message={statsState.error} />
          </div>
        </section>
      </div>
    );
  }

  if (!isSuccess(statsState)) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Selling Courses</h3>
          <div className="mt-4">
            <LoadingState message="Loading course data..." size="sm" />
          </div>
        </section>
        <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Sales Agents</h3>
          <div className="mt-4">
            <LoadingState message="Loading agent data..." size="sm" />
          </div>
        </section>
      </div>
    );
  }

  const { topAgents: agents, topCourses: courses } = statsState.data || { topAgents: [], topCourses: [] };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Selling Courses</h3>
          <ActionButton className="text-[12px] font-semibold text-brand" message="Course list page coming soon!">
            View All
          </ActionButton>
        </div>
        {!courses || courses.length === 0 ? (
          <EmptyState 
            message="No course data yet" 
            description="We'll show top courses once you have sales!"
            icon="file"
          />
        ) : (
          <div className="space-y-3">
            {courses.map((course, i) => (
              <div key={course.title} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand dark:bg-brand/20">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-200">{course.title}</p>
                    <p className="text-[12px] text-[#9498a5] dark:text-gray-500">{course.sales}</p>
                  </div>
                </div>
                <p className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-200">{course.revenue}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Top Sales Agents</h3>
          <ActionButton className="text-[12px] font-semibold text-brand" message="Agent details page coming soon!">
            View All
          </ActionButton>
        </div>
        {!agents || agents.length === 0 ? (
          <EmptyState 
            message="No agent data yet" 
            description="We'll show top agents once you have team performance data!"
            icon="users"
          />
        ) : (
          <div className="space-y-3">
            {agents.map((agent, i) => (
              <div key={agent.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand dark:bg-brand/20">
                    {i + 1}
                  </span>
                  <p className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-200">{agent.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[13px] text-[#808593] dark:text-gray-500">{agent.deals}</p>
                  <p className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-200">{agent.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
