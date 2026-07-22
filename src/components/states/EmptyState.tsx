import { Inbox, FileText, Users, Database } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: "inbox" | "file" | "users" | "database";
  action?: React.ReactNode;
}

/**
 * Empty State Component
 * 
 * Reality-First UI: Show when no data exists (not an error).
 * Distinguish between "no data yet" and "error occurred".
 */
export function EmptyState({ 
  message = "No data found", 
  description = "There's nothing to display here yet.",
  icon = "inbox",
  action
}: EmptyStateProps) {
  const icons = {
    inbox: Inbox,
    file: FileText,
    users: Users,
    database: Database
  };

  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <div className="p-4 bg-gray-100 rounded-full">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{message}</h3>
        <p className="text-sm text-gray-500 max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
