"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';

// ✅ CRITICAL: Modern CRM Color Palette
const COLORS = {
  primary: '#840A36',
  secondary: '#8b0b45',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  muted: '#8b8f9b',
  chart: [
    '#840A36',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899'
  ]
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#f59e0b',
  interested: '#8b5cf6',
  qualified: '#8b5cf6',
  converted: '#10b981',
  lost: '#ef4444'
};

// 1. Leads Growth Line Chart
export function LeadsGrowthChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!data || data.length === 0) {
    return <EmptyChartState message="No lead growth data yet" />;
  }

  const formattedData = data.map(d => ({
    name: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
    count: d.count
  }));

  return (
    <div className="w-full min-h-[320px]">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={320} minWidth={100} minHeight={100}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2f3a" opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #2a2f3a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={COLORS.primary}
              fillOpacity={1}
              fill="url(#colorCount)"
              strokeWidth={3}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
          No chart data available.
        </div>
      )}
    </div>
  );
}

// 2. Lead Status Pie Chart
export function LeadStatusPieChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!data || data.length === 0) {
    return <EmptyChartState message="No status data yet" />;
  }

  return (
    <div className="w-full min-h-[270px]">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={270} minWidth={100} minHeight={100}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status.toLowerCase()] || COLORS.chart[index % COLORS.chart.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #2a2f3a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex min-h-[270px] items-center justify-center text-sm text-muted-foreground">
          No chart data available.
        </div>
      )}
    </div>
  );
}

// 3. AI Score Distribution Bar Chart
export function AIScoreBarChart({ data }: { data: number[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!data || data.length === 0) {
    return <EmptyChartState message="No AI score data yet" />;
  }

  const formattedData = ['0-20', '21-40', '41-60', '61-80', '81-100'].map((label, i) => ({
    name: label,
    count: data[i] || 0
  }));

  return (
    <div className="w-full min-h-[270px]">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={270} minWidth={100} minHeight={100}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2f3a" opacity={0.5} />
            <XAxis
              dataKey="name"
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #2a2f3a', borderRadius: '8px' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar
              dataKey="count"
              fill={COLORS.info}
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex min-h-[270px] items-center justify-center text-sm text-muted-foreground">
          No chart data available.
        </div>
      )}
    </div>
  );
}

// 4. Revenue Trend Area Chart
export function RevenueTrendChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (!data || data.length === 0) {
    return <EmptyChartState message="No revenue data yet" />;
  }

  return (
    <div className="w-full min-h-[320px]">
      {data?.length ? (
        <ResponsiveContainer width="100%" height={320} minWidth={100} minHeight={100}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2f3a" opacity={0.5} />
            <XAxis
              dataKey="month"
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={COLORS.muted}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a0b2e', border: '1px solid #2a2f3a', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [`$${value}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={COLORS.success}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={3}
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground">
          No chart data available.
        </div>
      )}
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 rounded-full bg-gray-100 dark:bg-[#0f0820] p-4">
        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{message}</p>
      <button className="mt-4 text-xs font-semibold text-brand hover:underline">
        Add data to populate
      </button>
    </div>
  );
}
