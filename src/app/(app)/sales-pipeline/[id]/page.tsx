"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Deal } from "@/types";
import { DealsApiClient } from "@/lib/api/clients/deals.client";
import { PipelineInfoHeader } from "@/components/sales-pipeline-info/pipeline-info-header";
import { PipelineInfoTopCard } from "@/components/sales-pipeline-info/pipeline-info-top-card";
import { PipelineInfoSection } from "@/components/sales-pipeline-info/pipeline-info-section";
import { PipelineInfoAgentRow } from "@/components/sales-pipeline-info/pipeline-info-agent-row";
import { PipelineInfoNotes } from "@/components/sales-pipeline-info/pipeline-info-notes";
import { PipelineInfoTimeline } from "@/components/sales-pipeline-info/pipeline-info-timeline";
import { PipelineInfoFooterActions } from "@/components/sales-pipeline-info/pipeline-info-footer-actions";
import { toast } from "react-hot-toast";

export default function SalesPipelineInformationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    const loadDeal = async () => {
      try {
        const fetchedDeal = await DealsApiClient.getById(id);
        setDeal(fetchedDeal);
      } catch (error) {
        console.error("Failed to load deal", error);
        setDeal(null);
      }
    };

    loadDeal();
  }, [params?.id]);

  const handleUpdateStage = async (newStage: "WON" | "LOST") => {
    if (!deal || !params?.id) return;
    setIsUpdating(true);
    const loadingToast = toast.loading(`Updating deal to ${newStage}...`);
    try {
      const updated = await DealsApiClient.update(params.id, { stage: newStage as any });
      setDeal(updated);
      toast.success(`Deal marked as ${newStage}!`, { id: loadingToast });
      setTimeout(() => {
        router.push("/sales-pipeline");
      }, 1000);
    } catch (error: any) {
      toast.error(error?.message || `Failed to update deal stage`, { id: loadingToast });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f5f6fb] dark:bg-[#0b0614]">
      <PipelineInfoHeader
        title="Sales Pipeline"
        subtitle="Manage and track your active sales cycles"
        action={
          <button
            type="button"
            onClick={() => router.push("/sales-pipeline/new")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-soft bg-brand px-4 text-[12px] font-semibold text-white shadow-button transition hover:bg-brand-dark"
          >
            <Plus size={14} />
            <span>+ Add Deal</span>
          </button>
        }
      />

      <div className="mx-auto w-full max-w-[980px] px-4 pb-10 pt-5 sm:px-6">
        <PipelineInfoTopCard
          title={deal?.clientName || "Sarah Jenkins"}
          rightAction={
            <button
              type="button"
              onClick={() => router.back()}
              className="grid h-7 w-7 place-items-center rounded-md text-[#8f93a1] transition hover:bg-[#f0f1f3] dark:text-gray-500 dark:hover:bg-[#1a0b2e]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          }
        >
          {deal && (
            <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm border border-gray-100 dark:bg-[#150a24] dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${deal.stage === 'WON' ? 'bg-emerald-500' : deal.stage === 'LOST' ? 'bg-rose-500' : 'bg-brand animate-pulse'}`} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{deal.course || "Enterprise Deal"}</h3>
                  <p className="text-xs text-gray-500 font-medium">Stage: <span className="uppercase font-bold text-brand">{deal.stage}</span> • Probability: {deal.probability}%</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-brand">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(deal.dealValue || 0)}
                </div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase">Deal Value</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <PipelineInfoSection title="Client Information">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
                    Email
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
                    {deal?.clientEmail || "s.jenkins@email.com"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
                    Phone
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
                    {deal?.clientPhone || "+1 (555) 000-2601"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
                    Course / Deal Name
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
                    {deal?.course || "Business English"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
                    Company
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-[#2f3440] dark:text-gray-200">
                    {deal?.clientCompany || "Enterprise Corp"}
                  </div>
                </div>
              </div>
            </PipelineInfoSection>

            <PipelineInfoSection title="Sales Agent Information" right={<span className="text-[10px] font-semibold text-[#a7a9b3]">Active</span>}>
              <PipelineInfoAgentRow
                name={deal?.salesAgent?.name || "Michael Chen"}
                role="Sales Agent"
                email={deal?.salesAgent?.email || "m.chen@dfluency.com"}
                dateLabel="Created"
                dateValue={deal?.date ? new Date(deal.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Oct 24, 2023"}
              />
            </PipelineInfoSection>

            <PipelineInfoSection title="Internal Notes" right={<span className="text-[10px] font-semibold text-[#a7a9b3]">3 Total</span>} className="lg:col-span-2">
              <PipelineInfoNotes
                notes={[
                  "Followed up via email regarding the trend pricing structure.",
                  "Waiting on feedback from the CFO.",
                  "Client expressed high interest in the custom module components during the demo."
                ]}
              />
            </PipelineInfoSection>

            <PipelineInfoSection title="Deal Timeline" className="lg:col-span-2">
              <PipelineInfoTimeline
                items={[
                  { title: `Stage Updated to ${deal?.stage || 'Proposal'}`, subtitle: "Today • 11:24 AM" },
                  { title: "Proposal Sent & Reviewed", subtitle: "Yesterday • 12:30 PM" },
                  { title: "Contact Made (Initial Call)", subtitle: "Oct 18 • 12:14 AM" },
                  { title: "Deal Created in Pipeline", subtitle: "Oct 10 • 4:31 AM" }
                ]}
              />
            </PipelineInfoSection>
          </div>

          <PipelineInfoFooterActions
            left={
              <button
                type="button"
                disabled={isUpdating || deal?.stage === 'LOST'}
                onClick={() => handleUpdateStage("LOST")}
                className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-soft border border-[#f2c7d6] bg-[#fdeef3] px-4 text-[11px] font-semibold text-[#b0144f] transition hover:bg-[#fbe3ec] dark:border-[#4a1a2d] dark:bg-[#2a0f1b] dark:text-[#f1a9c4] dark:hover:bg-[#32111f] disabled:opacity-50 ${deal?.stage === 'LOST' ? 'ring-2 ring-rose-500' : ''}`}
              >
                <AlertCircle size={14} /> Mark as Lost
              </button>
            }
            right={
              <button
                type="button"
                disabled={isUpdating || deal?.stage === 'WON'}
                onClick={() => handleUpdateStage("WON")}
                className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-soft bg-[#0b8f62] px-4 text-[11px] font-semibold text-white transition hover:bg-[#087a53] disabled:opacity-50 ${deal?.stage === 'WON' ? 'ring-2 ring-emerald-500 shadow-lg' : ''}`}
              >
                <CheckCircle2 size={14} /> Mark as Won
              </button>
            }
          />
        </PipelineInfoTopCard>
      </div>
    </div>
  );
}
