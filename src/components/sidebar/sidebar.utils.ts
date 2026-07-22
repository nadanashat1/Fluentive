import clsx from "clsx";

// Centralized UI state rules for sidebar
// Single source of truth for styling logic
export const getItemStyles = (active: boolean, collapsed: boolean) => {
  return {
    base: clsx(
      "group relative flex items-center rounded-r-lg py-2 text-[13px] font-medium",
      collapsed ? "justify-center px-2" : "gap-2.5 px-4"
    ),
    active: active
      ? "bg-brand/10 text-brand shadow-sm before:absolute before:inset-0 before:bg-brand/10 before:blur-xl before:opacity-40 before:rounded-r-lg"
      : "text-[#707483] hover:bg-[#f6f6f8] dark:text-gray-400 dark:hover:bg-[#1a0b2e]",
  };
};

export const getSidebarWidth = (collapsed: boolean) => ({
  className: clsx(
    "hidden flex-shrink-0 flex-col border-r backdrop-blur-xl bg-white/60 dark:bg-[#0f0820]/70 border border-white/10 dark:border-white/5",
    "transition-all duration-300 ease-in-out md:flex relative overflow-hidden",
    collapsed ? "w-[72px]" : "w-[240px]"
  ),
});

export const getTransitionState = (isTransitioning: boolean, isNavigating: boolean) => ({
  className: clsx(
    isTransitioning && "opacity-80",
    isNavigating && "opacity-70 scale-[0.98]"
  ),
});
