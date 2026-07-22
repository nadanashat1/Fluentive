"use client";

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { authenticatedFetch } from '@/lib/api/auth-interceptor';
import { ROUTES } from '@/lib/api-endpoints';
import { TrendingUp, Users, Activity, AlertTriangle, RefreshCw } from 'lucide-react';

interface OverviewData {
  users: {
    total: number;
    active: number;
    growth: number;
  };
  sessions: {
    active: number;
    total24h: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  system: {
    errors24h: number;
    uptime: number;
  };
}

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ title, value, change, icon, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              {change >= 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(ROUTES.analytics.overview);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error || 'No data available'}</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Real-time analytics and system metrics</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Users"
            value={data.users.total.toLocaleString()}
            change={data.users.growth}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <KpiCard
            title="Active Users"
            value={data.users.active.toLocaleString()}
            icon={<Activity className="w-6 h-6 text-green-600" />}
            color="bg-green-100"
          />
          <KpiCard
            title="Active Sessions"
            value={data.sessions.active.toLocaleString()}
            icon={<Users className="w-6 h-6 text-purple-600" />}
            color="bg-purple-100"
          />
          <KpiCard
            title="System Errors"
            value={data.system.errors24h}
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
            color="bg-red-100"
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Performance</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Leads</span>
                <span className="font-medium">{data.leads.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Converted</span>
                <span className="font-medium text-green-600">{data.leads.converted.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-medium">{data.leads.conversionRate}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-green-600">{data.system.uptime}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">24h Sessions</span>
                <span className="font-medium">{data.sessions.total24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Error Rate</span>
                <span className={`font-medium ${
                  data.system.errors24h > 5 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {data.system.errors24h > 0 ? 'High' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
