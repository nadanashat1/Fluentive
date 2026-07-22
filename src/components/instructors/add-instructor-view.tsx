"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, X } from "lucide-react";
import { instructorFormMock } from "@/data/instructors";
import { GhostButton, Panel, PrimaryButton, Segmented, Switch, Title } from "@/components/instructors/instructors.ui";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-soft border border-[#e1e3e9] bg-white px-3 text-[13px] text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]",
        props.className || ""
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={[
          "h-10 w-full appearance-none rounded-soft border border-[#e1e3e9] bg-white px-3 pr-9 text-[13px] text-[#2f3440] outline-none focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200 dark:focus:border-[#840A36]",
          props.className || ""
        ].join(" ")}
      />
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0ad]" />
    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-[96px] w-full resize-none rounded-soft border border-[#e1e3e9] bg-white px-3 py-2.5 text-[13px] text-[#2f3440] outline-none placeholder:text-[#a1a5b2] focus:border-[#c6cada] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#840A36]",
        props.className || ""
      ].join(" ")}
    />
  );
}

export function AddInstructorView() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [specialization, setSpecialization] = useState("Strategy Management");

  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    "Advanced Logic Systems",
    "Behavioral Design 101",
    "Strategic Negotiation"
  ]);
  const [paymentType, setPaymentType] = useState("commission");
  const [tracking, setTracking] = useState(true);
  const [status, setStatus] = useState("active");

  const availableCourses = useMemo(() => instructorFormMock.courseOptions, []);

  const saveInstructor = async () => {
    if (saving) return;
    if (!name.trim() || !email.trim()) {
      showToast("Full name and email address are required", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        expertise: [specialization, ...selectedCourses]
      };

      const res = await apiFetch<{ success: boolean }>("/api/instructors", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (res.success) {
        showToast("Instructor created successfully", "success");
        router.push("/instructors");
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to create instructor", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9aa0ad] dark:text-gray-500">
            Dashboard / Instructors / Add Instructor
          </div>
          <Title className="mt-2">Add New Instructor</Title>
          <div className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">
            Create and assign an instructor with courses and revenue settings
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/instructors">
            <GhostButton className="px-4">Cancel</GhostButton>
          </Link>
          <PrimaryButton onClick={saveInstructor} disabled={saving}>
            {saving ? "Saving..." : "Save Instructor"}
          </PrimaryButton>
        </div>
      </div>

      <Panel className="p-0 overflow-hidden">
        <div className="border-b border-[#eef0f4] px-6 py-4 dark:border-[#2a2f3a]">
          <div className="flex items-center gap-2">
            <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Basic Information</div>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Full Name *</FieldLabel>
                <TextInput placeholder="e.g. Dr. Julien Vance" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <FieldLabel>Specialization</FieldLabel>
                <Select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                  {instructorFormMock.specializations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <TextInput placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <FieldLabel>Email Address *</FieldLabel>
                <TextInput placeholder="alexander@editorial.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <FieldLabel>Instructor Bio</FieldLabel>
              <Textarea placeholder="Brief professional overview and academic background..." value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg2 border border-dashed border-[#e6e7eb] bg-[#fafafd] p-4 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
            <div className="grid min-h-[240px] place-items-center rounded-lg2 border border-dashed border-[#e6e7eb] dark:border-[#2a2f3a]">
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm dark:bg-[#1a0b2e]">
                  <Camera size={18} className="text-[#9aa0ad]" />
                </div>
                <div className="mt-3 text-[12px] font-semibold text-[#2f3440] dark:text-gray-200">Upload Profile Image</div>
                <div className="mt-1 text-[11px] text-[#9aa0ad]">PNG, JPG up to 5 MB</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#eef0f4] px-6 py-4 dark:border-[#2a2f3a]">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Course Assignment</div>
        </div>

        <div className="px-6 pb-6">
          <div>
            <FieldLabel>Select Courses</FieldLabel>
            <Select
              value=""
              onChange={(e) => {
                const next = e.target.value;
                if (!next) return;
                setSelectedCourses((prev) => (prev.includes(next) ? prev : [...prev, next]));
              }}
            >
              <option value="">Search and select courses...</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCourses.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand"
              >
                {c}
                <button
                  type="button"
                  onClick={() => setSelectedCourses((prev) => prev.filter((x) => x !== c))}
                  className="grid h-4 w-4 place-items-center rounded-full bg-white/70 hover:bg-white"
                  aria-label={`Remove ${c}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eef0f4] px-6 py-4 dark:border-[#2a2f3a]">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Revenue &amp; Payment</div>
        </div>

        <div className="grid gap-5 px-6 py-5 md:grid-cols-2">
          <div>
            <FieldLabel>Revenue Share (%)</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={25}
                className="w-full accent-[#8b0b45]"
              />
              <div className="w-12 text-right text-[13px] font-semibold text-[#2f3440] dark:text-gray-100">25</div>
            </div>
          </div>
          <div>
            <FieldLabel>Payment Type</FieldLabel>
            <Segmented
              value={paymentType}
              onChange={setPaymentType}
              options={[
                { value: "commission", label: "Commission" },
                { value: "fixed", label: "Fixed Fee" }
              ]}
            />
          </div>
          <div>
            <FieldLabel>Base Salary ($)</FieldLabel>
            <TextInput defaultValue="5,000.00" />
          </div>
        </div>

        <div className="border-t border-[#eef0f4] px-6 py-4 dark:border-[#2a2f3a]">
          <div className="text-[14px] font-semibold text-[#2f3440] dark:text-gray-100">Sales &amp; Status</div>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <div>
            <FieldLabel>Assign Sales Team</FieldLabel>
            <div className="flex items-center gap-2">
              {instructorFormMock.salesTeam.map((m) => (
                <div key={m.id} className="grid h-8 w-8 place-items-center rounded-full bg-[#111827] text-[11px] font-bold text-white">
                  {m.initials}
                </div>
              ))}
              <div className="grid h-8 w-8 place-items-center rounded-full border border-[#e1e3e9] bg-white text-[11px] font-bold text-[#646b7a] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-400">
                +
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg2 border border-[#eef0f4] bg-[#fafbfd] px-4 py-3 dark:border-[#2a2f3a] dark:bg-[#0f0820]">
              <div>
                <div className="text-[12px] font-semibold text-[#2f3440] dark:text-gray-100">Performance Tracking</div>
                <div className="text-[11px] text-[#9aa0ad]">Sales-department analytics</div>
              </div>
              <Switch checked={tracking} onChange={setTracking} />
            </div>
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Panel>
    </div>
  );
}
