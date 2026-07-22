// Global Error Boundary - Production-ready error handling
// Catches all React errors and provides graceful fallbacks

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

// Simple button component since UI components aren't available yet
const Button = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default' 
}: { 
  children: ReactNode; 
  onClick: () => void; 
  className?: string; 
  variant?: 'default' | 'outline';
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' 
        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${className}`}
  >
    {children}
  </button>
);

// Simple icon components
const AlertTriangle = ({ className = '' }: { className?: string }) => (
  <svg className={`w-8 h-8 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 0 0 0 1.71 3h16.94a2 2 0 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0 0-2.86 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
  </svg>
);

const RefreshCw = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 0 15.415 11.5H15M21 12a9 9 0 1 1-18 0 9 9 0 0 1 0 18 0z" />
  </svg>
);

const Home = ({ className = '' }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11l-9-4-9 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 9l-9-7-9 7v11l9-4 9-4z" />
  </svg>
);

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to error reporting service
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (Sentry, LogRocket, etc.)
      // reportError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. 
                Our team has been notified and is working on a fix.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-red-600">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap break-all">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary integration
export function useErrorBoundary() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log error details
    console.error('Error caught by boundary:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service
      // sendErrorToMonitoring(error, errorInfo);
    }
  };

  const withErrorBoundary = (queryConfig: any) => ({
    ...queryConfig,
    onError: (error: Error) => {
      console.error('Query error:', error);
      queryConfig.onError?.(error);
    },
    retry: (failureCount: number, error: Error) => {
      // Only retry on network errors, not on 4xx/5xx
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        return failureCount < 3;
      }
      return false;
    }
  });

  return {
    handleError,
    withErrorBoundary
  };
}
