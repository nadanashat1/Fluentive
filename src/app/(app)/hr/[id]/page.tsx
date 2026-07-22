"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, User, Mail, Phone, Building, Calendar, DollarSign, 
  CheckCircle, Clock, FileText, AlertCircle, Trash2, Edit3, Save, X, Plus
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "leaves">("overview");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    position: "",
    salary: "",
    status: "ACTIVE"
  });

  const { data: employeeData, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await apiFetch(`/api/hr/employees/${id}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return await apiFetch(`/api/hr/employees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updatedData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      showToast("Employee details updated successfully", "success");
      setEditing(false);
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to update employee", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiFetch(`/api/hr/employees/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      showToast("Employee deleted successfully", "success");
      router.push("/hr");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to delete employee", "error");
    }
  });

  const handleStartEdit = () => {
    if (employeeData) {
      setEditForm({
        firstName: employeeData.firstName || "",
        lastName: employeeData.lastName || "",
        phone: employeeData.phone || "",
        position: employeeData.position || "",
        salary: employeeData.salary ? String(employeeData.salary) : "",
        status: employeeData.status || "ACTIVE"
      });
      setEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({
      ...editForm,
      salary: editForm.salary ? Number(editForm.salary) : null
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#f5f6fb] dark:bg-[#0b0614]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="text-sm font-semibold text-gray-500">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-[#f5f6fb] dark:bg-[#0b0614]">
        <div className="rounded-2xl bg-white dark:bg-[#150a24] p-8 border border-gray-200 dark:border-gray-800 shadow-xl">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Employee Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The employee record you are looking for does not exist or has been deleted.</p>
          <Link href="/hr" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-soft bg-brand font-bold text-white shadow-lg text-sm">
            <ArrowLeft size={16} /> Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex h-full flex-col bg-[#f5f6fb] dark:bg-[#0b0614] overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 md:p-8 space-y-6 pb-16">
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Link href="/hr" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand transition-colors">
            <ArrowLeft size={16} /> Back to Human Resources
          </Link>
          <div className="flex items-center gap-3">
            {!editing ? (
              <>
                <button 
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-soft bg-white dark:bg-[#150a24] border border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-800 dark:text-gray-200 shadow-sm hover:border-brand/50 transition-all"
                >
                  <Edit3 size={16} className="text-brand" /> Edit Profile
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to archive this employee?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-soft bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 font-bold text-sm text-red-600 dark:text-red-400 shadow-sm hover:bg-red-100 transition-all"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-soft bg-white dark:bg-[#150a24] border border-gray-200 dark:border-gray-800 font-bold text-sm text-gray-600 dark:text-gray-400"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-soft bg-brand font-bold text-sm text-white shadow-lg shadow-brand/20 hover:bg-brand-dark disabled:opacity-50"
                >
                  <Save size={16} /> Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Card / Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#150a24] border border-gray-200 dark:border-gray-800 shadow-xl p-6 md:p-8">
          <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-bl from-brand/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-extrabold text-white shadow-lg ring-8 ring-indigo-50 dark:ring-indigo-950/30 shrink-0">
              {employeeData.firstName?.charAt(0)}{employeeData.lastName?.charAt(0)}
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                  {employeeData.firstName} {employeeData.lastName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  employeeData.status === 'ACTIVE' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                }`}>
                  {employeeData.status}
                </span>
              </div>

              <p className="text-brand font-bold text-base md:text-lg">
                {employeeData.position || 'General Employee'}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <Building size={16} className="text-gray-400 shrink-0" />
                  <span>Department: {employeeData.department}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Mail size={16} className="text-gray-400 shrink-0" />
                  <span>{employeeData.email}</span>
                </div>
                {employeeData.phone && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Phone size={16} className="text-gray-400 shrink-0" />
                    <span>{employeeData.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar size={16} className="text-gray-400 shrink-0" />
                  <span>Joined {employeeData.joinDate ? new Date(employeeData.joinDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f9fc] dark:bg-[#0b0614] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl text-center min-w-[180px]">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                <DollarSign size={14} className="text-emerald-500" /> Current Salary
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {employeeData.salary ? formatCurrency(employeeData.salary) : 'Not set'}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">per month</div>
            </div>
          </div>

          {/* Inline Edit Form Drawer */}
          {editing && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 grid gap-6 md:grid-cols-3 bg-gray-50 dark:bg-[#0f0820] p-6 rounded-2xl shadow-inner">
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">First Name</span>
                <input 
                  type="text"
                  value={editForm.firstName}
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Last Name</span>
                <input 
                  type="text"
                  value={editForm.lastName}
                  onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Phone Number</span>
                <input 
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Position / Title</span>
                <input 
                  type="text"
                  value={editForm.position}
                  onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Salary ($)</span>
                <input 
                  type="number"
                  value={editForm.salary}
                  onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block mb-1">Employment Status</span>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full h-11 px-3 rounded-soft border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#150a24] text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-brand outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-8 px-2">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview" 
                ? "border-brand text-brand" 
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            <User size={18} /> Overview & Activity
          </button>
          <button 
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "attendance" 
                ? "border-brand text-brand" 
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            <Clock size={18} /> Attendance Logs ({employeeData.attendances?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab("leaves")}
            className={`pb-3 font-extrabold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "leaves" 
                ? "border-brand text-brand" 
                : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            }`}
          >
            <FileText size={18} /> Leave Requests ({employeeData.leaveRequests?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#150a24] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={20} /> Record Information
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">Employee ID</span>
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200">{employeeData.id}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">System Account Linked</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{employeeData.user ? employeeData.user.email : 'No linked login account'}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">Record Created</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{new Date(employeeData.createdAt).toLocaleString()}</span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-gray-500 font-medium">Last Modified</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{new Date(employeeData.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#150a24] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="text-purple-500" size={20} /> Organizational Status
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Department</span>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">{employeeData.department}</p>
                  </div>
                  <Building size={24} className="text-purple-500 opacity-80" />
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Role Title</span>
                    <p className="text-base font-extrabold text-gray-900 dark:text-white">{employeeData.position || 'General Staff'}</p>
                  </div>
                  <User size={24} className="text-blue-500 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white dark:bg-[#150a24] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-extrabold text-lg text-gray-900 dark:text-white">Recent Attendance Logs</h2>
            </div>
            {(!employeeData.attendances || employeeData.attendances.length === 0) ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="mx-auto mb-3 text-gray-300" size={36} />
                <p>No attendance logs recorded yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f9fc] dark:bg-[#0f0820] text-xs uppercase font-extrabold text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Check In</th>
                    <th className="p-4">Check Out</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {employeeData.attendances.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-[#1a0b2e]/50">
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{new Date(att.date).toLocaleDateString()}</td>
                      <td className="p-4">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                      <td className="p-4">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          att.status === 'ABSENT' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">{att.notes || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "leaves" && (
          <div className="bg-white dark:bg-[#150a24] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h2 className="font-extrabold text-lg text-gray-900 dark:text-white">Leave Requests</h2>
            </div>
            {(!employeeData.leaveRequests || employeeData.leaveRequests.length === 0) ? (
              <div className="p-12 text-center text-gray-500">
                <FileText className="mx-auto mb-3 text-gray-300" size={36} />
                <p>No leave requests found.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f8f9fc] dark:bg-[#0f0820] text-xs uppercase font-extrabold text-gray-500 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="p-4">Type</th>
                    <th className="p-4">Start Date</th>
                    <th className="p-4">End Date</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {employeeData.leaveRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-[#1a0b2e]/50">
                      <td className="p-4 font-bold text-gray-900 dark:text-white">{req.type}</td>
                      <td className="p-4 font-semibold">{new Date(req.startDate).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold">{new Date(req.endDate).toLocaleDateString()}</td>
                      <td className="p-4 max-w-xs truncate text-gray-600 dark:text-gray-300">{req.reason || '--'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          req.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
