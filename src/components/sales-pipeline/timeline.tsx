import { TimelineEvent, TimelineEventType } from "@/types";
import { Phone, Mail, Video, MessageSquare, CheckCircle } from "lucide-react";

interface TimelineProps {
  events: TimelineEvent[];
}

const iconMap: Record<TimelineEventType, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  note: MessageSquare,
  status_change: CheckCircle
};

const iconColors: Record<TimelineEventType, string> = {
  call: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  email: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  meeting: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  note: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  status_change: "bg-brand text-white"
};

export function Timeline({ events }: TimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
  };

  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-[12px] text-[#707483] dark:text-gray-400">
        No activity yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = iconMap[event.type];
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${iconColors[event.type]}`}
              >
                <Icon size={14} />
              </div>
              {index !== events.length - 1 && (
                <div className="mt-2 h-full w-0.5 flex-1 bg-[#e6e7eb] dark:bg-[#2a2f3a]" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-medium text-[#1f2430] dark:text-gray-100">
                  {event.title}
                </h4>
                <span className="text-[11px] text-[#707483] dark:text-gray-400">
                  {formatDate(event.timestamp)}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#707483] dark:text-gray-400">
                {event.description}
              </p>
              <div className="mt-1 text-[11px] text-[#a7a9b3] dark:text-gray-500">
                {event.author} • {formatTime(event.timestamp)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
