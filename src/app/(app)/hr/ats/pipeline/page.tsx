"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Calendar, Star, AlertTriangle, CheckCircle, BrainCircuit } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action-button";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api-client";

const STAGES = [
  { id: 'SCREENING', title: 'Screening', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'HR_INTERVIEW', title: 'HR Interview', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'TECHNICAL_INTERVIEW', title: 'Technical', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { id: 'ASSESSMENT', title: 'Assessment', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'OFFERED', title: 'Offered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

export default function ATSPipelinePage() {
  const [search, setSearch] = useState("");

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['ats-pipeline-candidates'],
    queryFn: async () => {
      return await apiFetch(`/api/hr/ats/candidates`);
    },
  });

  const candidates = candidatesData?.data || [];

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-hidden">
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              Recruitment Pipeline
            </h1>
            <p className="mt-1 text-[14px] text-[#707483] dark:text-gray-400">
              Drag and drop candidates through the hiring stages. AI scores are updated automatically.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-soft border border-[#dbc4cf] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] text-[13px] focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              />
            </div>
            <ActionButton className="inline-flex h-10 items-center justify-center gap-2 rounded-soft bg-brand px-5 text-[13px] font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark hover:scale-[1.02] active:scale-95">
              <Plus size={18} />
              Add Candidate
            </ActionButton>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 min-h-0 overflow-x-auto flex gap-4 pb-2 snap-x">
          {STAGES.map(stage => {
            // Find candidates in this stage based on their active application status
            const stageCandidates = candidates.filter((c: any) => 
              c.applications?.some((app: any) => app.status === stage.id)
            );

            return (
              <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col rounded-xl bg-gray-100/50 dark:bg-[#150a24]/50 border border-gray-200/50 dark:border-gray-800/50 h-full snap-start">
                <div className="p-3 border-b border-gray-200/50 dark:border-gray-800/50 flex justify-between items-center bg-white/50 dark:bg-[#1a0b2e]/50 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[14px] text-gray-900 dark:text-gray-100">{stage.title}</h3>
                    <span className="text-[11px] font-bold text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full shadow-sm">
                      {stageCandidates.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {stageCandidates.map((candidate: any) => {
                    const activeApp = candidate.applications.find((a: any) => a.status === stage.id);
                    const score = activeApp?.matchScore || 0;
                    
                    return (
                      <motion.div 
                        layoutId={candidate.id}
                        key={candidate.id} 
                        className="bg-white dark:bg-[#1a0b2e] border border-gray-200 dark:border-[#2a2f3a] rounded-lg p-3 shadow-sm hover:shadow-md hover:border-brand/30 transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-[14px] text-gray-900 dark:text-gray-100">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <div className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            score >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            score >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <BrainCircuit size={12} />
                            {score}% Match
                          </div>
                        </div>

                        <p className="text-[12px] text-gray-500 mb-3 truncate font-medium">
                          {activeApp?.job?.title || 'General Application'}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.skills.slice(0, 3).map((skill: any) => (
                            <span key={skill.id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {skill.name}
                            </span>
                          ))}
                          {candidate.skills.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                              +{candidate.skills.length - 3} more
                            </span>
                          )}
                        </div>

                        {activeApp?.aiFlags && activeApp.aiFlags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={12} />
                            <span className="truncate">{activeApp.aiFlags[0]}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  
                  {stageCandidates.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center text-[12px] text-gray-400 font-medium">
                      Drop candidate here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
