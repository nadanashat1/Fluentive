import { WifiOff, AlertTriangle } from "lucide-react";

interface OfflineStateProps {
  message?: string;
  description?: string;
}

/**
 * Offline State Component
 * 
 * Reality-First UI: Show when backend is disconnected.
 * Never show fake data - always inform user of system status.
 */
export function OfflineState({ 
  message = "System Temporarily Unavailable",
  description = "The backend is currently disconnected. Please check your connection or try again later."
}: OfflineStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="p-4 bg-yellow-100 rounded-full">
        <WifiOff className="w-8 h-8 text-yellow-600" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-medium text-gray-900">{message}</h3>
        </div>
        <p className="text-sm text-gray-600 max-w-sm">{description}</p>
      </div>
    </div>
  );
}
