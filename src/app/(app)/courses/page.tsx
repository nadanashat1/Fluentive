"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, BookOpen, Clock, Users, Star } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { typedApi } from "@/services/typed-api.service";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

export default function CoursesPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { search }],
    queryFn: async () => {
      return await apiFetch(`/api/courses?search=${search}&limit=50`);
    },
  });

  const courses = data?.data?.courses || [];

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">
              Courses 📚
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Manage your learning modules and educational content.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/courses/new">
              <ActionButton
                className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95"
              >
                <Plus size={18} />
                Create Course
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
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
            />
          </div>
          
          <div className="text-[13px] text-gray-500 font-medium">
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Course Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#150a24] p-4 flex flex-col gap-4 h-[280px]">
                  <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="mt-auto h-8 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white dark:bg-[#150a24] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <div className="h-16 w-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4">
                <BookOpen size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">No courses found</h3>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                {search ? "We couldn't find any courses matching your search criteria." : "You haven't created any courses yet. Start building your curriculum today."}
              </p>
              {!search && (
                <Link href="/courses/new">
                  <ActionButton className="bg-brand text-white px-6 py-2 rounded-soft font-semibold text-[13px]">
                    Create Your First Course
                  </ActionButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course: any) => (
                <div key={course.id} className="group flex flex-col rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] overflow-hidden hover:shadow-lg hover:border-brand/30 transition-all duration-300">
                  <div className="h-36 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50 group-hover:text-white/80 transition-colors">
                        <BookOpen size={48} />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded shadow-sm text-gray-800">
                      {course.level}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 text-[15px] leading-tight">
                        {course.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                      {course.description || "No description provided."}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{course.durationMins}m</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{course._count?.modules || 0} mods</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{course._count?.enrollments || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 mt-auto">
                      <div className="flex items-center gap-2">
                        {course.instructor?.avatar ? (
                          <img src={course.instructor.avatar} alt={course.instructor.name} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center text-[10px] font-bold">
                            {course.instructor?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                          {course.instructor?.name || "Unassigned"}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {course.price > 0 ? `$${course.price}` : 'Free'}
                      </div>
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
