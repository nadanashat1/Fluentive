export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon?: string;
  section: "recent" | "navigation" | "actions" | "system";
  href?: string;
  action?: () => void;
  keywords?: string[];
  priority?: number;
}

export interface CommandGroup {
  label: string;
  commands: Command[];
}

export type CommandSection = "recent" | "navigation" | "actions" | "system";

export interface CommandPaletteState {
  isOpen: boolean;
  search: string;
  selectedIndex: number;
  filteredCommands: Command[];
}

export interface UseCommandPaletteReturn {
  isOpen: boolean;
  search: string;
  selectedIndex: number;
  filteredCommands: Command[];
  groups: CommandGroup[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setSearch: (search: string) => void;
  selectNext: () => void;
  selectPrev: () => void;
  executeSelected: () => void;
  executeCommand: (command: Command) => void;
}

export const COMMAND_SECTIONS: Record<CommandSection, { label: string; priority: number }> = {
  recent: { label: "Recent", priority: 0 },
  navigation: { label: "Navigation", priority: 1 },
  actions: { label: "Quick Actions", priority: 2 },
  system: { label: "System", priority: 3 },
};

export const QUICK_ACTIONS: Command[] = [
  {
    id: "create-lead",
    label: "Create new lead",
    shortcut: "C",
    section: "actions",
    href: "/leads/new",
    keywords: ["add", "new", "lead", "create"],
  },
  {
    id: "refresh-data",
    label: "Refresh dashboard data",
    shortcut: "R",
    section: "actions",
    keywords: ["reload", "update", "sync", "refresh"],
  },
  {
    id: "toggle-theme",
    label: "Toggle dark mode",
    shortcut: "D",
    section: "system",
    keywords: ["theme", "dark", "light", "mode"],
  },
];

export const SYSTEM_COMMANDS: Command[] = [
  {
    id: "logout",
    label: "Log out",
    section: "system",
    keywords: ["exit", "signout", "logout"],
  },
];

export const PREDEFINED_COMMANDS: Record<string, Command> = {
  home: {
    id: "nav-home",
    label: "Dashboard",
    section: "navigation",
    href: "/dashboard",
    keywords: ["home", "main", "dashboard"],
    priority: 100,
  },
  leads: {
    id: "nav-leads",
    label: "Leads",
    section: "navigation",
    href: "/leads",
    keywords: ["leads", "contacts", "customers"],
    priority: 90,
  },
  analytics: {
    id: "nav-analytics",
    label: "Analytics",
    section: "navigation",
    href: "/analytics",
    keywords: ["analytics", "stats", "reports", "data"],
    priority: 80,
  },
  activity: {
    id: "nav-activity",
    label: "Activity Logs",
    section: "navigation",
    href: "/activity-logs",
    keywords: ["activity", "logs", "history", "actions"],
    priority: 70,
  },
  settings: {
    id: "nav-settings",
    label: "Settings",
    section: "navigation",
    href: "/settings",
    keywords: ["settings", "config", "preferences"],
    priority: 60,
  },
};

export const COMMAND_PALETTE_CONFIG = {
  maxResults: 50,
  maxRecentItems: 5,
  debounceMs: 50,
  minQueryLength: 1,
  animationDuration: 150,
} as const;

export const KEYBOARD_SHORTCUTS = {
  open: ["cmd+k", "ctrl+k"],
  close: ["escape"],
  navigateUp: ["arrowup", "shift+tab"],
  navigateDown: ["arrowdown", "tab"],
  execute: ["enter"],
} as const;

export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  
  if (!q) return 1;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  
  let qIdx = 0;
  let score = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 10;
      qIdx++;
    }
  }
  
  return qIdx === q.length ? score : 0;
}

export function scoreCommand(command: Command, query: string): number {
  let score = fuzzyMatch(query, command.label);
  
  if (command.keywords) {
    for (const keyword of command.keywords) {
      score += fuzzyMatch(query, keyword) * 0.5;
    }
  }
  
  if (command.priority) {
    score += command.priority;
  }
  
  return score;
}

export function filterAndSortCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) {
    return [...commands].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  return commands
    .map(cmd => ({ cmd, score: scoreCommand(cmd, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cmd }) => cmd);
}

export function groupCommands(commands: Command[]): CommandGroup[] {
  const groups: Record<string, Command[]> = {};
  
  for (const cmd of commands) {
    if (!groups[cmd.section]) {
      groups[cmd.section] = [];
    }
    groups[cmd.section].push(cmd);
  }
  
  return Object.entries(groups)
    .sort((a, b) => COMMAND_SECTIONS[a[0] as CommandSection].priority - COMMAND_SECTIONS[b[0] as CommandSection].priority)
    .map(([section, cmds]) => ({
      label: COMMAND_SECTIONS[section as CommandSection].label,
      commands: cmds,
    }));
}

export function getRecentRoutesFromStorage(maxItems: number = 5): string[] {
  if (typeof window === "undefined") return [];
  try {
    const usage = JSON.parse(localStorage.getItem("nav-usage") || "{}");
    return Object.entries(usage)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, maxItems)
      .map(([route]) => route);
  } catch {
    return [];
  }
}

export function getLastRouteFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lastRoute");
}

export function createRecentCommands(routes: string[], navItems: { label: string; href: string }[]): Command[] {
  return routes.map((route, index) => {
    const item = navItems.find(i => i.href === route || route.startsWith(i.href));
    if (!item) return null;
    return {
      id: `recent-${route}`,
      label: item.label,
      section: "recent" as const,
      href: route,
      priority: 100 - index * 10,
    };
  }).filter(Boolean) as Command[];
}

export function createNavigationCommands(navItems: { label: string; href: string }[]): Command[] {
  return navItems.map((item, index) => ({
    id: `nav-${item.href}`,
    label: item.label,
    section: "navigation" as const,
    href: item.href,
    keywords: [item.label.toLowerCase()],
    priority: 10 - Math.min(index, 9),
  }));
}

export function buildAllCommands(
  navItems: { label: string; href: string }[],
  maxRecent: number = 5
): Command[] {
  const recentRoutes = getRecentRoutesFromStorage(maxRecent);
  const recentCommands = createRecentCommands(recentRoutes, navItems);
  const navigationCommands = createNavigationCommands(navItems);
  
  return [
    ...recentCommands,
    ...navigationCommands,
    ...QUICK_ACTIONS,
    ...SYSTEM_COMMANDS,
  ];
}

export function deduplicateCommands(commands: Command[]): Command[] {
  const seen = new Set<string>();
  return commands.filter(cmd => {
    if (seen.has(cmd.id)) return false;
    seen.add(cmd.id);
    return true;
  });
}

export function highlightMatch(text: string, query: string): { text: string; matches: boolean[] } {
  if (!query.trim()) {
    return { text, matches: new Array(text.length).fill(false) };
  }
  
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const matches = new Array(text.length).fill(false);
  
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      matches[i] = true;
      qIdx++;
    }
  }
  
  return { text, matches };
}

export function formatShortcut(shortcut: string): string {
  if (typeof window === "undefined") return shortcut;
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  return isMac ? `⌘ ${shortcut}` : `Ctrl ${shortcut}`;
}

export function calculateNextIndex(current: number, total: number, direction: "up" | "down"): number {
  if (direction === "up") {
    return current <= 0 ? total - 1 : current - 1;
  }
  return current >= total - 1 ? 0 : current + 1;
}

export function hasHref(command: Command): command is Command & { href: string } {
  return typeof command.href === "string" && command.href.length > 0;
}

export function useNavigationTracking() {
  return {
    trackNavigation: (href: string) => {
      if (typeof window === "undefined") return;
      try {
        const usage = JSON.parse(localStorage.getItem("nav-usage") || "{}");
        usage[href] = (usage[href] || 0) + 1;
        localStorage.setItem("nav-usage", JSON.stringify(usage));
        localStorage.setItem("lastRoute", href);
      } catch {
        // Silently fail
      }
    }
  };
}

export function useCommandShortcuts(onToggle: () => void) {
  if (typeof window === "undefined") return () => {};
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      onToggle();
    }
    if (e.key === "Escape") {
      onToggle();
    }
  };
  
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}
