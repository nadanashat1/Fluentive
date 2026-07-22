import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * Error State Component
 * 
 * Reality-First UI: Show when request fails.
 * Never hide errors - always inform the user what went wrong.
 */
export function ErrorState({ 
  message = "Something went wrong", 
  onRetry,
  showRetry = true
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="p-4 bg-red-50 rounded-full">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="text-sm text-gray-500 max-w-sm">{message}</p>
      </div>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
