"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";

interface LeadInsight {
  sentiment: {
    sentiment: string;
    score: number;
  };
  engagementTrend: Array<{ week: number; count: number }>;
  insights: string[];
  stats: {
    totalNotes: number;
    totalActivities: number;
    importantNotes: number;
    uniqueNoteAuthors: number;
  };
}

export default function LeadInsightsPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [insights, setInsights] = useState<LeadInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch<{ success: true; data: LeadInsight }>(`/api/ai/leads/${leadId}/insights`);
        setInsights(response.data);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError("We couldn't load the lead insights. Let's try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

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

  if (!insights) {
    return null;
  }

  const sentimentValue = insights.sentiment?.sentiment || "neutral";
  const sentimentScore = typeof insights.sentiment?.score === "number" ? insights.sentiment.score : 0;
  const sentimentLabel = sentimentValue ? sentimentValue.charAt(0).toUpperCase() + sentimentValue.slice(1) : "Neutral";
  const engagementTrend = Array.isArray(insights.engagementTrend) ? insights.engagementTrend : [];
  const aiInsights = Array.isArray(insights.insights) ? insights.insights : [];

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">Lead Insights 🧠</h1>
        <p className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">
          AI-powered analysis for lead #{leadId}
        </p>
        <div className="mt-3 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#1a0b2e]">
          <p className="text-[12px] text-[#6b7280] dark:text-gray-400">
            <span className="font-semibold text-[#840A36]">🔍 AI Analysis:</span> Machine learning insights to help you understand lead behavior and optimize your approach.
          </p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">Activity Statistics 📊</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="p-4 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
            <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Total Notes</p>
            <p className="mt-1 text-2xl font-bold text-brand">{insights.stats.totalNotes}</p>
          </div>
          <div className="p-4 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
            <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Total Activities</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{insights.stats.totalActivities}</p>
          </div>
          <div className="p-4 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
            <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Important Notes</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{insights.stats.importantNotes}</p>
          </div>
          <div className="p-4 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
            <p className="text-[12px] text-[#8b8f9b] dark:text-gray-400">Unique Authors</p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{insights.stats.uniqueNoteAuthors}</p>
          </div>
        </div>
      </div>

      {/* Sentiment Analysis */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">Sentiment Analysis 💬</h2>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-[13px] font-medium ${
            sentimentValue === "positive" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
            sentimentValue === "neutral" ? "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" :
            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {sentimentLabel} ({Math.round(sentimentScore * 100)}%)
          </span>
          <p className="text-[13px] text-[#6b7280] dark:text-gray-400">
            Based on recent interactions and communication patterns
          </p>
        </div>
      </div>

      {/* Engagement Trend */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">Engagement Trend 📈</h2>
        <div className="space-y-2">
          {engagementTrend.map((item) => (
            <div key={item.week} className="flex items-center gap-4">
              <span className="text-[13px] text-[#6b7280] dark:text-gray-400 w-20">Week {item.week}</span>
              <div className="flex-1 h-4 bg-[#e7e9ef] dark:bg-[#2a2f3a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand transition-all duration-300"
                  style={{ width: `${Math.min(item.count * 10, 100)}%` }}
                />
              </div>
              <span className="text-[13px] font-semibold text-[#2f3440] dark:text-gray-200 w-12">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100 mb-4">AI Insights ✅</h2>
        <ul className="space-y-2">
          {aiInsights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-brand mt-1">•</span>
              <span className="text-[13px] text-[#2f3440] dark:text-gray-200">{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
