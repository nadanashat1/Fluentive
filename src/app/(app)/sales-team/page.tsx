"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Trophy, Target, Phone, Mail, Award, TrendingUp } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";

import { apiFetch } from "@/lib/api-client";

export default function SalesTeamPage() {
  const [search, setSearch] = useState("");

  // Fetch leaderboard
  const { data: leaderboardData, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ['sales-leaderboard'],
    queryFn: async () => {
      return await apiFetch(`/api/sales-team/leaderboard`);
    },
  });

  const leaderboard = leaderboardData?.data || [];
  
  // Calculate team totals
  const teamTotalRevenue = leaderboard.reduce((sum: number, rep: any) => sum + (rep.revenue || 0), 0);
  const teamTotalDeals = leaderboard.reduce((sum: number, rep: any) => sum + (rep.dealsClosed || 0), 0);
  const teamTotalLeads = leaderboard.reduce((sum: number, rep: any) => sum + (rep.leadsGenerated || 0), 0);
  const topPerformer = leaderboard.length > 0 ? leaderboard[0] : null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              Sales Team <Trophy className="text-amber-500" />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Monitor team performance, track quotas, and view the sales leaderboard.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/settings/team/new">
              <ActionButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Invite Rep
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <SalesStatsCard 
            title="Team Revenue" 
            value={formatCurrency(teamTotalRevenue)} 
            delta="30d" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Deals Won" 
            value={teamTotalDeals} 
            delta="30d" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Leads Generated" 
            value={teamTotalLeads} 
            delta="30d" 
            deltaPositive={true} 
          />
          <div className="rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4 flex flex-col justify-center">
            <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Top Performer</div>
            <div className="text-[18px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              {topPerformer ? (
                <>
                  <Award className="text-brand" size={20} />
                  <span className="truncate">{topPerformer.name}</span>
                </>
              ) : (
                'No data yet'
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between shrink-0 mt-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Team Leaderboard</h2>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search reps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24]">
          {isLoadingLeaderboard ? (
            <div className="p-6 flex flex-col gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-800/50 rounded-lg w-full"></div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 text-3xl">
                🎯
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No team members found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                You haven't added any sales representatives to your team yet.
              </p>
              <Link href="/settings/team/new">
                <ActionButton className="bg-brand text-white px-6 py-2 rounded-soft font-semibold text-[13px]">
                  Invite Your First Rep
                </ActionButton>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0b0614]/50">
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Representative</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue Won</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Deals</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">Leads</th>
                  <th className="py-4 px-6 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard
                  .filter((rep: any) => rep.name.toLowerCase().includes(search.toLowerCase()))
                  .map((rep: any, index: number) => (
                  <tr key={rep.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[13px] ${
                        index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-2 ring-amber-400/50' :
                        index === 1 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold">
                          {rep.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-gray-100 text-[14px]">{rep.name}</div>
                          <div className="text-[12px] text-gray-500">{rep.role.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-bold text-gray-900 dark:text-gray-100 text-[15px]">
                        {formatCurrency(rep.revenue)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-[13px]">
                        {rep.dealsClosed}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold text-[13px]">
                        {rep.leadsGenerated}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-bold text-brand text-[15px] flex items-center justify-end gap-1">
                        {rep.score} <TrendingUp size={14} className="opacity-50" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
