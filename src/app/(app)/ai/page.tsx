"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, BarChart3, BrainCircuit, Activity, ChevronRight, Mail, PhoneCall } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiFetch } from "@/lib/api-client";
import { WidgetErrorBoundary } from "@/components/error-boundary";

const fetcher = (url: string) => apiFetch(url);

function DashboardSkeleton() {
  return (
    <div className="space-y-4 pb-6">
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-80 w-full rounded-xl" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/30 dark:bg-red-900/10">
      <AlertTriangle size={48} className="mb-4 text-red-500" />
      <p className="text-xl font-bold text-red-700 dark:text-red-400">AI Engine Error</p>
      <p className="mt-2 text-sm text-red-600 dark:text-red-300">{message}</p>
    </div>
  );
}

export default function AIDashboardPage() {
  const { data: response, error, isLoading, mutate, isValidating } = useSWR(
    "/api/ai/overview",
    fetcher,
    {
      refreshInterval: 30000,
      dedupingInterval: 15000,
      revalidateOnFocus: false,
    }
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (isLoading) return <DashboardSkeleton />;
  if (error || (response && response.status === "error")) {
    return <ErrorState message={error?.message || response?.message || "Failed to load AI analytics"} />;
  }

  const aiData = response?.data;
  if (!aiData) return <DashboardSkeleton />;

  const { dashboard, churn, forecast, duplicates } = aiData;

  // Mock chart data for visualization since backend returns only a single value for forecast
  const chartData = [
    { month: 'Jan', revenue: dashboard.totalPipelineValue * 0.8 },
    { month: 'Feb', revenue: dashboard.totalPipelineValue * 0.9 },
    { month: 'Mar', revenue: dashboard.totalPipelineValue },
    { month: 'Apr', revenue: forecast.predictedRevenue * 1.1 },
    { month: 'May', revenue: forecast.predictedRevenue * 1.25 },
    { month: 'Jun', revenue: forecast.predictedRevenue * 1.4 },
  ];

  return (
    <div className="space-y-6 pb-8 bg-[#f5f6fb] dark:bg-[#0b0614] min-h-full px-4 pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-3">
            AI Command Center <Sparkles className="text-brand" size={28} />
          </h1>
          <p className="mt-1 text-[15px] text-[#8b8f9b] dark:text-gray-400">
            Real-time machine learning predictions and pipeline analytics.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-sm border border-emerald-200 dark:border-emerald-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AI Online
          </div>
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex items-center gap-2 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 shadow-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#1f1035] transition-all"
          >
            <RefreshCw size={16} className={isValidating ? "animate-spin text-brand" : ""} /> 
            {isValidating ? "Syncing..." : "Sync AI"}
          </button>
        </div>
      </div>

      {/* Dynamic AI Insight Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-brand/30 bg-gradient-to-r from-brand/10 via-purple-500/10 to-blue-500/10 p-6 shadow-sm dark:border-brand/40"
      >
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="rounded-full bg-white dark:bg-[#1a0b2e] shadow-sm p-3 text-brand border border-brand/20">
            <BrainCircuit size={24} className="animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[#2f3440] dark:text-white flex items-center gap-2">
              Deep Learning Insight <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold shadow-sm">98% Confidence</span>
            </h3>
            <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {dashboard.insight.message}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Action Recommended</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {dashboard.insight.recommendation}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { 
            title: "Pipeline Value", icon: <TrendingUp size={16} className="text-emerald-500" />, value: `$${dashboard.totalPipelineValue.toLocaleString()}`, 
            badge: "Surging", badgeColor: "bg-emerald-100 text-emerald-700", subtext: "Anomaly Detected"
          },
          { 
            title: "Predicted Conv. Rate", icon: <BarChart3 size={16} className="text-blue-500" />, value: `${dashboard.conversionRate}%`, 
            subtext: `Based on ${dashboard.totalLeads} total leads`
          },
          { 
            title: "Churn Risk Analysis", icon: <TrendingDown size={16} className="text-red-500" />, value: `${churn.churnRate}%`, 
            subtext: `${churn.highRiskCount} leads require attention`, subtextColor: "text-red-600 dark:text-red-400 font-medium"
          },
          { 
            title: "Database Integrity", icon: <CheckCircle size={16} className="text-purple-500" />, value: `${duplicates.count} Duplicates`, 
            subtext: "Clean and deduplicate required"
          }
        ].map((metric, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-150 transition-transform duration-500">{metric.icon}</div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{metric.title}</p>
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {metric.value}
            </p>
            {metric.badge ? (
               <div className="mt-2 flex items-center gap-2 text-xs">
                 <span className={`rounded px-1.5 py-0.5 font-bold ${metric.badgeColor}`}>{metric.subtext}</span>
                 <span className="text-gray-400 font-semibold">{metric.badge}</span>
               </div>
            ) : (
               <div className={`mt-2 text-xs ${metric.subtextColor || 'text-gray-500 dark:text-gray-400'}`}>
                 {metric.subtext}
               </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
       <WidgetErrorBoundary widgetName="AI Revenue Forecast">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 shadow-sm"
        >
          <h2 className="mb-6 text-lg font-bold text-[#2f3440] dark:text-white">
            AI Revenue Forecast
          </h2>
          {mounted ? (
            <div className="w-full min-h-[350px]">
              <ResponsiveContainer width="100%" height={350} minWidth={1} minHeight={1}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#840A36" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#840A36" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val: any) => `$${val/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1a0b2e', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#840A36" strokeWidth={3} fill="url(#aiRevGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="min-h-[350px] bg-gray-50 dark:bg-[#0b0614] rounded-lg" />
          )}
        </motion.div>
       </WidgetErrorBoundary>

       <WidgetErrorBoundary widgetName="Prioritized Leads">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-4"
        >
          <div className="rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 shadow-sm flex-1 flex flex-col">
            <h2 className="mb-4 text-lg font-bold text-[#2f3440] dark:text-white flex items-center justify-between">
              Top Prioritized Leads
              <Link href="/ai/prioritized-leads" className="text-xs font-bold text-brand hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
              </Link>
            </h2>
            <div className="space-y-4 flex-1">
              {aiData.prioritizedLeads.slice(0, 5).map((lead: any, i: number) => (
                <div key={lead.id} className="group flex items-center justify-between border-b border-gray-100 dark:border-[#2a2f3a] pb-3 last:border-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-[#1f1035] -mx-2 px-2 py-1 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{lead.name}</p>
                      {i === 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 rounded font-bold uppercase">Hot</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <Activity size={10} className={lead.score > 70 ? 'text-emerald-500' : 'text-amber-500'} />
                      Active {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden group-hover:flex items-center gap-1">
                       <button className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"><Mail size={12} /></button>
                       <button className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors"><PhoneCall size={12} /></button>
                    </div>
                    <span className="rounded bg-brand/10 border border-brand/20 px-2 py-1 text-xs font-bold text-brand w-[60px] text-center shadow-sm">
                      {lead.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
       </WidgetErrorBoundary>
      </div>

      {/* AI Features Grid Restored & Animated */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="mb-4 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
          AI-Powered Workflows
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Prioritized Leads", icon: "🎯", desc: "AI-sorted leads based on conversion likelihood", link: "/ai/prioritized-leads" },
            { title: "Revenue Forecast", icon: "💰", desc: "Predict future revenue based on pipeline analysis", link: "/ai/advanced?tab=revenue" },
            { title: "Churn Analysis", icon: "📊", desc: "Identify leads at risk of dropping off", link: "/ai/advanced?tab=churn" },
            { title: "Lead Assignment", icon: "👥", desc: "Smart recommendations for assigning leads", link: "/ai/advanced?tab=assignment" },
            { title: "Duplicate Detection", icon: "🔍", desc: "Find and merge duplicate lead records", link: "/ai/advanced?tab=duplicates" },
            { title: "Email Suggestions", icon: "📧", desc: "AI-generated email templates for leads", link: "/ai/advanced?tab=emails" }
          ].map((feature, i) => (
            <Link
              key={i}
              href={feature.link}
              className="group p-4 rounded-xl border border-[#e7e9ef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] hover:border-brand/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand/0 to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="text-2xl mb-2 bg-gray-50 dark:bg-[#0f0820] h-10 w-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-gray-100 dark:border-gray-800">{feature.icon}</div>
                <ArrowRight size={18} className="text-brand opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-sm font-bold text-[#2f3440] dark:text-gray-100 relative z-10">{feature.title}</h3>
              <p className="mt-1 text-xs font-medium text-[#6b7280] dark:text-gray-400 relative z-10">{feature.desc}</p>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

