"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { Save, Plus, Trash2, Edit2, X, Clock } from "lucide-react";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface LeadNotesProps {
  leadId: string;
}

export function LeadNotes({ leadId }: LeadNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const { showToast } = useToast();

  const fetchNotes = useCallback(async () => {
    try {
      const data = await apiFetch<{ success: true; data: Note[] }>(`/api/leads/${leadId}/notes`);
      setNotes(data.data);
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!currentNote.trim()) return;

    try {
      await apiFetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: currentNote })
      });
      showToast("Note added! All set.", "success");
      setCurrentNote("");
      setEditing(false);
      fetchNotes();
    } catch (e) {
      showToast("We couldn't add the note. Try again?", "error");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note? We can't undo this.")) return;

    try {
      await apiFetch(`/api/leads/${leadId}/notes/${noteId}`, {
        method: "DELETE"
      });
      showToast("Note deleted. Done.", "success");
      fetchNotes();
    } catch (e) {
      showToast("We couldn't delete it. Try again.", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  if (loading) {
    return <div className="skeleton h-32 w-full rounded-soft" />;
  }

  return (
    <div className="space-y-3">
      {editing && (
        <div className="space-y-2">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Write a note..."
            rows={3}
            className="w-full rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] dark:bg-[#0f0820] dark:text-gray-300 px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-brand/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setEditing(false);
                setCurrentNote("");
              }}
              className="rounded-soft border border-[#e1e3e9] dark:border-[#2a2f3a] px-3 py-1 text-[11px] font-semibold text-[#646b7a] dark:text-gray-400 hover:bg-[#f8f9fa] dark:hover:bg-[#1a0b2e]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={!currentNote.trim()}
              className="rounded-soft bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Save size={12} />
              Save
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="rounded-soft border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-[12px] text-[#2f3440] dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  title="Delete note"
                  className="flex-shrink-0 text-[#8b8f9b] dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[#8b8f9b] dark:text-gray-500">
                <Clock size={10} />
                <span>{formatDate(note.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-[#6b7280] dark:text-gray-400 text-center py-4">No notes yet. Add one to keep track of important details!</p>
        )}
      </div>

      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="w-full rounded-soft border border-dashed border-[#e1e3e9] dark:border-[#2a2f3a] px-3 py-2 text-[11px] font-semibold text-brand hover:bg-brand/5 transition-colors flex items-center justify-center gap-1"
        >
          <Plus size={14} />
          Add Note
        </button>
      )}
    </div>
  );
}
