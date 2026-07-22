"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft, Command as CommandIcon, Clock, Zap, Navigation, Settings } from "lucide-react";
import clsx from "clsx";
import { Command, CommandGroup, highlightMatch, formatShortcut } from "./types";

interface CommandPaletteProps {
  isOpen: boolean;
  search: string;
  selectedIndex: number;
  groups: CommandGroup[];
  onClose: () => void;
  onSearchChange: (search: string) => void;
  onExecute: (command: Command) => void;
  onSelectIndex: (index: number) => void;
}

const sectionIcons: Record<string, React.ReactNode> = {
  Recent: <Clock size={14} />,
  Navigation: <Navigation size={14} />,
  "Quick Actions": <Zap size={14} />,
  System: <Settings size={14} />,
};

function HighlightedText({ text, matches }: { text: string; matches: boolean[] }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className={clsx(
            matches[i] && "text-brand font-semibold"
          )}
        >
          {char}
        </span>
      ))}
    </>
  );
}

function CommandItem({
  command,
  query,
  isSelected,
  onClick,
  index,
}: {
  command: Command;
  query: string;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { text, matches } = highlightMatch(command.label, query);
  
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isSelected]);
  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
        isSelected
          ? "bg-brand/10 dark:bg-brand/20"
          : "hover:bg-[#f6f6f8] dark:hover:bg-[#1a0b2e]"
      )}
    >
      <div className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        command.section === "recent" && "bg-brand/10 text-brand",
        command.section === "navigation" && "bg-blue-500/10 text-blue-500",
        command.section === "actions" && "bg-amber-500/10 text-amber-500",
        command.section === "system" && "bg-gray-500/10 text-gray-500",
      )}>
        {sectionIcons[command.section === "recent" ? "Recent" : 
          command.section === "navigation" ? "Navigation" : 
          command.section === "actions" ? "Quick Actions" : "System"]}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2f3440] dark:text-gray-200 truncate">
          <HighlightedText text={text} matches={matches} />
        </p>
        {command.keywords && (
          <p className="text-xs text-[#8f93a1] dark:text-gray-500 truncate">
            {command.keywords.slice(0, 3).join(" • ")}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {command.shortcut && (
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#f6f6f8] dark:bg-[#1a0b2e] px-1.5 py-0.5 text-[11px] font-medium text-[#707483] dark:text-gray-400">
            {formatShortcut(command.shortcut)}
          </kbd>
        )}
        {isSelected && (
          <CornerDownLeft size={14} className="text-brand" />
        )}
      </div>
    </div>
  );
}

export function CommandPalette({
  isOpen,
  search,
  selectedIndex,
  groups,
  onClose,
  onSearchChange,
  onExecute,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Calculate global index from group
  const getGlobalIndex = (groupIndex: number, itemIndex: number): number => {
    let count = 0;
    for (let i = 0; i < groupIndex; i++) {
      count += groups[i]?.commands.length || 0;
    }
    return count + itemIndex;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-xl border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] shadow-2xl">
              {/* Search header */}
              <div className="flex items-center gap-3 border-b border-[#ececef] dark:border-[#2a2f3a] px-4 py-3">
                <Search size={18} className="text-[#8f93a1] dark:text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search commands, routes, or actions..."
                  className="flex-1 bg-transparent text-sm text-[#2f3440] dark:text-gray-200 placeholder:text-[#8f93a1] focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md bg-[#f6f6f8] dark:bg-[#2a2f3a] px-1.5 py-0.5 text-[11px] font-medium text-[#707483] dark:text-gray-400">
                    <CommandIcon size={10} />
                    K
                  </kbd>
                </div>
              </div>
              
              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {groups.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[#8f93a1] dark:text-gray-500">
                      No commands found for "{search}"
                    </p>
                    <p className="mt-1 text-xs text-[#a7a9b3] dark:text-gray-600">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  groups.map((group, groupIndex) => (
                    <div key={group.label}>
                      {/* Section header */}
                      <div className="sticky top-0 z-10 flex items-center gap-2 bg-white/95 dark:bg-[#1a0b2e]/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#a7a9b3] dark:text-gray-500 backdrop-blur-sm">
                        {sectionIcons[group.label]}
                        {group.label}
                      </div>
                      
                      {/* Commands */}
                      {group.commands.map((command, itemIndex) => {
                        const globalIndex = getGlobalIndex(groupIndex, itemIndex);
                        return (
                          <CommandItem
                            key={command.id}
                            command={command}
                            query={search}
                            isSelected={globalIndex === selectedIndex}
                            onClick={() => onExecute(command)}
                            index={globalIndex}
                          />
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#ececef] dark:border-[#2a2f3a] px-4 py-2 text-[11px] text-[#8f93a1] dark:text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-[#f6f6f8] dark:bg-[#2a2f3a] px-1 py-0.5">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded bg-[#f6f6f8] dark:bg-[#2a2f3a] px-1 py-0.5">↵</kbd>
                    Select
                  </span>
                </div>
                <span>{groups.reduce((acc, g) => acc + g.commands.length, 0)} commands</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
