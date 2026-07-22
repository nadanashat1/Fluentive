"use client";

import { useEffect, useState, Suspense } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle, Users, Mail, Copy, Send, Check, ArrowRight, UserCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

interface RevenueForecast {
  period: string;
  predicted: number;
  actual: number;
}

interface ChurnRisk {
  leadId: string;
  leadName: string;
  churnRisk: string;
  churnProbability: number;
  estimatedLossValue: number;
  daysUntilLikelyChurn: number;
  riskFactors: string[];
}

interface Duplicate {
  id: string;
  name: string;
  email: string;
  phone: string;
  matchConfidence: number;
  suggestedAction: string;
}

interface LeadAssignment {
  leadId: string;
  leadName: string;
  company: string;
  currentOwner: string;
  recommendedOwner: string;
  recommendedOwnerId: string;
  confidence: number;
  reason: string;
}

interface EmailSuggestion {
  leadId: string;
  leadName: string;
  email: string;
  subject: string;
  body: string;
  tone: string;
  confidence: number;
}

function AdvancedClientContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get("tab") as any) || "revenue";

  const [revenueForecast, setRevenueForecast] = useState<RevenueForecast[]>([]);
  const [churnRisks, setChurnRisks] = useState<ChurnRisk[]>([]);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [assignments, setAssignments] = useState<LeadAssignment[]>([]);
  const [emailSuggestions, setEmailSuggestions] = useState<EmailSuggestion[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"revenue" | "churn" | "assignment" | "duplicates" | "emails">(
    ["revenue", "churn", "assignment", "duplicates", "emails"].includes(initialTab) ? initialTab : "revenue"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ status: "success"; data: any }>("/api/ai/overview");
        const data = res?.data;

        setRevenueForecast(data?.forecast?.forecast || []);
        setChurnRisks(data?.churn?.leads || []);
        setDuplicates(data?.duplicates?.duplicates || []);
        setAssignments(data?.assignments || []);
        setEmailSuggestions(data?.suggestions || []);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError("We couldn't load the advanced AI data. Let's try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMergeDuplicate = async (duplicateId: string, action: 'merge' | 'dismiss') => {
    setActionLoading(duplicateId);
    try {
      await apiFetch("/api/ai/advanced/duplicates", {
        method: "POST",
        body: JSON.stringify({ duplicateId, action })
      });
      setDuplicates(prev => prev.filter(d => d.id !== duplicateId));
      toast.success(action === 'merge' ? "Duplicate records merged successfully!" : "Duplicate alert dismissed.");
    } catch (e) {
      toast.error("Failed to process duplicate action.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAssignment = async (leadId: string, ownerId: string) => {
    setActionLoading(leadId);
    try {
      await apiFetch("/api/ai/advanced/lead-assignment", {
        method: "POST",
        body: JSON.stringify({ leadId, ownerId })
      });
      setAssignments(prev => prev.filter(a => a.leadId !== leadId));
      toast.success("Lead assigned successfully!");
    } catch (e) {
      toast.error("Failed to assign lead.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async (leadId: string) => {
    setActionLoading(leadId);
    try {
      await apiFetch("/api/ai/advanced/email-suggestions", {
        method: "POST",
        body: JSON.stringify({ leadId })
      });
      toast.success("Personalized outreach email queued for dispatch!");
    } catch (e) {
      toast.error("Failed to send outreach email.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyEmail = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Email body copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

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
      <div>
        <h1 className="text-3xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-3">
          Advanced AI Engine <Sparkles className="text-brand" size={28} />
        </h1>
        <p className="mt-1 text-[15px] text-[#8b8f9b] dark:text-gray-400">
          Deep learning models for forecasting, risk detection, smart assignment, and automated outreach.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e7e9ef] dark:border-[#2a2f3a]">
        {[
          { id: "revenue", label: "Revenue Forecast", icon: <TrendingUp size={16} /> },
          { id: "churn", label: "Churn Analysis", icon: <AlertTriangle size={16} /> },
          { id: "assignment", label: "Lead Assignment", icon: <Users size={16} /> },
          { id: "duplicates", label: "Duplicate Detection", icon: <ShieldCheck size={16} /> },
          { id: "emails", label: "Email Suggestions", icon: <Mail size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-[14px] font-bold transition-colors relative ${
              activeTab === tab.id
                ? "text-brand"
                : "text-[#646b7a] hover:text-[#2f3440] dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* REVENUE FORECAST TAB */}
        {activeTab === "revenue" && (
          <motion.div 
            key="revenue"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#ececef] bg-white p-6 shadow-sm dark:border-[#2a2f3a] dark:bg-[#150a24]"
          >
            <h2 className="mb-6 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" /> AI Revenue Forecast Model
            </h2>
            <div className="space-y-4">
              {revenueForecast.length > 0 ? (
                revenueForecast.map((item, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={item.period}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#e7e9ef] bg-gradient-to-r from-gray-50 to-white p-5 shadow-sm dark:border-[#2a2f3a] dark:from-[#1a0b2e] dark:to-[#150a24]"
                  >
                    <div>
                      <p className="text-[16px] font-bold text-[#2f3440] dark:text-gray-100">{item.period}</p>
                      <p className="text-[13px] font-medium text-[#6b7280] dark:text-gray-400">Machine learning pipeline probability prediction</p>
                    </div>
                    <div className="flex items-center gap-6 self-end sm:self-auto">
                      <div className="text-right bg-emerald-50 dark:bg-emerald-900/10 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                        <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">${item.predicted.toLocaleString()}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/70 dark:text-emerald-500/70">Predicted</p>
                      </div>
                      <div className="text-right px-4 py-2">
                        <p className="text-[16px] font-bold text-gray-400 dark:text-gray-500">${item.actual?.toLocaleString() || 0}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Actual Realized</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-[#6b7280] dark:text-gray-400 bg-gray-50 dark:bg-[#1a0b2e] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  No revenue forecast data available yet.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CHURN ANALYSIS TAB */}
        {activeTab === "churn" && (
          <motion.div 
            key="churn"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#ececef] bg-white p-6 shadow-sm dark:border-[#2a2f3a] dark:bg-[#150a24]"
          >
            <h2 className="mb-6 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="text-red-500" /> Pipeline Churn & Risk Detection
            </h2>
            <div className="space-y-4">
              {churnRisks.length > 0 ? (
                churnRisks.map((risk, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={risk.leadId}
                    className="rounded-xl border border-red-100 bg-red-50/50 p-5 shadow-sm dark:border-red-900/30 dark:bg-red-900/10 hover:border-red-200 transition-colors relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-red-400 dark:bg-red-500"></div>
                    <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-[16px] font-bold text-red-900 dark:text-red-100">{risk.leadName}</p>
                        <p className="text-[12px] font-semibold text-red-700 dark:text-red-400">Est. Pipeline Loss: ${risk.estimatedLossValue?.toLocaleString()}</p>
                      </div>
                      <span className="self-start sm:self-auto rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 px-3 py-1 text-[13px] font-bold shadow-sm border border-red-200 dark:border-red-800">
                        {risk.churnRisk} Risk ({Math.round(risk.churnProbability * 100)}% Probability)
                      </span>
                    </div>
                    <div className="bg-white dark:bg-[#1a0b2e] rounded-lg p-3 text-[13px] text-red-800/80 dark:text-red-200/70 border border-red-100 dark:border-red-900/20 font-medium flex items-center gap-2">
                      <AlertTriangle size={14} className="text-red-500 shrink-0" />
                      <span>Risk factors: <strong className="font-bold text-red-900 dark:text-red-100">{risk.riskFactors?.join(", ") || "No recent engagement"}</strong></span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800/30 font-bold">
                  <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                  No high-risk churn candidates detected right now. Your pipeline is healthy!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* LEAD ASSIGNMENT TAB */}
        {activeTab === "assignment" && (
          <motion.div 
            key="assignment"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#ececef] bg-white p-6 shadow-sm dark:border-[#2a2f3a] dark:bg-[#150a24]"
          >
            <h2 className="mb-6 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              <Users className="text-blue-500" /> Smart Lead Assignment Recommendations
            </h2>
            <div className="space-y-4">
              {assignments.length > 0 ? (
                assignments.map((assign, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={assign.leadId}
                    className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-white p-5 shadow-sm dark:border-blue-900/30 dark:from-[#1a0b2e] dark:to-[#150a24]"
                  >
                    <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-bold text-[#2f3440] dark:text-gray-100">{assign.leadName}</p>
                        <p className="text-[13px] font-medium text-[#6b7280] dark:text-gray-400 mt-0.5">{assign.company} • Current: <span className="font-semibold text-gray-700 dark:text-gray-300">{assign.currentOwner}</span></p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 text-[13px] font-bold shadow-sm border border-blue-200 dark:border-blue-800/50 flex items-center gap-1.5">
                          <Sparkles size={12} className="text-brand" /> {assign.confidence}% Match
                        </span>
                        <button
                          onClick={() => handleApproveAssignment(assign.leadId, assign.recommendedOwnerId)}
                          disabled={actionLoading === assign.leadId}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-brand text-white text-xs font-bold rounded-soft shadow-sm hover:bg-brand-dark transition-all disabled:opacity-50"
                        >
                          <UserCheck size={14} /> {actionLoading === assign.leadId ? "Assigning..." : `Assign to ${assign.recommendedOwner.split(' ')[0]}`}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30 text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-brand/10 text-brand rounded font-bold uppercase text-[10px]">AI Rationale</span>
                      <span>{assign.reason}</span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a0b2e] rounded-xl border border-dashed border-gray-200 dark:border-gray-700 font-medium">
                  <CheckCircle className="mx-auto mb-2 opacity-50" size={32} />
                  All active leads are currently optimally assigned across your sales representatives!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* DUPLICATES DETECTION TAB */}
        {activeTab === "duplicates" && (
          <motion.div 
            key="duplicates"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#ececef] bg-white p-6 shadow-sm dark:border-[#2a2f3a] dark:bg-[#150a24]"
          >
            <h2 className="mb-6 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="text-purple-500" /> Database Integrity & Duplicate Detection
            </h2>
            <div className="space-y-4">
              {duplicates.length > 0 ? (
                duplicates.map((dup, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={dup.id}
                    className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-white p-5 shadow-sm dark:border-purple-900/30 dark:from-[#1a0b2e] dark:to-[#150a24]"
                  >
                    <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-bold text-[#2f3440] dark:text-gray-100">{dup.name}</p>
                        <p className="text-[13px] font-medium text-[#6b7280] dark:text-gray-400 mt-0.5">{dup.email} • {dup.phone}</p>
                      </div>
                      <span className="self-start sm:self-auto rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-3 py-1 text-[13px] font-bold shadow-sm border border-purple-200 dark:border-purple-800/50">
                        {dup.matchConfidence}% Match Confidence
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/30">
                       <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Suggested: <strong className="font-bold text-gray-700 dark:text-gray-200">{dup.suggestedAction}</strong></span>
                       <div className="flex items-center gap-3">
                         <button
                           onClick={() => handleMergeDuplicate(dup.id, 'merge')}
                           disabled={actionLoading === dup.id}
                           className="px-4 py-1.5 bg-purple-600 text-white rounded-soft text-xs font-bold shadow-sm hover:bg-purple-700 transition-all disabled:opacity-50"
                         >
                           {actionLoading === dup.id ? "Processing..." : "Merge Records"}
                         </button>
                         <button
                           onClick={() => handleMergeDuplicate(dup.id, 'dismiss')}
                           disabled={actionLoading === dup.id}
                           className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                         >
                           Dismiss
                         </button>
                       </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800/30 font-bold">
                  <ShieldCheck className="mx-auto mb-2 opacity-50" size={32} />
                  Database is fully clean. No duplicate contact records found!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* EMAIL SUGGESTIONS TAB */}
        {activeTab === "emails" && (
          <motion.div 
            key="emails"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-[#ececef] bg-white p-6 shadow-sm dark:border-[#2a2f3a] dark:bg-[#150a24]"
          >
            <h2 className="mb-6 text-xl font-bold text-[#2f3440] dark:text-gray-100 flex items-center gap-2">
              <Mail className="text-brand" /> AI Personalized Outreach Email Generator
            </h2>
            <div className="space-y-6">
              {emailSuggestions.length > 0 ? (
                emailSuggestions.map((email, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    key={email.leadId}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a0b2e] p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-[16px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>To: {email.leadName}</span>
                          <span className="text-xs text-gray-400 font-normal">({email.email})</span>
                        </p>
                        <p className="text-sm font-semibold text-brand mt-0.5">Subject: {email.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-2.5 py-1 bg-brand/10 text-brand rounded-full text-[11px] font-bold uppercase tracking-wider border border-brand/20 shadow-sm">
                          {email.tone} ({email.confidence}% Fit)
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#0f0820] p-4 rounded-xl text-sm leading-relaxed text-gray-700 dark:text-gray-300 font-mono whitespace-pre-line border border-gray-100 dark:border-gray-800/80">
                      {email.body}
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleCopyEmail(email.leadId, email.body)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-soft text-xs font-bold transition-all"
                      >
                        {copiedId === email.leadId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === email.leadId ? "Copied!" : "Copy Body"}
                      </button>
                      <button
                        onClick={() => handleSendEmail(email.leadId)}
                        disabled={actionLoading === email.leadId}
                        className="flex items-center gap-1.5 px-5 py-2 bg-brand text-white hover:bg-brand-dark rounded-soft text-xs font-bold shadow-md shadow-brand/20 transition-all disabled:opacity-50"
                      >
                        <Send size={14} /> {actionLoading === email.leadId ? "Sending..." : "Dispatch Email"}
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a0b2e] rounded-xl border border-dashed border-gray-200 dark:border-gray-700 font-medium">
                  No email outreach suggestions generated.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdvancedClient() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading AI Command Center...</div>}>
      <AdvancedClientContent />
    </Suspense>
  );
}
