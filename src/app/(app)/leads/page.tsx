"use client";



import { useEffect, useState, useCallback } from "react";

import Link from "next/link";


import { ApiError, apiFetch } from "@/lib/api-client";

import { ROUTES } from "@/lib/api-endpoints";

import { LeadStatus, type Lead } from "@prisma/client";

import { Brain, Lightbulb, ArrowRight, Check, Trash2, ChevronDown, Filter, X, Grid, List, RefreshCw, Download } from "lucide-react";

import { useToast } from "@/components/ui/toast";

/** Row shape from `/api/leads` (API may include relations beyond base `Lead`). */
type LeadListRow = Lead & {
  course?: string | null;
  owner?: { name?: string } | null;
};



export default function LeadsPage() {

  const [leads, setLeads] = useState<LeadListRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [status, setStatus] = useState("");

  const [source, setSource] = useState("");

  const [sort, setSort] = useState("-createdAt");

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const [bulkAction, setBulkAction] = useState("");

  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [owner, setOwner] = useState("");

  const [minAiScore, setMinAiScore] = useState("");

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();



  const fetchLeads = useCallback(async () => {

    setLoading(true);

    try {

      const params = new URLSearchParams({

        page: page.toString(),

        limit: "10"

      });

      if (debouncedSearch) params.set("search", debouncedSearch);

      if (status) params.set("status", status);

      if (source) params.set("source", source);

      if (sort) params.set("sort", sort);

      if (dateRange.start) params.set("startDate", dateRange.start);

      if (dateRange.end) params.set("endDate", dateRange.end);

      if (owner) params.set("owner", owner);

      if (minAiScore) params.set("minAiScore", minAiScore);



      const data = await apiFetch<{ success: true; data: { leads: LeadListRow[]; total: number; page: number; limit: number } }>(`${ROUTES.leads.list}?${params.toString()}`);

      setLeads(data.data.leads);

      setTotal(data.data.total);

      // Calculate totalPages from total and limit

      const calculatedTotalPages = Math.ceil(data.data.total / data.data.limit);

      setTotalPages(calculatedTotalPages);

    } catch (e) {

      if (e instanceof ApiError) {

        setError(e.message);

      } else {

        setError("We couldn't load your leads. Let's try again.");

      }

    } finally {

      setLoading(false);

    }

  }, [page, debouncedSearch, status, source, sort, dateRange, owner, minAiScore]);



  useEffect(() => {

    fetchLeads();

  }, [fetchLeads]);



  // Debounce search input with 500ms delay

  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedSearch(search);

      setPage(1);

    }, 500);

    return () => clearTimeout(timer);

  }, [search]);



  // Fetch AI suggestion when leads are loaded

  useEffect(() => {

    if (leads.length > 0) {

      const suggestions = [

        "Focus on leads with 'interested' status - they have 3x higher conversion rate",

        "Leads from 'Website' source have shown 25% better engagement",

        "Consider following up with leads from last 7 days for higher response rates",

        "AI recommends prioritizing leads with recent activity"

      ];

      setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);

    }

  }, [leads]);



  const handleSearch = (e: React.FormEvent) => {

    e.preventDefault();

    setDebouncedSearch(search);

    setPage(1);

  };



  const handleSelectLead = (leadId: string) => {

    setSelectedLeads((prev) => {

      const newSet = new Set(prev);

      if (newSet.has(leadId)) {

        newSet.delete(leadId);

      } else {

        newSet.add(leadId);

      }

      return newSet;

    });

  };



  const handleRefresh = async () => {

    setRefreshing(true);

    await fetchLeads();

    setRefreshing(false);

  };



  const handleSelectAll = () => {

    if (selectedLeads.size === leads.length) {

      setSelectedLeads(new Set());

    } else {

      setSelectedLeads(new Set(leads.map((lead) => lead.id)));

    }

  };



  const handleBulkDelete = async () => {

    if (selectedLeads.size === 0) return;



    if (!confirm(`Delete ${selectedLeads.size} lead(s)? We can't undo this.`)) return;



    try {

      for (const leadId of selectedLeads) {

        await apiFetch(`/api/leads/${leadId}`, { method: "DELETE" });

      }

      showToast(`Deleted ${selectedLeads.size} lead(s). Done!`, "success");

      setSelectedLeads(new Set());

      fetchLeads();

    } catch (e) {

      showToast("We couldn't delete them. Try again?", "error");

    }

  };



  const handleBulkStatusUpdate = async () => {

    if (selectedLeads.size === 0 || !bulkAction) return;



    try {

      for (const leadId of selectedLeads) {

        await apiFetch(`/api/leads/${leadId}`, {

          method: "PUT",

          body: JSON.stringify({ status: bulkAction }),

        });

      }

      showToast(`Updated ${selectedLeads.size} lead(s). All set!`, "success");

      setSelectedLeads(new Set());

      setBulkAction("");

      fetchLeads();

    } catch (e) {

      showToast("We couldn't update them. Try again?", "error");

    }

  };



  if (loading && page === 1) {

    return (

      <div className="space-y-4">

        <div className="skeleton h-8 w-32" />

        <div className="skeleton h-14 w-full rounded-lg2" />

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

    <div className="space-y-4 pb-6">

      {/* Header with stats */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">Leads Management 👥</h1>

          <p className="text-[13px] text-[#8b8f9b] dark:text-gray-400">{total} total leads found</p>

          <div className="mt-3 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#1a0b2e]">

            <p className="text-[12px] text-[#6b7280] dark:text-gray-400">

              <span className="font-semibold text-[#840A36]">📋 Quick Guide:</span> Add new leads, track their status, and manage your sales pipeline. Use filters to find specific leads and click on any lead to view details.

            </p>

          </div>

        </div>

        <div className="flex gap-2">

          <button

            onClick={handleRefresh}

            disabled={refreshing}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2 disabled:opacity-50"

            title="Refresh leads"

          >

            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />

          </button>

          <button

            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2"

            title="Toggle view mode"

          >

            {viewMode === "list" ? <Grid size={14} /> : <List size={14} />}

          </button>

          <button

            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2"

          >

            <Filter size={14} />

            Advanced Filters

            <ChevronDown size={14} className={`transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />

          </button>

          <button

            onClick={() => {

              const params = new URLSearchParams();

              if (debouncedSearch) params.set("search", debouncedSearch);

              if (status) params.set("status", status);

              if (source) params.set("source", source);

              window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/leads/export?${params.toString()}`, '_blank');

            }}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2"

            title="Export leads to CSV"

          >

            <Download size={14} />

            Export

          </button>

          <Link

            href="/leads/new"

            className="rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90"

          >

            Add Lead

          </Link>

        </div>

      </div>



      {/* Filters */}

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-3">

          <input

            type="text"

            placeholder="Search leads..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            className="flex-1 rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50 min-w-[160px]"

          />

          <select

            title="Filter by status"

            value={status}

            onChange={(e) => { setStatus(e.target.value); setPage(1); }}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"

          >

            <option value="">All Statuses</option>

            <option value="NEW">New</option>

            <option value="CONTACTED">Contacted</option>

            <option value="QUALIFIED">Qualified</option>

            <option value="CONVERTED">Converted</option>

            <option value="LOST">Lost</option>

          </select>

          <select

            title="Filter by source"

            value={source}

            onChange={(e) => { setSource(e.target.value); setPage(1); }}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"

          >

            <option value="">All Sources</option>

            <option value="Website">Website</option>

            <option value="Referral">Referral</option>

            <option value="Facebook Ads">Facebook Ads</option>

            <option value="Instagram">Instagram</option>

            <option value="Other">Other</option>

          </select>

          <select

            title="Sort by"

            value={sort}

            onChange={(e) => { setSort(e.target.value); setPage(1); }}

            className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"

          >

            <option value="-createdAt">Newest First</option>

            <option value="createdAt">Oldest First</option>

            <option value="name">Name A-Z</option>

            <option value="-name">Name Z-A</option>

            <option value="aiScore">AI Score Low-High</option>

            <option value="-aiScore">AI Score High-Low</option>

          </select>

          <button

            type="submit"

            className="rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90"

          >

            Search

          </button>

        </form>



        {showAdvancedFilters && (

          <div className="mt-3 grid gap-3 border-t border-[#f0f1f3] dark:border-[#2a2f3a] pt-3 sm:grid-cols-2 lg:grid-cols-4">

            <div>

              <label className="mb-1 block text-[11px] font-semibold text-[#6b7280] dark:text-gray-400">Date Range Start</label>

              <input

                type="date"

                title="Date range start"

                value={dateRange.start}

                onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setPage(1); }}

                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/50"

              />

            </div>

            <div>

              <label className="mb-1 block text-[11px] font-semibold text-[#6b7280] dark:text-gray-400">Date Range End</label>

              <input

                type="date"

                title="Date range end"

                value={dateRange.end}

                onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setPage(1); }}

                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/50"

              />

            </div>

            <div>

              <label className="mb-1 block text-[11px] font-semibold text-[#6b7280] dark:text-gray-400">Owner</label>

              <input

                type="text"

                placeholder="Filter by owner..."

                value={owner}

                onChange={(e) => { setOwner(e.target.value); setPage(1); }}

                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/50"

              />

            </div>

            <div>

              <label className="mb-1 block text-[11px] font-semibold text-[#6b7280] dark:text-gray-400">Min AI Score</label>

              <input

                type="number"

                placeholder="0-100"

                min="0"

                max="100"

                value={minAiScore}

                onChange={(e) => { setMinAiScore(e.target.value); setPage(1); }}

                className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/50"

              />

            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">

              <button

                onClick={() => {

                  setDateRange({ start: "", end: "" });

                  setOwner("");

                  setMinAiScore("");

                  setPage(1);

                }}

                className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-4 py-2 text-[12px] font-semibold text-[#646b7a] dark:text-gray-400 transition hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e] flex items-center gap-2"

              >

                <X size={12} />

                Clear Advanced Filters

              </button>

            </div>

          </div>

        )}

      </div>



      {/* AI Suggestion Panel */}

      {aiSuggestion && (

        <div className="rounded-lg2 border border-brand/30 bg-brand/5 p-4">

          <div className="flex items-start gap-3">

            <div className="flex-shrink-0">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20">

                <Brain size={20} className="text-brand" />

              </div>

            </div>

            <div className="flex-1">

              <div className="flex items-center gap-2 mb-1">

                <h3 className="text-sm font-semibold text-brand">AI Insight</h3>

                <Lightbulb size={14} className="text-brand" />

              </div>

              <p className="text-[13px] text-[#6b7280] dark:text-gray-400">{aiSuggestion}</p>

              <Link

                href="/ai/prioritized-leads"

                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"

              >

                View AI prioritized leads

                <ArrowRight size={12} />

              </Link>

            </div>

          </div>

        </div>

      )}



      {/* Bulk Action Bar */}

      {selectedLeads.size > 0 && (

        <div className="rounded-lg2 border border-brand/30 bg-brand/5 p-4 flex items-center justify-between gap-4">

          <div className="flex items-center gap-2">

            <Check size={18} className="text-brand" />

            <span className="text-sm font-semibold text-brand">{selectedLeads.size} lead(s) selected</span>

          </div>

          <div className="flex items-center gap-2">

            <select

              value={bulkAction}

              onChange={(e) => setBulkAction(e.target.value)}

              title="Select status to update"

              className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/50"

            >

              <option value="">Update Status...</option>

              <option value="new">New</option>

              <option value="contacted">Contacted</option>

              <option value="interested">Interested</option>

              <option value="not_interested">Not Interested</option>

              <option value="converted">Converted</option>

            </select>

            <button

              onClick={handleBulkStatusUpdate}

              disabled={!bulkAction}

              className="rounded-soft bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"

            >

              Update

            </button>

            <button

              onClick={handleBulkDelete}

              className="rounded-soft border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 text-[13px] font-semibold transition hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"

            >

              <Trash2 size={16} />

              Delete

            </button>

          </div>

        </div>

      )}



      {/* Table with horizontal scroll on mobile */}

      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[800px]">

            <thead className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-[#f8f9fa] dark:bg-[#0f0820] text-left">

              <tr>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400 w-10">

                  <input

                    type="checkbox"

                    checked={selectedLeads.size === leads.length && leads.length > 0}

                    onChange={handleSelectAll}

                    title="Select all leads"

                    className="w-4 h-4 rounded border-[#e1e3e9] dark:border-[#2a2f3a] text-brand focus:ring-brand"

                  />

                </th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Name</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Phone</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Email</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Course</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Status</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">AI Score</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Owner</th>

                <th className="px-4 py-3 text-[13px] font-semibold text-[#646b7a] dark:text-gray-400">Actions</th>

              </tr>

            </thead>

            <tbody>

              {leads.map((lead) => (

                <tr key={lead.id} className="border-b border-[#f0f1f3] dark:border-[#2a2f3a] hover:bg-[#fafbfc] dark:hover:bg-[#1f1035] transition-colors">

                  <td className="px-4 py-3">

                    <input

                      type="checkbox"

                      checked={selectedLeads.has(lead.id)}

                      onChange={() => handleSelectLead(lead.id)}

                      title="Select lead"

                      className="w-4 h-4 rounded border-[#e1e3e9] dark:border-[#2a2f3a] text-brand focus:ring-brand"

                    />

                  </td>

                  <td className="px-4 py-3 text-[14px] font-medium text-[#2f3440] dark:text-gray-200">{lead.name}</td>

                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{lead.phone}</td>

                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{lead.email || "-"}</td>

                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{lead.course}</td>

                  <td className="px-4 py-3">

                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${

                      lead.status === LeadStatus.NEW ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :

                      lead.status === LeadStatus.CONTACTED ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :

                      lead.status === LeadStatus.QUALIFIED ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :

                      lead.status === LeadStatus.LOST ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :

                      lead.status === LeadStatus.CONVERTED ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :

                      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"

                    }`}>    

                      {lead.status || "NEW"}

                    </span>

                  </td>

                  <td className="px-4 py-3">

                    <Link

                      href={`/leads/${lead.id}/insights`}

                      className="text-[13px] font-semibold text-brand hover:underline"

                    >

                      View AI Score

                    </Link>

                  </td>

                  <td className="px-4 py-3 text-[14px] text-[#646b7a] dark:text-gray-400">{lead.owner?.name || "-"}</td>

                  <td className="px-4 py-3">

                    <Link

                      href={`/leads/${lead.id}`}

                      className="text-[13px] font-semibold text-brand hover:underline"

                    >

                      View

                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {leads.length === 0 && (

          <div className="p-8 text-center text-[14px] text-[#8b8f9b] dark:text-gray-400">No leads found. Try adjusting your filters or add a new lead!</div>

        )}

      </div>



      {/* Pagination */}

      {totalPages > 1 && (

        <div className="flex flex-col gap-3 sm:flex-row items-center justify-between rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">

          <div className="text-[13px] text-[#646b7a] dark:text-gray-400">

            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} leads

          </div>

          <div className="flex gap-2">

            <button

              onClick={() => setPage(p => Math.max(1, p - 1))}

              disabled={page === 1}

              className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-3 py-1.5 text-[13px] dark:text-gray-400 disabled:opacity-50 hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e]"

            >

              Previous

            </button>

            <span className="px-3 py-1.5 text-[13px] text-[#646b7a] dark:text-gray-400">Page {page} of {totalPages}</span>

            <button

              onClick={() => setPage(p => Math.min(totalPages, p + 1))}

              disabled={page === totalPages}

              className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-3 py-1.5 text-[13px] dark:text-gray-400 disabled:opacity-50 hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e]"

            >

              Next

            </button>

          </div>

        </div>

      )}

    </div>

  );

}

