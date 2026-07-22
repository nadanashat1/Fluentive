export function PipelineInfoNotes({ notes }: { notes: string[] }) {
  return (
    <div className="space-y-3">
      {notes.map((note, idx) => (
        <div
          key={`${idx}-${note.slice(0, 12)}`}
          className="rounded-md border border-[#eef0f4] bg-white px-3 py-2 text-[11px] leading-[1.55] text-[#707483] shadow-[0_1px_0_rgba(18,20,31,0.03)] dark:border-[#1f2230] dark:bg-[#0b0614] dark:text-gray-400"
        >
          {note}
        </div>
      ))}
    </div>
  );
}
