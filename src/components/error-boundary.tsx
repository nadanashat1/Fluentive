"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Clock, ShieldAlert, AlertCircle, Home } from "lucide-react";
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

/**
 * ENTERPRISE SELF-HEALING ERROR BOUNDARY
 * Implements a 4-state recovery model: healthy -> degraded -> recovering -> isolated
 * Prevents "permanent death" of UI widgets by using exponential backoff retry
 * and circuit half-open state testing.
 */

type BoundaryState = 'healthy' | 'degraded' | 'recovering' | 'isolated';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Human-friendly name shown in the fallback UI (e.g. "AI Revenue Chart") */
  widgetName?: string;
  /** Optional compact mode for small widgets */
  compact?: boolean;
  /** Optional custom fallback component */
  fallback?: ReactNode;
  /** Maximum consecutive crashes before entering isolated state. Default: 5 */
  maxRetries?: number;
  /** Base cooldown in milliseconds before attempting recovery. Default: 5000 */
  baseCooldownMs?: number;
  /** Called when an error is caught – use for telemetry / logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  status: BoundaryState;
  error: Error | null;
  failureCount: number;
  lastGoodChildren: ReactNode | null;
  nextRetryAt: Date | null;
}

export class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null;
  private captureChildren: boolean = true;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      status: 'healthy',
      error: null,
      failureCount: 0,
      lastGoodChildren: null,
      nextRetryAt: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { status: 'degraded', error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const widgetName = this.props.widgetName || "Unknown Widget";
    this.captureChildren = false;
    
    const newFailureCount = this.state.failureCount + 1;
    const maxRetries = this.props.maxRetries || 5;
    const baseCooldownMs = this.props.baseCooldownMs || 5000;
    
    console.error(`[WidgetSelfHeal] Crash in "${widgetName}". Failures: ${newFailureCount}`);
    
    this.props.onError?.(error, errorInfo);

    if (newFailureCount >= maxRetries) {
      const cooldownMs = Math.min(300000, baseCooldownMs * Math.pow(2, maxRetries));
      const nextRetryAt = new Date(Date.now() + cooldownMs);
      
      console.warn(`[WidgetSelfHeal] "${widgetName}" entering ISOLATED state. Next retry at ${nextRetryAt.toISOString()}`);
      
      this.setState({ 
        status: 'isolated', 
        failureCount: newFailureCount,
        nextRetryAt
      });
      
      this.scheduleRecovery(cooldownMs);
    } else {
      const cooldownMs = baseCooldownMs * Math.pow(2, newFailureCount - 1);
      const nextRetryAt = new Date(Date.now() + cooldownMs);
      
      console.warn(`[WidgetSelfHeal] "${widgetName}" entering DEGRADED state. Next retry at ${nextRetryAt.toISOString()}`);
      
      this.setState({ 
        status: 'degraded', 
        failureCount: newFailureCount,
        nextRetryAt
      });
      
      this.scheduleRecovery(cooldownMs);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    if (prevState.status === 'recovering' && this.state.status === 'healthy') {
      console.log(`[WidgetSelfHeal] "${this.props.widgetName || 'Widget'}" successfully RECOVERED.`);
      this.setState({ failureCount: 0 });
      this.captureChildren = true;
    }
  }

  private scheduleRecovery = (delayMs: number): void => {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    
    this.retryTimer = setTimeout(() => {
      console.log(`[WidgetSelfHeal] "${this.props.widgetName || 'Widget'}" attempting RECOVERY (half-open).`);
      this.setState({ status: 'recovering', error: null, nextRetryAt: null });
    }, delayMs);
  };

  handleManualRetry = (): void => {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.setState({ status: 'recovering', error: null, nextRetryAt: null });
  };

  render(): ReactNode {
    const { status, lastGoodChildren, nextRetryAt } = this.state;
    const widgetName = this.props.widgetName || "Widget";

    if (status === 'healthy') {
      if (this.captureChildren) {
        setTimeout(() => {
          if (this.state.status === 'healthy') {
             this.setState({ lastGoodChildren: this.props.children });
          }
        }, 0);
      }
      return this.props.children;
    }

    if (status === 'recovering') {
      return (
        <div className="relative w-full h-full">
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm dark:bg-black/50">
            <div className="flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm dark:bg-amber-900/80 dark:text-amber-200">
               <RefreshCw size={14} className="animate-spin" /> Attempting recovery...
            </div>
          </div>
          {this.props.children}
        </div>
      );
    }

    if (status === 'degraded' && lastGoodChildren) {
      return (
        <div className="relative w-full h-full opacity-80 pointer-events-none grayscale-[20%]">
          <div className="absolute top-0 left-0 right-0 z-40 bg-amber-500 text-white text-[10px] uppercase font-bold text-center py-0.5 shadow-sm">
             Running in degraded mode
          </div>
          {lastGoodChildren}
        </div>
      );
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    if (this.props.compact) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[120px] rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
          {status === 'isolated' ? (
             <ShieldAlert size={20} className="mb-1 text-red-500" />
          ) : (
             <AlertTriangle size={20} className="mb-1 text-amber-500" />
          )}
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            {widgetName} unavailable
          </p>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-600/70 dark:text-amber-500/70">
             <Clock size={10} /> Auto-recovery scheduled
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className={`mb-3 rounded-full p-3 ${status === 'isolated' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
          {status === 'isolated' ? (
            <ShieldAlert size={32} className="text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle size={32} className="text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <h3 className={`text-lg font-bold ${status === 'isolated' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
          {widgetName} {status === 'isolated' ? 'isolated' : 'encountered an error'}
        </h3>
        <p className="mt-2 max-w-md text-sm text-amber-700 dark:text-amber-400">
          {status === 'isolated' 
            ? "Multiple failures detected. To protect system stability, this widget is temporarily isolated."
            : "This section crashed unexpectedly. The rest of the dashboard is unaffected."}
        </p>
        
        {nextRetryAt && (
           <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-800/30 px-3 py-1.5 rounded-md">
              <Clock size={14} /> Next recovery attempt in {Math.round((nextRetryAt.getTime() - Date.now()) / 1000)}s
           </div>
        )}

        {process.env.NODE_ENV !== "production" && this.state.error && (
          <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-amber-100 p-3 text-left text-[11px] text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-700/30">
            {this.state.error.message}
          </pre>
        )}
        
        <button
          onClick={this.handleManualRetry}
          className="mt-5 flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          <RefreshCw size={14} /> Force Manual Retry
        </button>
      </div>
    );
  }
}

// ── ORIGINAL ERROR BOUNDARY FOR ROUTE LAYOUTS ───────────────────────────────────

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#2f3440] dark:text-gray-100">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-[#6b7280] dark:text-gray-400">
              {this.state.error?.message || "An unexpected error occurred. We've been notified and are working on it."}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 rounded-soft bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
              >
                <RefreshCw size={16} />
                Try again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 rounded-soft bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Home size={16} />
                Go home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 overflow-auto bg-gray-100 p-2 text-xs dark:bg-gray-800">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for React Query error boundary integration
export function useQueryErrorBoundary() {
  const reset = useQueryErrorResetBoundary();
  
  return {
    reset,
    withErrorBoundary: (queryConfig: any) => ({
      ...queryConfig,
      throwOnError: true,
      retry: (failureCount: number, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      }
    })
  };
}
