"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext-production";
import Link from "next/link";
import { 
  TrendingUp, Users, Target, Zap, Clock, Brain, RefreshCw, 
  Calendar, Download, Activity, DollarSign, Megaphone,
  Briefcase, BookOpen, UserCheck, ArrowRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { motion } from "framer-motion";
import { TimeTrackingDashboard } from "@/components/dashboard/time-tracking-dashboard";
import { apiFetch } from "@/lib/api-client";

function formatCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

function StatCard({ title, value, delta, icon, colorClass, gradient, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5 hover:shadow-lg transition-all min-w-0`}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 bg-gradient-to-br ${gradient}`} />
      
      <div className="mb-4 flex items-center justify-between relative z-10">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass} bg-opacity-10 dark:bg-opacity-20 shrink-0`}>
          {icon}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold truncate max-w-[120px] ${
          delta?.startsWith('+') || delta?.includes('Active') || delta?.includes('Won') 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
            : delta?.startsWith('-')
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-brand/10 text-brand'
        }`}>
          {delta}
        </span>
      </div>
      <p className="text-[13px] font-medium text-[#8b8f9b] dark:text-gray-400 relative z-10 truncate">{title}</p>
      <p className="mt-1 text-[24px] sm:text-[28px] font-bold tracking-tight text-[#202530] dark:text-gray-100 relative z-10 truncate">{value}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { state } = useAuth();
  const [dateRange, setDateRange] = useState("30d");

  // Fetch centralized enterprise analytics
  const { data: analyticsResponse, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-analytics'], // Stable query key
    queryFn: async () => {
      try {
        return await apiFetch('/api/dashboard/analytics');
      } catch (e: any) {
        if (e?.status === 401) return null;
        throw e;
      }
    },
    enabled: state.status === 'authenticated', // Only fetch when authenticated
    refetchInterval: 60000,
  });

  const dashboardData = analyticsResponse?.data || {
    crm: { totalLeads: 0, leadBreakdown: [], pipelineValue: 0, activeDeals: 0 },
    finance: { revenueChart: [], totalRevenue: 0 },
    hr: { headcount: 0, hiringPipe: 0 },
    marketing: { totalSpent: 0, leadsGenerated: 0, cac: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f6fb] dark:bg-[#0b0614]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="text-sm font-bold text-gray-500 animate-pulse">Aggregating Enterprise Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 pb-8 bg-[#f5f6fb] dark:bg-[#0b0614] min-h-full">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 pt-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-[#2a2f39] dark:text-white flex items-center gap-3"
            >
              Executive Command Center <Brain className="text-brand" size={28} />
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-1 text-[15px] text-[#8b8f9b] dark:text-gray-400"
            >
              Interconnected Business Intelligence & Enterprise Workflows.
            </motion.p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] px-4 py-2 text-[13px] font-bold text-gray-700 dark:text-gray-300 shadow-sm"
            >
              <RefreshCw size={16} /> Sync
            </button>
            <Link
              href="/ai"
              className="flex items-center gap-2 rounded-soft bg-gradient-to-r from-brand to-purple-600 px-5 py-2 text-[13px] font-bold text-white shadow-lg hover:shadow-brand/25 transition-all hover:scale-[1.02]"
            >
              <Brain size={16} />
              AI Insights
            </Link>
          </div>
        </div>

        {/* Executive Overview KPIs */}
        <div className="grid gap-4 px-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <StatCard 
            title="ARR (Annual)" 
            value={formatCurrency(dashboardData.finance.totalRevenue * 12)} 
            delta={`+12% MoM`} 
            icon={<DollarSign size={20} className="text-emerald-500" />} 
            colorClass="text-emerald-500 bg-emerald-500"
            gradient="from-emerald-400 to-teal-600"
            delay={0.05}
          />
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(dashboardData.finance.totalRevenue)} 
            delta="Finance" 
            icon={<Activity size={20} className="text-teal-500" />} 
            colorClass="text-teal-500 bg-teal-500"
            gradient="from-teal-400 to-emerald-600"
            delay={0.1}
          />
          <StatCard 
            title="Pipeline Value" 
            value={formatCurrency(dashboardData.crm.pipelineValue)} 
            delta="Sales" 
            icon={<Target size={20} className="text-indigo-500" />} 
            colorClass="text-indigo-500 bg-indigo-500"
            gradient="from-indigo-400 to-blue-600"
            delay={0.15}
          />
          <StatCard 
            title="Active Deals" 
            value={dashboardData.crm.activeDeals} 
            delta="CRM" 
            icon={<Zap size={20} className="text-brand" />} 
            colorClass="text-brand bg-brand"
            gradient="from-brand to-pink-600"
            delay={0.2}
          />
          <StatCard 
            title="Total Leads" 
            value={dashboardData.crm.totalLeads} 
            delta="Marketing" 
            icon={<Users size={20} className="text-blue-500" />} 
            colorClass="text-blue-500 bg-blue-500"
            gradient="from-blue-400 to-cyan-600"
            delay={0.25}
          />
          <StatCard 
            title="CAC" 
            value={formatCurrency(dashboardData.marketing.cac)} 
            delta="Marketing" 
            icon={<Megaphone size={20} className="text-amber-500" />} 
            colorClass="text-amber-500 bg-amber-500"
            gradient="from-amber-400 to-orange-600"
            delay={0.3}
          />
          <StatCard 
            title="Workforce" 
            value={dashboardData.hr.headcount} 
            delta={`Active`} 
            icon={<UserCheck size={20} className="text-purple-500" />} 
            colorClass="text-purple-500 bg-purple-500"
            gradient="from-purple-400 to-indigo-600"
            delay={0.35}
          />
          <StatCard 
            title="Hiring Funnel" 
            value={dashboardData.hr.hiringPipe} 
            delta="ATS" 
            icon={<Briefcase size={20} className="text-sky-500" />} 
            colorClass="text-sky-500 bg-sky-500"
            gradient="from-sky-400 to-blue-600"
            delay={0.4}
          />
        </div>

        {/* Time Tracking & Command Pulse */}
        <div className="px-4">
          <TimeTrackingDashboard />
        </div>

        <div className="grid gap-6 px-4 lg:grid-cols-[2fr_1fr]">
          {/* Main Financial Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2f3440] dark:text-white">Revenue Analysis</h2>
                <p className="text-[13px] text-[#9498a5] dark:text-gray-400">Live transaction aggregation</p>
              </div>
            </div>
            <div className="h-[300px] w-full min-h-[300px] min-w-[200px]">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.finance.revenueChart.length > 0 ? dashboardData.finance.revenueChart : [
                  { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 }
                ]}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val: any) => `$${val/1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Business Velocity Funnel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
            className="rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 shadow-sm flex flex-col"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2f3440] dark:text-white flex items-center gap-2">
                Conversion Funnel <Activity size={18} className="text-brand" />
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0b0614]/50 border border-[#ececef] dark:border-[#2a2f3a]">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider mb-2">Sales Velocity</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-600 dark:text-gray-400">Leads</span>
                    <span className="font-bold text-gray-900 dark:text-white">{dashboardData.crm.totalLeads}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-gray-600 dark:text-gray-400">Deals</span>
                    <span className="font-bold text-gray-900 dark:text-white">{dashboardData.crm.activeDeals}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5">
                    <div className="bg-brand h-1.5 rounded-full" style={{ width: `${(dashboardData.crm.activeDeals / (dashboardData.crm.totalLeads || 1)) * 100}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0b0614]/50 border border-[#ececef] dark:border-[#2a2f3a]">
                <p className="text-[12px] text-gray-500 font-bold uppercase tracking-wider mb-2">Efficiency Index</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase">Avg CAC</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(dashboardData.marketing.cac)}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-[10px]">
                    LIVE
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* Bottom Row Modules Link */}
        <div className="grid gap-4 px-4 grid-cols-1 md:grid-cols-3">
          <Link href="/marketing">
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-5 cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Megaphone size={20} />
                </div>
                <ArrowRight size={16} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Marketing Analytics</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Manage campaigns, track ROI, and analyze sources.</p>
            </motion.div>
          </Link>
          
          <Link href="/hr">
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/50 dark:bg-purple-900/10 p-5 cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Users size={20} />
                </div>
                <ArrowRight size={16} className="text-purple-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">HR & Workforce</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Monitor attendance, payroll, and employee growth.</p>
            </motion.div>
          </Link>

          <Link href="/courses">
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border border-pink-100 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-900/10 p-5 cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <div className="h-10 w-10 bg-pink-100 dark:bg-pink-900/40 rounded-lg flex items-center justify-center text-pink-600 dark:text-pink-400">
                  <BookOpen size={20} />
                </div>
                <ArrowRight size={16} className="text-pink-500" />
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Internal LMS</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Onboarding courses and team training modules.</p>
            </motion.div>
          </Link>
        </div>

      </div>
    </ProtectedRoute>
  );
}

// Ensure Trophy is imported
import { Trophy } from "lucide-react";

