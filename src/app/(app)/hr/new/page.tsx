"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, User, Building, Briefcase, DollarSign, Calendar, Phone, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

export default function AddEmployeePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "Engineering",
    position: "Software Engineer",
    salary: "",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "ACTIVE"
  });

  const saveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      showToast("First name, last name, and email are required", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await apiFetch<{ success: boolean; data: any }>("/api/hr/employees", {
        method: "POST",
        body: JSON.stringify(form)
      });

      if (res.success) {
        showToast("Employee added successfully", "success");
        router.push("/hr");
      }
    } catch (error: any) {
      showToast(error?.message || "Failed to add employee", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f6fb] dark:bg-[#0b0614] pb-12">
      {/* Header Banner */}
      <div className="border-b border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#150a24] p-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="text-brand" size={24} /> Onboard New Employee
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter employee details to generate their profile and payroll record.
            </p>
          </div>
          <Link href="/hr" className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={saveEmployee} className="mx-auto mt-8 max-w-4xl px-4 sm:px-6">
        <div className="space-y-6 bg-white dark:bg-[#150a24] rounded-2xl border border-[#ececef] dark:border-[#2a2f3a] p-6 sm:p-8 shadow-sm">
          {/* Section 1: Personal Info */}
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-[#ececef] dark:border-[#2a2f3a] flex items-center gap-2">
              <User size={18} className="text-brand" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">First Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Elena"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rostova"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Work Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    placeholder="elena@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    placeholder="+1 (555) 234-5678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Compensation */}
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-[#ececef] dark:border-[#2a2f3a] flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" /> Role & Department
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Department</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition appearance-none"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Developer"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Annual Salary ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="number"
                    placeholder="120000"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={form.joinDate}
                    onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-[#dbc4cf] dark:border-[#2a2f3a] bg-[#fbfbfe] dark:bg-[#0b0614] text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[#ececef] dark:border-[#2a2f3a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-10 px-5 rounded-soft text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-soft bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 hover:bg-brand-dark transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {saving ? "Onboarding..." : "Onboard Employee"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
