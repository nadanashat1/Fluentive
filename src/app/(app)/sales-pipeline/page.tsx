"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Filter, Search } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { typedApi } from "@/services/typed-api.service";
import { KanbanBoard } from "@/components/sales-pipeline/KanbanBoard";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";
import { DealStage } from "@prisma/client";
import { DEAL_STAGES } from "@/lib/constants/deal-stages";
import { toast } from "react-hot-toast";

export default function SalesPipelinePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['deals', { search, stage: stageFilter }],
    queryFn: () => typedApi.deals.list({ 
      page: 1, 
      limit: 100, 
      search: search || undefined, 
      stage: stageFilter || undefined 
    }),
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string, stage: DealStage }) => 
      typedApi.deals.update(id, { stage: stage as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success("Deal updated");
    },
    onError: () => {
      toast.error("Failed to update deal");
    }
  });

  const deals = data?.data?.deals || [];
  const stats = data?.data?.stats || { totalValue: 0, count: 0 };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id;
    const newStage = over.id as DealStage;
    
    const deal = deals.find(d => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      updateDealMutation.mutate({ id: dealId, stage: newStage });
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">
              Sales Pipeline 📈
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage and track your active sales cycles in real-time.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] px-4 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 hover:bg-[#f7f8fb] transition-colors"
            >
              <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link href="/sales-pipeline/new">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Add New Deal
              </button>
            </Link>
          </div>
        </div>

        {/* Filters & Stats */}
        <div className="flex flex-col gap-4 xl:flex-row shrink-0">
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SalesStatsCard 
              title="Pipeline Value" 
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalValue)} 
              delta="Live" 
              deltaPositive={true} 
            />
            <SalesStatsCard 
              title="Active Deals" 
              value={deals.length.toString()} 
              delta="Total" 
              deltaPositive={true} 
            />
            <SalesStatsCard 
              title="Avg. Size" 
              value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stats.totalValue / (stats.count || 1))} 
              delta="Target" 
              deltaPositive={true} 
            />
            <SalesStatsCard 
              title="Win Rate" 
              value={`${Math.round((deals.filter(d => d.stage === 'WON').length / (deals.length || 1)) * 100)}%`} 
              delta="Overall" 
              deltaPositive={true} 
            />
          </div>
          
          <div className="xl:w-72 flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="flex-1 h-10 px-3 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] outline-none"
              >
                <option value="">All Stages</option>
                {DEAL_STAGES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button className="h-10 w-10 flex items-center justify-center rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-gray-500">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-brand" size={32} />
                <p className="text-sm text-gray-500 font-medium">Loading your pipeline...</p>
              </div>
            </div>
          ) : (
            <KanbanBoard deals={deals} onDragEnd={handleDragEnd} />
          )}
        </div>
      </div>
    </div>
  );
}
