"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Megaphone, TrendingUp, DollarSign, MousePointerClick, Users, Eye } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";
import { apiFetch } from "@/lib/api-client";

export default function MarketingPage() {
  const [search, setSearch] = useState("");

  // Fetch campaigns
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['campaigns', { search }],
    queryFn: async () => {
      return await apiFetch(`/api/marketing/campaigns?search=${search}&limit=50`);
    },
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['marketing-analytics'],
    queryFn: async () => {
      return await apiFetch(`/api/marketing/analytics`);
    },
  });

  const campaigns = campaignsData?.data?.campaigns || [];
  const overview = analyticsData?.data?.overview || {
    totalSpent: 0, totalRevenue: 0, returnOnAdSpend: 0, totalLeads: 0
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">
              Marketing 📢
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Track campaigns, monitor ROI, and analyze marketing performance.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/marketing/new">
              <ActionButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Create Campaign
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <SalesStatsCard 
            title="Total Ad Spend" 
            value={formatCurrency(overview.totalSpent)} 
            delta="30d" 
            deltaPositive={false} 
          />
          <SalesStatsCard 
            title="Revenue Generated" 
            value={formatCurrency(overview.totalRevenue)} 
            delta="30d" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="ROAS" 
            value={`${(overview.returnOnAdSpend * 100).toFixed(1)}%`} 
            delta="Target 300%" 
            deltaPositive={overview.returnOnAdSpend >= 3} 
          />
          <SalesStatsCard 
            title="New Leads" 
            value={overview.totalLeads} 
            delta="30d" 
            deltaPositive={true} 
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between shrink-0 mt-2">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </div>
          
          <div className="text-[13px] text-gray-500 font-medium">
            {campaigns.length} active campaign{campaigns.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {isLoadingCampaigns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#150a24] p-5 h-[220px]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-6"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-[#150a24] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 text-3xl">
                📢
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No campaigns found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                {search ? "We couldn't find any campaigns matching your search criteria." : "You haven't launched any marketing campaigns yet. Start running ads to generate leads."}
              </p>
              {!search && (
                <Link href="/marketing/new">
                  <ActionButton className="bg-brand text-white px-6 py-2 rounded-soft font-semibold text-[13px]">
                    Create Your First Campaign
                  </ActionButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign: any) => (
                <div key={campaign.id} className="group flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-5 hover:shadow-lg hover:border-brand/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                        <Megaphone size={16} />
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] truncate max-w-[150px] sm:max-w-[200px]">
                        {campaign.name}
                      </h3>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      campaign.status === 'PAUSED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {campaign.status}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">
                    {campaign.description || `Campaign running on ${campaign.source || 'multiple channels'}`}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-[#f5f6fb] dark:bg-[#0b0614]/50 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-800 transition-colors">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <DollarSign size={12} className="text-brand" /> Spend
                      </div>
                      <div className="text-[16px] font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(campaign.spent)}
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-[#f5f6fb] dark:bg-[#0b0614]/50 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-800 transition-colors">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        <TrendingUp size={12} className="text-green-500" /> ROI
                      </div>
                      <div className={`text-[16px] font-bold ${campaign.roi > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {campaign.roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 text-[12px] text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1" title="Impressions">
                        <Eye size={14} /> {Intl.NumberFormat('en-US', { notation: "compact" }).format(campaign.impressions)}
                      </div>
                      <div className="flex items-center gap-1" title="Clicks">
                        <MousePointerClick size={14} /> {Intl.NumberFormat('en-US', { notation: "compact" }).format(campaign.clicks)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-brand bg-brand/5 dark:bg-brand/10 px-2 py-1 rounded">
                      <Users size={14} /> {campaign.conversions} leads
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
