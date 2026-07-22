"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/error-boundary";
import { QuickActions } from "@/components/quick-actions";
import { SecurityProvider } from "@/components/security/security-provider";

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickActionsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <SecurityProvider>
      <ToastProvider>
        <ErrorBoundary>
          <AppShell>{children}</AppShell>
        </ErrorBoundary>
        {quickActionsOpen && <QuickActions onClose={() => setQuickActionsOpen(false)} />}
      </ToastProvider>
    </SecurityProvider>
  );
}
