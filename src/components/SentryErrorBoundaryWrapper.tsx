"use client";

import React, { type ReactNode } from "react";
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
}

export function SentryErrorBoundaryWrapper({ children }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center dark:bg-slate-900">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center max-w-md dark:border-red-900/30 dark:bg-red-900/10">
            <h1 className="text-xl font-bold text-red-800 dark:text-red-300">Something went wrong</h1>
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">
              An unexpected error occurred. The application has crashed, but our monitoring systems have been notified.
            </p>
            <button
              onClick={resetError}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        // Emit a structured log entry on stdout
        console.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "ERROR",
            service: "frontend-error-boundary",
            message: error instanceof Error ? error.message : "Root UI crash",
            metadata: {
              error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              } : String(error)
            }
          }) + "\n"
        );
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
