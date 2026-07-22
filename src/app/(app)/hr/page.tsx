"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users, Calendar, Clock, DollarSign, Building, Award } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { SalesStatsCard } from "@/components/sales-pipeline/sales-stats-card";
import { apiFetch } from "@/lib/api-client";

export default function HRPage() {
  const [search, setSearch] = useState("");

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['hr-analytics'],
    queryFn: async () => {
      return await apiFetch(`/api/hr/analytics`);
    },
  });

  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['hr-employees', { search }],
    queryFn: async () => {
      return await apiFetch(`/api/hr/employees?search=${search}`);
    },
  });

  const analytics = analyticsData?.data || {
    totalEmployees: 0, activeEmployees: 0, totalPayroll: 0, attendanceRate: 0, leaveRequestsCount: 0
  };
  const employees = employeesData?.data || [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              Human Resources <Users className="text-brand" />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage employees, attendance, payroll, and recruitment.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/hr/new">
              <ActionButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Add Employee
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <SalesStatsCard 
            title="Total Employees" 
            value={analytics.totalEmployees} 
            delta="Active: M" 
            deltaPositive={true} 
          />
          <SalesStatsCard 
            title="Total Payroll" 
            value={formatCurrency(analytics.totalPayroll)} 
            delta="Monthly" 
            deltaPositive={false} 
          />
          <SalesStatsCard 
            title="Attendance Rate" 
            value={`${analytics.attendanceRate.toFixed(1)}%`} 
            delta="Last 30 Days" 
            deltaPositive={analytics.attendanceRate > 95} 
          />
          <SalesStatsCard 
            title="Pending Leaves" 
            value={analytics.leaveRequestsCount} 
            delta="Requires Action" 
            deltaPositive={analytics.leaveRequestsCount === 0} 
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between shrink-0 mt-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Employee Directory</h2>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search employees by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Directory Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {isLoadingEmployees ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#150a24] p-6 flex flex-col items-center gap-4 h-[250px]">
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-[#150a24] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 text-3xl">
                👥
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No employees found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                {search ? "We couldn't find any employees matching your search criteria." : "You haven't added any employees yet. Build your team directory to get started."}
              </p>
              {!search && (
                <Link href="/hr/new">
                  <ActionButton className="bg-brand text-white px-6 py-2 rounded-soft font-semibold text-[13px]">
                    Add Your First Employee
                  </ActionButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {employees.map((employee: any) => (
                <div key={employee.id} className="group flex flex-col items-center rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 text-center hover:shadow-lg hover:border-brand/30 transition-all duration-300">
                  <div className="relative mb-4">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl font-bold text-brand ring-4 ring-[#f5f6fb] dark:ring-[#0b0614]">
                      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[#150a24] shadow-sm">
                      <div className={`h-3.5 w-3.5 rounded-full ${employee.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] mb-1">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  
                  <p className="text-[13px] text-brand font-medium mb-3">
                    {employee.position || 'Employee'}
                  </p>
                  
                  <div className="w-full space-y-2 text-[12px] text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-left">
                    <div className="flex items-center gap-2">
                      <Building size={14} className="text-gray-400" />
                      <span className="truncate">{employee.department || 'General'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span>Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Link href={`/hr/${employee.id}`} className="w-full mt-auto py-2 rounded-soft text-[12px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors block text-center">
                    View Profile
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
