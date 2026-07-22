export type NavIntent = "idle" | "active" | "transitioning";

export const NAV_ITEM_STYLES = {
  base: "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
  press: "active:scale-[0.98]",
  label: "text-[13px] font-medium",
} as const;

export function getIntentStyles(intent: NavIntent): string {
  if (intent === "active") {
    return "bg-brand/10 text-brand";
  }
  if (intent === "transitioning") {
    return "opacity-80";
  }
  return "text-[#707483] dark:text-gray-400 hover:bg-[#f6f6f8] dark:hover:bg-[#1a0b2e]";
}
