import { MessageSquare } from "lucide-react";

interface InternalNotesProps {
  notes: string[];
}

export function InternalNotes({ notes }: InternalNotesProps) {
  return (
    <div className="border-b border-[#ececef] px-5 py-4 dark:border-[#2a2f3a]">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={16} className="text-[#707483] dark:text-gray-400" />
        <h3 className="text-[13px] font-semibold text-[#1f2430] dark:text-gray-100">
          Internal Notes
        </h3>
      </div>
      {notes.length === 0 ? (
        <p className="text-[12px] text-[#707483] dark:text-gray-400">
          No notes added yet
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li
              key={index}
              className="rounded-lg bg-[#f8f9fc] p-3 text-[12px] text-[#707483] dark:bg-[#1a0b2e] dark:text-gray-400"
            >
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
