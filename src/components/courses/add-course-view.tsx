"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, ChevronDown, Link2, Loader2 } from "lucide-react";
import type { CreateCourseInput } from "@/lib/courses";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

const levelOptions: Array<CreateCourseInput["level"]> = ["beginner", "intermediate", "advanced"];

export function AddCourseView() {
  const router = useRouter();
  const { showToast } = useToast();
  const uploadRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CreateCourseInput>({
    name: "",
    description: "",
    category: "",
    level: "beginner",
    price: null,
    discount: null,
    currency: "USD",
    commission: null,
    salesTeam: "",
    targetSales: null,
    previewVideoUrl: ""
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return Boolean(
      form.name.trim() &&
      form.category.trim() &&
      form.salesTeam.trim() &&
      form.price !== null &&
      !Number.isNaN(form.price)
    );
  }, [form]);

  const updateField = <K extends keyof CreateCourseInput>(key: K, value: CreateCourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setForm({
      name: "",
      description: "",
      category: "",
      level: "beginner",
      price: null,
      discount: null,
      currency: "USD",
      commission: null,
      salesTeam: "",
      targetSales: null,
      previewVideoUrl: ""
    });
    setThumbnailFile(null);
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiFetch<{ success: boolean; data: any }>("/api/courses", {
        method: "POST",
        body: JSON.stringify({
          title: form.name.trim(),
          description: form.description.trim() || null,
          category: form.category || null,
          level: form.level.toUpperCase(),
          price: form.price ? Number(form.price) : 0,
          thumbnail: form.previewVideoUrl || null,
          status: "PUBLISHED"
        })
      });

      showToast("Course created successfully.", "success");
      router.push("/courses");
    } catch (error: any) {
      console.error(error);
      showToast(error?.message || "Unexpected error while creating the course.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <p className="text-[11px] text-[#9aa0ac] dark:text-gray-500">Dashboard &gt; Courses &gt; Add Course</p>
        <h1 className="mt-1 text-[42px] font-semibold leading-none text-[#21242e] dark:text-gray-100">Add New Course</h1>
        <p className="mt-2 text-[15px] text-[#707888] dark:text-gray-400">
          Create and configure a course for sales and performance tracking
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
            <h2 className="mb-4 flex items-center gap-2 text-[26px] font-semibold text-[#2b303b] dark:text-gray-100">
              <AlertCircle size={16} className="text-brand" />
              Basic Information
            </h2>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Course Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
                  placeholder="Enter course name"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Description</span>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="h-28 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 py-2 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
                  placeholder="Course description"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Category *</span>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => updateField("category", e.target.value)}
                      className="h-11 w-full appearance-none rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
                    >
                      <option value="">Select category</option>
                      <option value="Design">Design</option>
                      <option value="Development">Development</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8891a0]" />
                  </div>
                </label>
                <div>
                  <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Level</span>
                  <div className="grid h-11 grid-cols-3 overflow-hidden rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] dark:border-[#2a2f3a] dark:bg-[#0f0820]">
                    {levelOptions.map((level) => (
                      <button
                        key={level}
                        onClick={() => updateField("level", level)}
                        className={`text-[11px] font-semibold capitalize ${
                          form.level === level ? "text-brand" : "text-[#6f7787] dark:text-gray-400"
                        }`}
                        type="button"
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
            <h2 className="mb-4 text-[26px] font-semibold text-[#2b303b] dark:text-gray-100">Media</h2>
            <p className="mb-2 text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Upload Thumbnail</p>
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="grid h-64 w-full place-items-center rounded-soft border-2 border-dashed border-[#d9dde5] bg-[#f5f8fa] text-center dark:border-[#2a2f3a] dark:bg-[#0f0820]"
            >
              <div>
                <ImagePlus size={28} className="mx-auto text-[#a9b1bf]" />
                <p className="mt-2 text-[13px] font-medium text-[#646c7b] dark:text-gray-300">
                  {thumbnailFile ? thumbnailFile.name : "Click to upload thumbnail"}
                </p>
                <p className="mt-1 text-[11px] text-[#98a0ae] dark:text-gray-500">PNG, JPG (max. 5MB)</p>
              </div>
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
            <label className="mt-4 block">
              <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Preview Video Link</span>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa1af]" />
                <input
                  value={form.previewVideoUrl}
                  onChange={(e) => updateField("previewVideoUrl", e.target.value)}
                  className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] pl-9 pr-3 text-[13px] text-[#2f3440] outline-none dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-200"
                  placeholder="https://..."
                />
              </div>
            </label>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
            <h2 className="mb-4 text-[26px] font-semibold text-[#2b303b] dark:text-gray-100">Pricing & Sales</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Price *</span>
                <input
                  type="number"
                  value={form.price ?? ""}
                  onChange={(e) => updateField("price", e.target.value === "" ? null : Number(e.target.value))}
                  className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Discount</span>
                <input
                  type="number"
                  value={form.discount ?? ""}
                  onChange={(e) => updateField("discount", e.target.value === "" ? null : Number(e.target.value))}
                  className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Currency</span>
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={(e) => updateField("currency", e.target.value)}
                    className="h-11 w-full appearance-none rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="EGP">EGP (E£)</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8891a0]" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Commission (%)</span>
                <input
                  type="number"
                  value={form.commission ?? ""}
                  onChange={(e) => updateField("commission", e.target.value === "" ? null : Number(e.target.value))}
                  className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                  placeholder="0"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg2 border border-[#ececef] bg-white p-5 dark:border-[#2a2f3a] dark:bg-[#1a0b2e]">
            <h2 className="mb-4 text-[26px] font-semibold text-[#2b303b] dark:text-gray-100">Sales Settings</h2>
            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Assign Sales Team *</span>
              <input
                value={form.salesTeam}
                onChange={(e) => updateField("salesTeam", e.target.value)}
                className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                placeholder="Team name"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-semibold text-[#666e7d] dark:text-gray-400">Target Sales</span>
              <input
                type="number"
                value={form.targetSales ?? ""}
                onChange={(e) => updateField("targetSales", e.target.value === "" ? null : Number(e.target.value))}
                className="h-11 w-full rounded-soft border border-[#e5e7ee] bg-[#f7f8fb] px-3 text-[13px] dark:border-[#2a2f3a] dark:bg-[#0f0820]"
                placeholder="0"
              />
            </label>
          </section>

          <div className="flex justify-end gap-2">
            <Link
              href="/courses"
              className="inline-flex h-10 items-center rounded-soft border border-[#d9dde5] px-4 text-[12px] font-semibold text-[#646c7b] dark:border-[#2a2f3a] dark:text-gray-300"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center rounded-soft border border-[#d9dde5] px-4 text-[12px] font-semibold text-[#646c7b] dark:border-[#2a2f3a] dark:text-gray-300"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="inline-flex h-10 items-center rounded-soft bg-brand px-4 text-[12px] font-semibold text-white shadow-button disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : "Save Course"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
