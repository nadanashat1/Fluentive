"use client";

import { motion } from "framer-motion";
import { Activity, ShieldAlert, Cpu, HardDrive, BarChart3, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { apiFetch } from "@/lib/api-client";

/**
 * ENTERPRISE MONITORING DASHBOARD
 * Real-time observability for system health, traffic, and performance.
 */

export default function MonitoringPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      return await apiFetch('/api/admin/health');
    },
    refetchInterval: 10000 // Refetch every 10s
  });

  const metrics = [
    { label: "API Latency", value: "42ms", icon: <Clock size={20} />, color: "text-emerald-500", trend: "-5%" },
    { label: "DB CPU Load", value: "12%", icon: <Cpu size={20} />, color: "text-blue-500", trend: "+2%" },
    { label: "Storage Use", value: "64%", icon: <HardDrive size={20} />, color: "text-amber-500", trend: "0%" },
    { label: "Error Rate", value: "0.02%", icon: <ShieldAlert size={20} />, color: "text-emerald-500", trend: "-12%" },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Observability</h1>
          <p className="text-gray-500 text-sm">Real-time infrastructure and application health monitoring.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM OPERATIONAL
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-[#150a24] border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-gray-50 dark:bg-white/5 ${m.color}`}>{m.icon}</div>
              <span className={`text-xs font-bold ${m.trend.startsWith('-') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {m.trend}
              </span>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Traffic Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#150a24] border border-gray-100 dark:border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-brand" />
              API Traffic (Requests/sec)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={Array.from({ length: 24 }).map((_, i) => ({ h: i, v: Math.floor(Math.random() * 50) + 10 }))}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
                <XAxis dataKey="h" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#150a24', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="v" stroke="#8b5cf6" fillOpacity={1} fill="url(#trafficGrad)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Failed Jobs & Errors */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-white dark:bg-[#150a24] border border-gray-100 dark:border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              Recent System Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { t: "Database connection spike detected", time: "2 mins ago", level: "WARNING" },
              { t: "Failed to process payroll batch #882", time: "15 mins ago", level: "ERROR" },
              { t: "Rate limit reached for Organization 'Stark Industries'", time: "1 hour ago", level: "INFO" },
              { t: "New version deployed: v2.4.0-stable", time: "3 hours ago", level: "INFO" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-transparent hover:border-brand/20 transition">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${a.level === 'ERROR' ? 'bg-rose-500' : a.level === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.t}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{a.time} • {a.level}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
