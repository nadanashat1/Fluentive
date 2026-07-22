"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Mail, Phone, BookOpen, Star, Users } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

export default function InstructorsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['instructors', { search }],
    queryFn: async () => {
      return await apiFetch(`/api/instructors?search=${search}&limit=50`);
    },
  });

  const instructors = data?.data?.instructors || [];

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">
              Instructors 👨‍🏫
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage your teaching staff, their expertise, and course assignments.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/instructors/new">
              <ActionButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Add Instructor
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between shrink-0">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search instructors by name, email, or expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </div>
          
          <div className="text-[13px] text-gray-500 font-medium">
            {instructors.length} instructor{instructors.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#150a24] p-6 flex flex-col items-center gap-4 h-[300px]">
                  <div className="h-20 w-20 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="w-full flex justify-center gap-2 mt-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
                  </div>
                  <div className="mt-auto h-10 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-[#150a24] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4 text-3xl">
                👨‍🏫
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No instructors found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                {search ? "We couldn't find any instructors matching your search criteria." : "You haven't added any instructors yet. Build your teaching team to get started."}
              </p>
              {!search && (
                <Link href="/instructors/new">
                  <ActionButton className="bg-brand text-white px-6 py-2 rounded-soft font-semibold text-[13px]">
                    Add Your First Instructor
                  </ActionButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {instructors.map((instructor: any) => (
                <div key={instructor.id} className="group flex flex-col items-center rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6 text-center hover:shadow-lg hover:border-brand/30 transition-all duration-300">
                  <div className="relative mb-4">
                    {instructor.avatar ? (
                      <img src={instructor.avatar} alt={instructor.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-[#f5f6fb] dark:ring-[#0b0614]" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl font-bold text-brand ring-4 ring-[#f5f6fb] dark:ring-[#0b0614]">
                        {instructor.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-[#150a24] shadow-sm">
                      <div className={`h-3.5 w-3.5 rounded-full ${instructor.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-[16px] mb-1">
                    {instructor.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 mb-3">
                    <Mail size={12} />
                    <span className="truncate max-w-[180px]">{instructor.email}</span>
                  </div>
                  
                  {instructor.expertise && instructor.expertise.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {instructor.expertise.slice(0, 3).map((exp: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-brand/5 text-brand dark:bg-brand/10">
                          {exp}
                        </span>
                      ))}
                      {instructor.expertise.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          +{instructor.expertise.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto w-full grid grid-cols-2 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col items-center p-2 rounded-lg bg-[#f5f6fb] dark:bg-[#0b0614]/50">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Courses</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                        <BookOpen size={14} className="text-brand" />
                        {instructor._count?.courses || 0}
                      </div>
                    </div>
                    <div className="flex flex-col items-center p-2 rounded-lg bg-[#f5f6fb] dark:bg-[#0b0614]/50">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Students</span>
                      <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                        <Users size={14} className="text-purple-500" />
                        {instructor.totalStudents || 0}
                      </div>
                    </div>
                  </div>
                  
                  <Link href={`/instructors/${instructor.id}`} className="w-full mt-3">
                    <button className="w-full py-2 rounded-soft text-[12px] font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      View Profile
                    </button>
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
