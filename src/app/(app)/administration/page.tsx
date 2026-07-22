"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Shield, Users, Activity, Settings, HardDrive, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";
import { useAuth } from "@/contexts/AuthContext-production";
import { apiFetch } from "@/lib/api-client";

export default function AdministrationPage() {
  const { state } = useAuth();
  const user = state.status === 'authenticated' ? state.user : null;

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      return await apiFetch(`/api/users`);
    },
  });

  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: async () => {
      return await apiFetch(`/api/security/audit-logs?limit=5`);
    },
  });

  const usersList = usersData?.data || [];
  const auditLogs = auditData?.data || [];

  const activeUsers = usersList.filter((u: any) => u.isActive).length;
  const adminUsers = usersList.filter((u: any) => u.role === 'ADMIN').length;

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              Administration Center <Shield className="text-red-500" />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage system users, roles, and monitor enterprise security.
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <div className="flex gap-2">
              <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-gray-900 dark:bg-white px-5 text-[13px] font-bold text-white dark:text-gray-900 shadow-lg transition hover:scale-[1.02]">
                <Settings size={18} />
                System Preferences
              </ActionButton>
            </div>
          )}
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <SalesStatsCard 
            title="Total Users" 
            value={usersList.length} 
            delta={`${activeUsers} Active`} 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Admin Accounts" 
            value={adminUsers} 
            delta="High Privileges" 
            deltaPositive={false} 
          />
          <SalesStatsCard 
            title="System Status" 
            value="Healthy" 
            delta="All systems operational" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Database Load" 
            value="14%" 
            delta="Optimal" 
            deltaPositive={true} 
          />
        </div>

        <div className="grid gap-6 px-0 lg:grid-cols-[2fr_1fr] min-h-0 shrink-0">
            {/* Users List */}
            <div className="flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] h-[400px]">
                <div className="p-5 border-b border-[#ececef] dark:border-[#2a2f3a] flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">User Management</h3>
                    <Link href="/administration/users" className="text-sm font-semibold text-brand hover:underline">Manage All</Link>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {isLoadingUsers ? (
                        <div className="p-5 space-y-4">
                            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />)}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white dark:bg-[#1a0b2e] border-b border-gray-100 dark:border-[#2a2f3a]">
                                <tr>
                                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase">User</th>
                                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase">Role</th>
                                    <th className="py-3 px-5 text-[11px] font-semibold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersList.slice(0, 8).map((u: any) => (
                                    <tr key={u.id} className="border-b border-gray-50 dark:border-[#2a2f3a]/50 hover:bg-gray-50 dark:hover:bg-[#0f0820] transition">
                                        <td className="py-3 px-5">
                                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-[13px]">{u.name}</p>
                                            <p className="text-[11px] text-gray-500">{u.email}</p>
                                        </td>
                                        <td className="py-3 px-5">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                u.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5">
                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-400">
                                                <div className={`h-2 w-2 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {u.isActive ? 'Active' : 'Suspended'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Audit Logs */}
            <div className="flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-5 h-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Security Audit Logs</h3>
                    <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {isLoadingAudit ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                        </div>
                    ) : auditLogs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No recent security events.</p>
                    ) : (
                        auditLogs.map((log: any) => (
                            <div key={log.id} className="p-3 rounded-lg bg-gray-50 dark:bg-[#0f0820] border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{log.action}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 font-mono break-all">{log.ipAddress}</p>
                            </div>
                        ))
                    )}
                </div>
                <button className="mt-4 w-full py-2 text-sm font-semibold text-brand hover:bg-brand/5 rounded-soft transition">
                    View Full Audit Trail
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
