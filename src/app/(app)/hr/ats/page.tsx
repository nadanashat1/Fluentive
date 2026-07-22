"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Briefcase, Users, UserPlus, Filter, ArrowRight, BrainCircuit, Activity, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";

export default function ATSDashboardPage() {
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['ats-analytics'],
    queryFn: async () => {
      return await apiFetch(`/api/hr/ats/analytics`);
    },
  });

  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['ats-jobs'],
    queryFn: async () => {
      return await apiFetch(`/api/hr/ats/jobs`);
    },
  });

  const analytics = analyticsData?.data || {
    openJobs: 0, totalCandidates: 0, activeApplications: 0, hiredThisMonth: 0, funnel: {}
  };
  const jobs = jobsData?.data || [];

  const funnelData = [
    { name: 'Applied', value: analytics.funnel?.applied || 0 },
    { name: 'Screening', value: analytics.funnel?.screening || 0 },
    { name: 'Interviewing', value: analytics.funnel?.interviewing || 0 },
    { name: 'Offered', value: analytics.funnel?.offered || 0 },
    { name: 'Hired', value: analytics.funnel?.hired || 0 },
  ];

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              AI Recruitment System (ATS) <BrainCircuit className="text-brand" />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage job postings, screen candidates with AI, and track hiring pipelines.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/hr/ats/pipeline">
              <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-white dark:bg-[#1a0b2e] px-5 text-[13px] font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 shadow-sm transition hover:bg-gray-50">
                <Activity size={18} />
                View Kanban Pipeline
              </ActionButton>
            </Link>
            <Link href="/hr/ats/jobs/new">
              <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95">
                <Briefcase size={18} />
                Post New Job
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <SalesStatsCard 
            title="Open Positions" 
            value={analytics.openJobs} 
            delta="Actively hiring" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Active Applications" 
            value={analytics.activeApplications} 
            delta="In pipeline" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Hired This Month" 
            value={analytics.hiredThisMonth} 
            delta="Successfully onboarded" 
            deltaPositive={analytics.hiredThisMonth > 0} 
          />
          <SalesStatsCard 
            title="Time-to-Hire" 
            value={`${analytics.timeToHire || 0}d`} 
            delta="Avg. Speed" 
            deltaPositive={true} 
          />
        </div>

        <div className="grid gap-6 px-0 lg:grid-cols-[1fr_2fr] min-h-0 shrink-0">
            {/* Funnel Chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5 h-[350px]">
                <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 mb-4">Hiring Funnel</h3>
                <ResponsiveContainer width="100%" height={270}>
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>

            {/* Active Jobs List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] h-[350px]">
                <div className="p-5 border-b border-[#ececef] dark:border-[#2a2f3a] flex items-center justify-between">
                    <h3 className="text-md font-bold text-gray-900 dark:text-gray-100">Active Job Postings</h3>
                    <div className="flex gap-2">
                        <span className="text-xs bg-brand/10 text-brand px-2 py-1 rounded font-bold">{jobs.length} Open</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {isLoadingJobs ? (
                        <div className="p-5 space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />)}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
                            <Briefcase className="text-gray-300 mb-2" size={32} />
                            No open jobs. Post one to start recruiting.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {jobs.map((job: any) => (
                                <div key={job.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#0f0820] transition group">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center shrink-0">
                                            <Briefcase size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-[14px]">{job.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-[12px] text-gray-500">
                                                <span>{job.department}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>{job.location || job.workModel}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span className="font-medium text-brand">{job._count?.applications || 0} Applicants</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/hr/ats/jobs/${job.id}`}>
                                        <button className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-brand hover:bg-brand/10 transition">
                                            <ChevronRight size={18} />
                                        </button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>

      </div>
    </div>
  );
}
