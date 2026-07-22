import type { LucideIcon } from "lucide-react";
import {
  Shield,
  User,
  Users,
  Briefcase,
  Bot,
  Lock,
  Settings,
  Download,
  Upload,
  Activity,
} from "lucide-react";
import type { ActivityEventCategory, ActivitySeverity } from "./types";

export const CATEGORY_CONFIG: Record<
  ActivityEventCategory,
  { label: string; color: string; bg: string; border: string; icon: LucideIcon }
> = {
  AUTH: {
    label: "Authentication",
    color: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    icon: Lock,
  },
  LEAD: {
    label: "Leads",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: Users,
  },
  DEAL: {
    label: "Deals",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    icon: Briefcase,
  },
  AI: {
    label: "AI Activity",
    color: "text-fuchsia-700 dark:text-fuchsia-300",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
    icon: Bot,
  },
  SECURITY: {
    label: "Security",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: Shield,
  },
  USER: {
    label: "User",
    color: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200 dark:border-sky-800",
    icon: User,
  },
  SYSTEM: {
    label: "System Health",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-700",
    icon: Settings,
  },
  EXPORT: {
    label: "Exports",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: Download,
  },
  IMPORT: {
    label: "Imports",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-200 dark:border-orange-800",
    icon: Upload,
  },
};

export const SEVERITY_CONFIG: Record<
  ActivitySeverity,
  { label: string; color: string; bg: string; border: string }
> = {
  info: {
    label: "Normal",
    color: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800/60",
    border: "border-slate-200 dark:border-slate-600",
  },
  warning: {
    label: "Needs attention",
    color: "text-amber-800 dark:text-amber-200",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    border: "border-amber-300 dark:border-amber-700",
  },
  error: {
    label: "Problem",
    color: "text-red-800 dark:text-red-200",
    bg: "bg-red-100 dark:bg-red-900/40",
    border: "border-red-300 dark:border-red-700",
  },
  critical: {
    label: "Urgent",
    color: "text-rose-900 dark:text-rose-100",
    bg: "bg-rose-200 dark:bg-rose-950/60",
    border: "border-rose-400 dark:border-rose-600",
  },
};

export const DEFAULT_CATEGORY_ICON = Activity;
