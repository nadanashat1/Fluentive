"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, Activity, User, Briefcase, FileText, Settings, ShieldAlert, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "@/lib/api-client";

export default function GlobalTimelinePage() {
  const [filter, setFilter] = useState("ALL");

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['global-timeline', filter],
    queryFn: async () => {
      const url = filter === "ALL" ? `/api/activities/timeline` : `/api/activities/timeline?type=${filter}`;
      return await apiFetch(url);
    },
    refetchInterval: 5000 // Realtime polling approximation if websockets not active
  });

  const activities = timelineData?.data || [];

  const getIconForActivity = (type: string, description: string) => {
    if (type === 'SYSTEM' && description.includes('Invoice')) return <FileText className="text-emerald-500" size={16} />;
    if (type === 'SYSTEM' && description.includes('Deal')) return <Briefcase className="text-brand" size={16} />;
    if (type === 'STATUS_CHANGE') return <Zap className="text-amber-500" size={16} />;
    if (type === 'EMAIL_SENT') return <Activity className="text-blue-500" size={16} />;
    return <User className="text-gray-400" size={16} />;
  };

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              Global Enterprise Timeline <Activity className="text-brand" />
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Live feed of all business operations across Sales, HR, Marketing, and Finance.
            </p>
          </div>

          <div className="flex gap-2 bg-white dark:bg-[#1a0b2e] p-1 rounded-lg border border-gray-200 dark:border-gray-800">
            {['ALL', 'SYSTEM', 'STATUS_CHANGE', 'NOTE_ADDED'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-soft text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-brand text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Feed */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-4">
          {isLoading ? (
            [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl bg-white dark:bg-[#1a0b2e] border border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Activity className="mx-auto mb-4 text-gray-300" size={48} />
              <p>No activities recorded yet.</p>
            </div>
          ) : (
            <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent">
              {activities.map((activity: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={activity.id} 
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-[#0b0614] bg-white dark:bg-[#1a0b2e] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {getIconForActivity(activity.type, activity.description)}
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a0b2e] shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                        {activity.user?.name || 'System Auto-Action'}
                      </span>
                      <time className="text-xs text-brand font-medium">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </div>
                    
                    {/* Entity Badges */}
                    {(activity.lead || activity.deal) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                        {activity.lead && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            Lead: {activity.lead.name}
                          </span>
                        )}
                        {activity.deal && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                            Deal: {activity.deal.title}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
