"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandGroup,
  UseCommandPaletteReturn,
  buildAllCommands,
  filterAndSortCommands,
  groupCommands,
  deduplicateCommands,
  calculateNextIndex,
  useCommandShortcuts,
  useNavigationTracking,
  hasHref,
  COMMAND_PALETTE_CONFIG,
} from "./types";

interface UseCommandPaletteOptions {
  navItems: { label: string; href: string }[];
  onExecute?: (command: Command) => void;
}

export function useCommandPalette(options: UseCommandPaletteOptions): UseCommandPaletteReturn {
  const { navItems, onExecute } = options;
  const router = useRouter();
  const { trackNavigation } = useNavigationTracking();
  
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Build commands from nav items + quick actions
  const allCommands = useMemo(() => {
    return deduplicateCommands(buildAllCommands(navItems));
  }, [navItems]);
  
  // Filter based on search
  const filteredCommands = useMemo(() => {
    return filterAndSortCommands(allCommands, search);
  }, [allCommands, search]);
  
  // Group for display
  const groups = useMemo(() => {
    return groupCommands(filteredCommands);
  }, [filteredCommands]);
  
  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const cleanup = useCommandShortcuts(() => setIsOpen(prev => !prev));
    return cleanup;
  }, [isOpen]);
  
  // Global Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
    setSelectedIndex(0);
  }, []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  const selectNext = useCallback(() => {
    setSelectedIndex(prev => calculateNextIndex(prev, filteredCommands.length, "down"));
  }, [filteredCommands.length]);
  
  const selectPrev = useCallback(() => {
    setSelectedIndex(prev => calculateNextIndex(prev, filteredCommands.length, "up"));
  }, [filteredCommands.length]);
  
  const executeCommand = useCallback((command: Command) => {
    if (onExecute) {
      onExecute(command);
    }
    
    if (hasHref(command)) {
      trackNavigation(command.href);
      router.push(command.href);
    } else if (command.action) {
      command.action();
    }
    
    close();
  }, [router, close, onExecute, trackNavigation]);
  
  const executeSelected = useCallback(() => {
    const command = filteredCommands[selectedIndex];
    if (command) {
      executeCommand(command);
    }
  }, [filteredCommands, selectedIndex, executeCommand]);
  
  // Handle keyboard navigation when open
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          selectNext();
          break;
        case "ArrowUp":
          e.preventDefault();
          selectPrev();
          break;
        case "Enter":
          e.preventDefault();
          executeSelected();
          break;
        case "Escape":
          e.preventDefault();
          close();
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectNext, selectPrev, executeSelected, close]);
  
  return {
    isOpen,
    search,
    selectedIndex,
    filteredCommands,
    groups,
    open,
    close,
    toggle,
    setSearch,
    selectNext,
    selectPrev,
    executeSelected,
    executeCommand,
  };
}

export default useCommandPalette;
