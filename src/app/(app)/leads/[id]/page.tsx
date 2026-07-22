"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/leads/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { typedApi } from "@/services/typed-api.service";
import { 
  Brain, Mail, MessageSquare, Sparkles, Clock, Edit, User, 
  CheckCircle, AlertCircle, X, Plus, Paperclip, Download, 
  RefreshCw, Printer, ArrowLeft, MoreVertical, DollarSign, Target,
  Phone, Building2, History
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { LeadNotes } from "@/components/lead-notes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LeadStatus, DealStage } from "@prisma/client";

export default function LeadDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { data: leadResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => typedApi.leads.get(id),
    enabled: !!id,
  });

  const lead = leadResponse?.data;

  const convertToDealMutation = useMutation({
    mutationFn: async () => {
      if (!lead) return;
      return typedApi.deals.create({
        title: `Deal: ${lead.name}`,
        value: lead.estimatedValue || 0,
        stage: DealStage.DISCOVERY,
        leadId: lead.id,
      });
    },
    onSuccess: (data: any) => {
      showToast("Lead converted to deal successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      router.push(`/sales-pipeline`);
    },
    onError: () => {
      showToast("Failed to convert lead to deal", "error");
    }
  });

  useEffect(() => {
    if (lead) {
      setTags(lead.tags || []);
    }
  }, [lead]);

  const handleSaveTags = async () => {
    try {
      await typedApi.leads.update(id, { tags });
      showToast("Tags updated", "success");
      setEditingTags(false);
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    } catch (e) {
      showToast("Failed to update tags", "error");
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading lead details...</div>;
  if (error || !lead) return <div className="p-8 text-center text-rose-500">Lead not found</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between">
        <Link href="/leads" className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand transition-colors">
          <ArrowLeft size={16} />
          Back to Leads
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => refetch()} className="p-2 text-gray-400 hover:text-brand transition-colors">
            <RefreshCw size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-brand transition-colors">
            <Printer size={20} />
          </button>
          <Link href={`/leads/${id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-soft text-sm font-semibold hover:border-brand transition-all">
            <Edit size={16} />
            Edit Profile
          </Link>
          <button 
            onClick={() => convertToDealMutation.mutate()}
            disabled={convertToDealMutation.isPending || lead.status === LeadStatus.CONVERTED}
            className="flex items-center gap-2 px-5 py-2 bg-brand text-white rounded-soft text-sm font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            <Target size={16} />
            {lead.status === LeadStatus.CONVERTED ? 'Already Converted' : 'Convert to Deal'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <section className="bg-white dark:bg-[#1a0b2e] border border-gray-100 dark:border-[#2a2f3a] rounded-xl2 p-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold border-2 border-brand/20 shadow-inner">
                {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
                  <StatusBadge status={lead.status} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                  <Building2 size={14} />
                  {lead.company || 'Private Individual'} • {lead.source}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                   <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-full border border-emerald-100 dark:border-emerald-800 flex items-center gap-1.5">
                      <Sparkles size={12} />
                      AI Score: {lead.aiScore ?? 'N/A'}
                   </div>
                   <div className="px-3 py-1 bg-brand/5 text-brand text-[11px] font-bold rounded-full border border-brand/10 flex items-center gap-1.5">
                      <Clock size={12} />
                      Stage: {lead.pipelineStage?.replace(/_/g, ' ') || 'New'}
                   </div>
                   {lead.estimatedValue && (
                     <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold rounded-full border border-amber-100 dark:border-amber-800 flex items-center gap-1.5">
                        <DollarSign size={12} />
                        Est. Value: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.estimatedValue)}
                     </div>
                   )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0f0820] border border-gray-100 dark:border-[#2a2f3a]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Information</p>
                  <div className="space-y-2">
                     <p className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Mail size={14} className="text-brand/60" />
                        {lead.email}
                     </p>
                     <p className="text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Phone size={14} className="text-brand/60" />
                        {lead.phone}
                     </p>
                  </div>
               </div>
               <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#0f0820] border border-gray-100 dark:border-[#2a2f3a]">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assignment</p>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {lead.owner?.name?.[0] || 'U'}
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{lead.owner?.name || 'Unassigned'}</p>
                        <p className="text-[11px] text-gray-500">Assigned Sales Representative</p>
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="bg-white dark:bg-[#1a0b2e] border border-gray-100 dark:border-[#2a2f3a] rounded-xl2 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="text-brand" size={20} />
              Lead Notes
            </h3>
            <LeadNotes leadId={id} />
          </section>
        </div>

        {/* Right Column: Activity & Metadata */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <section className="bg-white dark:bg-[#1a0b2e] border border-gray-100 dark:border-[#2a2f3a] rounded-xl2 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={16} className="text-brand" />
              Activity History
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {lead.activities && lead.activities.length > 0 ? (
                 lead.activities.map((activity: any, idx: number) => (
                   <div key={activity.id} className="relative pl-6 pb-4 last:pb-0 border-l border-gray-100 dark:border-[#2a2f3a]">
                      <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-brand" />
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{activity.description}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(activity.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {activity.user && ` • by ${activity.user.name}`}
                      </p>
                   </div>
                 ))
               ) : (
                 <p className="text-xs text-gray-500 text-center py-4 italic">No interactions recorded yet</p>
               )}
            </div>
          </section>

          {/* Tags Card */}
          <section className="bg-white dark:bg-[#1a0b2e] border border-gray-100 dark:border-[#2a2f3a] rounded-xl2 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tags</h3>
                <button 
                  onClick={() => editingTags ? handleSaveTags() : setEditingTags(true)}
                  className="text-[11px] font-bold text-brand hover:underline"
                >
                  {editingTags ? 'Save' : 'Edit'}
                </button>
             </div>
             {editingTags ? (
               <div className="space-y-2">
                 <input 
                   type="text" 
                   value={newTag}
                   onChange={(e) => setNewTag(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && (setTags([...tags, newTag]), setNewTag(''))}
                   placeholder="New tag..."
                   className="w-full px-2 py-1 text-xs border rounded-soft outline-none focus:border-brand"
                 />
                 <div className="flex flex-wrap gap-1">
                   {tags.map(t => (
                     <span key={t} className="px-2 py-0.5 bg-brand/5 text-brand text-[10px] rounded flex items-center gap-1">
                       {t}
                       <X size={10} className="cursor-pointer" onClick={() => setTags(tags.filter(tag => tag !== t))} />
                     </span>
                   ))}
                 </div>
               </div>
             ) : (
               <div className="flex flex-wrap gap-1">
                 {tags.length > 0 ? tags.map(t => (
                   <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] rounded">
                     {t}
                   </span>
                 )) : <p className="text-xs text-gray-500 italic">No tags assigned</p>}
               </div>
             )}
          </section>
        </div>
      </div>
    </div>
  );
}

