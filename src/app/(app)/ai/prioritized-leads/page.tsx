"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { motion } from "framer-motion";
import { Search, Filter, PhoneCall, Mail, Star, Activity, MoreHorizontal, ArrowUpRight } from "lucide-react";

interface PrioritizedLead {
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    source: string;
    createdAt: string;
    lastFollowUp: string | null;
  };
  score: number;
  priority: string;
  action: string;
  followUp?: {
    shouldFollowUp: boolean;
    suggestedAction: string;
  };
  nextAction: string;
}

export default function PrioritizedLeadsPage() {
  const [leads, setLeads] = useState<PrioritizedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: "50",
          minScore: minScore.toString()
        });
        if (statusFilter) params.set("status", statusFilter);
        if (sourceFilter) params.set("source", sourceFilter);

        const response = await apiFetch<{ status: "success"; data: { leads: PrioritizedLead[]; summary: any } }>(
          `/api/ai/prioritized-leads?${params.toString()}`
        );
        let sortedLeads = response.data.leads;

        // Apply client-side filtering
        if (statusFilter) {
          sortedLeads = sortedLeads.filter(l => l.lead.status === statusFilter);
        }
        if (sourceFilter) {
          sortedLeads = sortedLeads.filter(l => l.lead.source === sourceFilter);
        }

        // Apply sorting
        if (sortBy === "score") {
          sortedLeads = sortedLeads.sort((a, b) => b.score - a.score);
        } else if (sortBy === "score_asc") {
          sortedLeads = sortedLeads.sort((a, b) => a.score - b.score);
        } else if (sortBy === "name") {
          sortedLeads = sortedLeads.sort((a, b) => a.lead.name.localeCompare(b.lead.name));
        } else if (sortBy === "created") {
          sortedLeads = sortedLeads.sort((a, b) => new Date(b.lead.createdAt).getTime() - new Date(a.lead.createdAt).getTime());
        }

        setLeads(sortedLeads);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError("We couldn't load the prioritized leads. Let's try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [minScore, statusFilter, sourceFilter, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full rounded-lg2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#f25572]">Oops, something went wrong</p>
          <p className="mt-1 text-[14px] text-[#8b8f9b] dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 bg-[#f5f6fb] dark:bg-[#0b0614] min-h-full px-4 pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-3">
            Prioritized Leads <span className="bg-brand/10 text-brand text-sm px-3 py-1 rounded-full font-bold shadow-sm">{leads.length} Active</span>
          </h1>
          <p className="mt-1 text-[15px] text-[#8b8f9b] dark:text-gray-400">
            Leads ranked by AI likelihood to convert based on engagement and pipeline data.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#150a24] p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center gap-2 px-3 py-1 border-r border-gray-100 dark:border-gray-800/50">
            <Activity size={14} className="text-brand" />
            <span className="text-[12px] font-bold text-[#2f3440] dark:text-gray-300">Min Score</span>
            <input
              id="minScore"
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-24 accent-brand"
            />
            <span className="text-[12px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">{minScore}</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-[13px] font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
          </select>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-transparent border-none text-[13px] font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social">Social Media</option>
            <option value="email">Email</option>
          </select>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent border-none text-[13px] font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none pr-4"
          >
            <option value="score">Sort: Highest Score</option>
            <option value="score_asc">Sort: Lowest Score</option>
            <option value="name">Sort: Name (A-Z)</option>
            <option value="created">Sort: Newest First</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-[#f8f9fa] dark:bg-[#150a24]">
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400">Lead Info</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400">AI Score</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400">Priority</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400">Status</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400">Source</th>
                <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-[#646b7a] dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[14px] font-medium text-[#8b8f9b] dark:text-gray-400">
                    No leads match your filters. Try adjusting them to see more results!
                  </td>
                </tr>
              ) : (
                leads.map((item, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.lead.id} 
                    className="group border-b border-[#f0f1f3] dark:border-[#2a2f3a] hover:bg-brand/5 dark:hover:bg-[#1f1035]/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand/20 to-purple-500/20 flex items-center justify-center text-brand font-bold shadow-sm border border-brand/10">
                          {item.lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
                            {item.lead.name}
                            {i < 3 && item.score >= 80 && <Star size={12} fill="currentColor" className="text-amber-400" />}
                          </p>
                          <p className="text-[12px] text-[#646b7a] dark:text-gray-400">{item.lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 text-[13px] font-black text-brand bg-brand/10 border border-brand/20 rounded shadow-sm w-12 text-center">
                          {item.score}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-brand rounded-full" style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm border ${
                        item.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' :
                        item.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/50' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                      }`}>
                        {item.priority === 'high' && <Activity size={10} />} {item.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${
                        item.lead.status === 'interested' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {item.lead.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[#646b7a] dark:text-gray-400 capitalize">
                      {item.lead.source || 'Direct'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors tooltip-trigger" title="Send Email">
                          <Mail size={14} />
                        </button>
                        <button className="p-1.5 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors tooltip-trigger" title="Call Lead">
                          <PhoneCall size={14} />
                        </button>
                        <button className="p-1.5 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 transition-colors tooltip-trigger" title="View Details">
                          <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
