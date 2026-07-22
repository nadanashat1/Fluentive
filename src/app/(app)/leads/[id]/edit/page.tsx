"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Lead } from "@/types";
import { getLeadById, updateLead } from "@/lib/leads-storage";
import { StatusBadge } from "@/components/leads/status-badge";

function Field({
  label,
  value,
  onChange,
  type = "text",
  error
}: {
  label: string;
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
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-soft border bg-[#f7f8fb] px-3 text-[12px] outline-none focus:border-[#cfd3de] ${
          error ? "border-[#d9534f]" : "border-[#e5e7ee]"
        }`}
      />
      {error ? <span className="text-[10px] font-semibold text-[#d9534f]">{error}</span> : null}
    </label>
  );
}

export default function EditLeadPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const statusOptions: Lead["status"][] = ["NEW", "CONTACTED", "QUALIFIED", "LOST"];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<Lead["status"]>("NEW");
  const [lastFollowUp, setLastFollowUp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setApiError(null);
      try {
        const res = await getLeadById(id);
        if (!alive) return;
        setLead(res || null);
      } catch (e) {
        if (!alive) return;
        setApiError(e instanceof Error ? e.message : "We couldn't load this lead. Let's try again.");
        setLead(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!lead) return;
    setName(lead.name);
    setPhone(lead.phone);
    setEmail(lead.email || "");
    setCourse(lead.course);
    setSource(lead.source || "");
    setStatus(lead.status);
    setLastFollowUp(lead.lastFollowUp || "");
  }, [lead]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Hey, we need a name!";
    if (!phone.trim()) next.phone = "We need a phone number.";
    if (!email.trim()) next.email = "We need an email address.";
    if (!course.trim()) next.course = "What course are they interested in?";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (loading) {
    return (
      <div className="rounded-soft border border-[#ececef] bg-white p-4 text-[13px] text-[#6f7481]">Getting things ready...</div>
    );
  }

  if (apiError) {
    return (
      <div className="rounded-soft border border-[#ececef] bg-white p-4 text-[13px] text-[#6f7481]">{apiError}</div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-soft border border-[#ececef] bg-white p-4 text-[13px] text-[#6f7481]">
        We couldn't find this lead. Maybe it was moved or deleted.
      </div>
    );
  }

  const handleSave = async () => {
    if (!validate()) return;
    setApiError(null);
    setLoading(true);
    try {
      await updateLead(lead.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        course: course.trim(),
        source: source.trim(),
        status,
        lastFollowUp: lastFollowUp ? new Date(lastFollowUp).toISOString() : undefined
      });
      router.push(`/leads/${lead.id}`);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "We couldn't update the lead. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold text-[#2a2f39]">Edit Lead</h1>
          <p className="text-[13px] text-[#8b8f9b]">Update lead info and save changes.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-soft border border-[#dbdde4] px-5 py-2 text-[12px] font-semibold text-[#5c6472]"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-soft bg-brand px-5 py-2 text-[12px] font-semibold text-white shadow-button"
            onClick={handleSave}
          >
            Save changes
          </button>
        </div>
      </div>

      <div className="rounded-lg2 border border-[#ececef] bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Full Name" value={name} onChange={setName} error={errors.name} />
          </div>
          <Field label="Phone Number" value={phone} onChange={setPhone} type="tel" error={errors.phone} />
          <Field label="Email Address" value={email} onChange={setEmail} type="email" error={errors.email} />
          <div className="sm:col-span-2">
            <Field label="Course / Interest" value={course} onChange={setCourse} error={errors.course} />
          </div>
          <Field label="Lead Source" value={source} onChange={setSource} />
          <Field label="Last Follow Up" value={lastFollowUp} onChange={setLastFollowUp} />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#8d92a0]">Lead Status</p>
          <div className="flex flex-wrap items-center gap-2 rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] p-3">
            {statusOptions.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Set status to ${s}`}
                onClick={() => setStatus(s)}
                className={status === s ? "" : "opacity-80"}
              >
                <StatusBadge
                  status={s}
                  className={status === s ? "ring-1 ring-brand/35 ring-offset-1 ring-offset-[#f7f8fb]" : ""}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

