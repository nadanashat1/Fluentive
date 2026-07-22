"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";

import { PipelineInfoHeader } from "@/components/sales-pipeline-info/pipeline-info-header";
import { AddDealCard } from "@/components/sales-pipeline-add-deal/add-deal-card";
import { AddDealSection } from "@/components/sales-pipeline-add-deal/add-deal-section";
import { AddDealTextField } from "@/components/sales-pipeline-add-deal/add-deal-text-field";
import { AddDealSelect } from "@/components/sales-pipeline-add-deal/add-deal-select";
import { AddDealTagGroup } from "@/components/sales-pipeline-add-deal/add-deal-tag-group";
import { AddDealTextarea } from "@/components/sales-pipeline-add-deal/add-deal-textarea";
import { AddDealFooter } from "@/components/sales-pipeline-add-deal/add-deal-footer";
import { apiFetch } from "@/lib/api-client";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source?: string | null;
};

type Priority = "hot" | "warm" | "cold";

type DealStage = "Lead" | "Qualification" | "Proposal" | "Negotiation";

type DealFormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  company: string;
  source: string;
  dealValue: string;
  timeline: string;
  dealStage: DealStage;
  assignment: string;
  course: string;
  internalNotes: string;
  nextFollowUpDate: string;
  additionalNotes: string;
};

export default function AddDealPage() {
  const router = useRouter();

  const sources = useMemo(() => ["Facebook Ads", "Website", "Instagram", "Referral"], []);
  const assignees = useMemo(() => ["Marcus Thorne", "Sarah Johnson", "John Smith"], []);
  const courses = useMemo(() => ["Executive Editorial Mastery 2024", "Full-Stack Web Dev", "Business English"], []);
  const stages = useMemo<DealStage[]>(() => ["Lead", "Qualification", "Proposal", "Negotiation"], []);

  const [priority, setPriority] = useState<Priority>("warm");
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [form, setForm] = useState<DealFormState>({
    fullName: "",
    phoneNumber: "",
    email: "",
    company: "",
    source: sources[0] || "",
    dealValue: "",
    timeline: "",
    dealStage: "Lead",
    assignment: assignees[0] || "",
    course: courses[0] || "",
    internalNotes: "",
    nextFollowUpDate: "",
    additionalNotes: ""
  });

  // Fetch leads on mount
  useEffect(() => {
    let mounted = true;
    setLeadsLoading(true);
    apiFetch<{ success: boolean; data: { leads: Lead[]; total: number } }>("/api/leads")
      .then((res) => {
        if (!mounted) return;
        setLeads(res.data?.leads || []);
      })
      .catch((err) => {
        console.error("Failed to load leads:", err);
      })
      .finally(() => {
        if (mounted) setLeadsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle lead selection - auto fill client info
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setForm((prev) => ({
        ...prev,
        fullName: lead.name || "",
        phoneNumber: lead.phone || "",
        email: lead.email || "",
        company: lead.source || ""
      }));
    }
  };

  const saveDeal = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const payload = {
        title: `${form.fullName}'s Deal - ${form.course}`,
        leadId: selectedLeadId || null,
        value: form.dealValue ? parseFloat(form.dealValue) : 0,
        stage: form.dealStage.toUpperCase(), // Backend expects uppercase for DealStage enum
        probability: priority === "hot" ? 90 : priority === "warm" ? 50 : 20,
        expectedCloseDate: form.timeline ? new Date(form.timeline).toISOString() : null,
        notes: form.internalNotes || form.additionalNotes || null,
        // Legacy fields for backward compatibility if needed, but primary ones are above
        clientName: form.fullName,
        course: form.course,
        email: form.email || undefined,
        phone: form.phoneNumber || undefined
      };

      const res = await apiFetch<{ success: true; data: { id: string } }>("/api/deals", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      router.push(`/sales-pipeline`); // Push to pipeline list after save
    } catch (error) {
      console.error("Failed to save deal:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#f5f6fb] dark:bg-[#0b0614]">
      <PipelineInfoHeader
        title="Add New Deal"
        subtitle="Create a new sales deal and assign it to your team"
        action={
          <button
            type="button"
            onClick={saveDeal}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-soft bg-brand px-4 text-[12px] font-semibold text-white shadow-button transition hover:bg-brand-dark"
          >
            <Plus size={14} />
            <span>{saving ? "Saving..." : "Add Deal"}</span>
          </button>
        }
      />

      <div className="mx-auto w-full max-w-[980px] px-4 pb-12 pt-5 sm:px-6">
        <div className="mb-3 text-[10px] font-medium text-[#9aa0ad]">
          <Link href="/dashboard" className="hover:text-[#707483]">
            Dashboard
          </Link>
          <span className="mx-1">/</span>
          <Link href="/sales-pipeline" className="hover:text-[#707483]">
            Sales Pipeline
          </Link>
          <span className="mx-1">/</span>
          <span className="text-[#707483]">Add Deal</span>
        </div>

        <AddDealCard>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AddDealSection title="Client Information" iconClassName="bg-[#f8ecff] text-[#8b0b45]">
              <div className="mb-3">
                <AddDealSelect
                  label="Select Lead (Auto-fill client info)"
                  options={leadsLoading ? ["Loading leads..."] : leads.length === 0 ? ["No leads found"] : leads.map((l) => `${l.name} | ${l.phone}`)}
                  value={selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ? `${leads.find((l) => l.id === selectedLeadId)!.name} | ${leads.find((l) => l.id === selectedLeadId)!.phone}` : "" : ""}
                  onChange={(value) => {
                    const lead = leads.find((l) => `${l.name} | ${l.phone}` === value);
                    if (lead) handleLeadSelect(lead.id);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddDealTextField
                  label="Full Name"
                  placeholder="e.g. Alexander Sterling"
                  name="fullName"
                  value={form.fullName}
                  onChange={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
                />
                <AddDealTextField
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))}
                />
                <AddDealTextField
                  label="Email (Optional)"
                  placeholder="alex@email.com"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                />
                <AddDealTextField
                  label="Company"
                  placeholder="Studio Agency"
                  name="company"
                  value={form.company}
                  onChange={(value) => setForm((prev) => ({ ...prev, company: value }))}
                />
              </div>

              <div className="mt-3">
                <AddDealSelect
                  label="How did they find you?"
                  options={sources}
                  value={form.source}
                  onChange={(value) => setForm((prev) => ({ ...prev, source: value }))}
                />
              </div>
            </AddDealSection>

            <AddDealSection title="Deal Details" iconClassName="bg-[#ffecef] text-[#b0144f]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddDealTextField
                  label="Deal Value"
                  leftAdornment="$"
                  placeholder="0.00"
                  name="dealValue"
                  value={form.dealValue}
                  onChange={(value) => setForm((prev) => ({ ...prev, dealValue: value }))}
                />
                <AddDealTextField
                  label="Timeline"
                  placeholder="mm/dd/yyyy"
                  name="timeline"
                  value={form.timeline}
                  onChange={(value) => setForm((prev) => ({ ...prev, timeline: value }))}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddDealSelect
                  label="Deal Stage"
                  options={stages}
                  value={form.dealStage}
                  onChange={(value) => setForm((prev) => ({ ...prev, dealStage: value as DealStage }))}
                />
                <div>
                  <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#a7a9b3]">
                    Deal Status
                  </div>
                  <AddDealTagGroup
                    value={priority}
                    onChange={setPriority}
                    options={[
                      { value: "hot", label: "Hot" },
                      { value: "warm", label: "Warm" },
                      { value: "cold", label: "Cold" }
                    ]}
                  />
                </div>
              </div>

              <div className="mt-3">
                <AddDealSelect
                  label="Assignment"
                  options={assignees}
                  value={form.assignment}
                  onChange={(value) => setForm((prev) => ({ ...prev, assignment: value }))}
                  leftSlot={
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-[10px] font-bold text-white">
                      M
                    </div>
                  }
                  rightIcon={<ChevronDown size={14} className="text-[#9aa0ad]" />}
                />
              </div>
            </AddDealSection>

            <AddDealSection title="Course" iconClassName="bg-[#e9f9ef] text-[#1d8a51]" className="lg:col-span-2">
              <AddDealSelect
                label="Select Course"
                options={courses}
                value={form.course}
                onChange={(value) => setForm((prev) => ({ ...prev, course: value }))}
              />
            </AddDealSection>

            <AddDealSection title="Internal Notes" iconClassName="bg-[#f3f6ff] text-[#3657d6]" className="lg:col-span-2">
              <AddDealTextarea
                placeholder="Record details about the interaction, customer pain points, and specific requirements..."
                value={form.internalNotes}
                onChange={(value) => setForm((prev) => ({ ...prev, internalNotes: value }))}
              />
            </AddDealSection>

            <AddDealSection title="Follow-up & Notes" iconClassName="bg-[#faf0ff] text-[#8b0b45]" className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddDealTextField
                  label="Next Follow-up Date"
                  placeholder="mm/dd/yyyy"
                  name="nextFollowUpDate"
                  value={form.nextFollowUpDate}
                  onChange={(value) => setForm((prev) => ({ ...prev, nextFollowUpDate: value }))}
                />
                <AddDealTextarea
                  label="Additional Notes"
                  placeholder="Mention any specific needs, preferred contact times, or previous interactions..."
                  value={form.additionalNotes}
                  onChange={(value) => setForm((prev) => ({ ...prev, additionalNotes: value }))}
                />
              </div>
            </AddDealSection>
          </div>

          <AddDealFooter
            left={
              <button
                type="button"
                onClick={() => router.back()}
                className="h-9 rounded-soft px-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#707483] transition hover:bg-[#f0f1f3] dark:text-gray-400 dark:hover:bg-[#1a0b2e]"
              >
                Cancel
              </button>
            }
            right={
              <button
                type="button"
                onClick={saveDeal}
                disabled={saving}
                className="h-9 rounded-soft bg-brand px-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-button transition hover:bg-brand-dark"
              >
                {saving ? "Saving..." : "Save Deal"}
              </button>
            }
          />
        </AddDealCard>
      </div>
    </div>
  );
}
