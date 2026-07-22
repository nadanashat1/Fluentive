"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/leads/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import type { Lead } from "@/types";
import { apiFetch } from "@/lib/api-client";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg2 border border-[#ececef] bg-white p-4">
      <h2 className="mb-4 text-[14px] font-semibold text-[#303644]">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  error
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel";
  error?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8d92a0]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-soft border bg-[#f7f8fb] px-3 text-[12px] outline-none placeholder:text-[#a0a4b2] focus:border-[#cfd3de] ${
          error ? "border-[#d9534f]" : "border-[#e5e7ee]"
        }`}
      />
      {error ? <span className="text-[10px] font-semibold text-[#d9534f]">{error}</span> : null}
    </label>
  );
}

export default function AddLeadPage() {
  const router = useRouter();
  const sourceOptions = ["Facebook Ads", "Instagram", "Website", "Referral", "Other"] as const;
  
  // State declarations
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [courseInterest, setCourseInterest] = useState("");
  const [salesAgent, setSalesAgent] = useState("");
  const [leadSource, setLeadSource] = useState<(typeof sourceOptions)[number]>("Website");
  const [leadStatus, setLeadStatus] = useState<string>("NEW");
  const [estimatedValue, setEstimatedValue] = useState("0");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const statusOptions = ["NEW", "CONTACTED", "QUALIFIED", "LOST"];

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setEmail("");
    setCourseInterest("");
    setSalesAgent("");
    setLeadSource("Website");
    setLeadStatus("NEW");
    setEstimatedValue("0");
    setFollowUpDate("");
    setNotes("");
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!fullName.trim()) nextErrors.fullName = "Hey, we need a name!";
    if (!phone.trim()) nextErrors.phone = "We need a phone number.";
    if (!email.trim()) nextErrors.email = "We need an email address.";
    if (!courseInterest.trim()) nextErrors.courseInterest = "What course are they interested in?";
    if (!salesAgent.trim()) nextErrors.salesAgent = "Who should handle this lead?";
    if (!followUpDate) nextErrors.followUpDate = "When should we follow up?";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (isSubmitting || loading) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true);
    setApiError(null);
    
    try {
      const payload = {
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        course: courseInterest.trim(),
        source: leadSource,
        status: leadStatus,
        estimatedValue: parseFloat(estimatedValue) || 0,
        nextFollowUp: followUpDate ? new Date(followUpDate).toISOString() : null,
        notes: notes.trim() + (salesAgent.trim() ? `\nAssigned Agent (Reference): ${salesAgent.trim()}` : '')
      };

      const response = await apiFetch<{ success: true; data: Lead }>("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (response.success) {
        router.push("/leads");
      } else {
        throw new Error("Failed to create lead");
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "We couldn't create the lead. Try again?");
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[#9a9eaa]">Dashboard &gt; Leads &gt; Add Lead</p>
          <h1 className="text-[38px] font-semibold leading-none text-[#252b36]">Add New Lead</h1>
          <p className="mt-1 text-[12px] text-[#8e93a0]">
            Add a new potential customer and assign it to a sales agent for immediate follow-up and engagement.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton className="rounded-soft px-5 py-2 text-[12px] font-semibold text-[#606878]" onClick={resetForm}>
            Cancel
          </ActionButton>
          <ActionButton
            className="rounded-soft bg-brand px-5 py-2 text-[12px] font-semibold text-white shadow-button disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? "Saving..." : "Save this lead"}
          </ActionButton>
        </div>
      </div>

      {apiError ? (
        <div className="rounded-soft border border-[#ececef] bg-white p-4 text-[13px] text-[#6f7481]">{apiError}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card title="Information">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Full Name"
                  placeholder="e.g. Alexander Hamilton"
                  value={fullName}
                  onChange={setFullName}
                  error={errors.fullName}
                />
              </div>
              <Field
                label="Phone Number"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={setPhone}
                type="tel"
                error={errors.phone}
              />
              <Field
                label="Email Address"
                placeholder="alexander@editorial.com"
                value={email}
                onChange={setEmail}
                type="email"
                error={errors.email}
              />
              <Field
                label="Estimated Value ($)"
                placeholder="0"
                value={estimatedValue}
                onChange={setEstimatedValue}
                type="text"
              />
            </div>
          </Card>

          <Card title="Acquisition & Interest">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8d92a0]">Lead Source</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {sourceOptions.map((src) => (
                <ActionButton
                  key={src}
                  onClick={() => setLeadSource(src)}
                  className={`rounded-full border px-3 py-1 text-[11px] ${
                    leadSource === src ? "border-brand bg-brand text-white" : "border-[#e2e4ea] text-[#5f6674]"
                  }`}
                >
                  {src}
                </ActionButton>
              ))}
            </div>
            <Field
              label="Primary Course Interest"
              placeholder="Mastering Editorial Design (Q3 Bundle)"
              value={courseInterest}
              onChange={setCourseInterest}
              error={errors.courseInterest}
            />
          </Card>
        </div>

        <Card title="Assignment">
          <div className="space-y-3">
            <Field
              label="Assign Sales Agent"
              placeholder="Julianna Davenport (Senior Lead)"
              value={salesAgent}
              onChange={setSalesAgent}
              error={errors.salesAgent}
            />
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8d92a0]">Lead Status</span>
              <div className="flex flex-wrap items-center gap-2 rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] p-3">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setLeadStatus(status)}
                    className={leadStatus === status ? "" : "opacity-80 hover:opacity-100"}
                  >
                    <StatusBadge
                      status={status as any}
                      className={leadStatus === status ? "ring-1 ring-brand/35 ring-offset-1 ring-offset-[#f7f8fb]" : ""}
                    />
                  </button>
                ))}
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8d92a0]">Next Follow-Up Date</span>
              <div className="space-y-1">
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  className={`h-10 w-full rounded-soft border bg-[#f7f8fb] px-3 text-[12px] text-[#5f6674] outline-none focus:border-[#cfd3de] ${
                    errors.followUpDate ? "border-[#d9534f]" : "border-[#e5e7ee]"
                  }`}
                />
                {errors.followUpDate ? (
                  <span className="text-[10px] font-semibold text-[#d9534f]">{errors.followUpDate}</span>
                ) : null}
              </div>
            </label>
          </div>
        </Card>
      </div>

      <Card title="Internal Lead Notes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="h-28 w-full resize-none rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] p-3 text-[12px] outline-none placeholder:text-[#a0a4b2]"
          placeholder="Record specific needs, conversation snippets, or particular pain points the lead mentioned during initial contact..."
        />
        <div className="mt-2 flex items-center justify-between text-[10px] text-[#9aa0ac]">
          <span>Only visible to sales agents and admins</span>
          <span>{notes.length} / 2000 characters</span>
        </div>
      </Card>
    </div>
  );
}
