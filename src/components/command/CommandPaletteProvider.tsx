"use client";

import { sideMainNav, sideAdminNav } from "@/data/nav-config";
import { useCommandPalette } from "./useCommandPalette";
import { CommandPalette } from "./CommandPalette";
import { useMemo } from "react";

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  // Combine all navigation items
  const navItems = useMemo(() => {
    return [...sideMainNav, ...sideAdminNav];
  }, []);
  
  const {
    isOpen,
    search,
    selectedIndex,
    groups,
    close,
    setSearch,
    executeCommand,
    selectNext,
    selectPrev,
  } = useCommandPalette({ navItems });
  
  return (
    <>
      {children}
      <CommandPalette
        isOpen={isOpen}
        search={search}
        selectedIndex={selectedIndex}
        groups={groups}
        onClose={close}
        onSearchChange={setSearch}
        onExecute={executeCommand}
        onSelectIndex={(index) => {
          // This is handled internally by keyboard navigation
          // We expose it for potential external control
          void index;
        }}
      />
    </>
  );
}

export default CommandPaletteProvider;
