"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";

interface EmailSuggestion {
  leadId: string;
  leadName: string;
  purpose: string;
  template: {
    subject: string;
    body: string;
    tone: string;
    tips: string[];
  };
  generatedAt: string;
}

export default function EmailSuggestionPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [suggestion, setSuggestion] = useState<EmailSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<"followup" | "introduction" | "closing" | "reengagement">("followup");

  useEffect(() => {
    (async () => {
      try {
        const response = await apiFetch<{ success: true; data: EmailSuggestion }>(
          `/api/ai/advanced/leads/${leadId}/email-suggestion?purpose=${purpose}`
        );
        setSuggestion(response.data);
      } catch (e) {
        if (e instanceof ApiError) {
          setError(e.message);
        } else {
          setError("We couldn't load the email suggestion. Let's try again.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [leadId, purpose]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full rounded-lg2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#f25572]">Oops, something went wrong</p>
          <p className="mt-1 text-[14px] text-[#8b8f9b] dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!suggestion) {
    return null;
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-[13px] text-[#8b8f9b] dark:text-gray-400 hover:text-[#2f3440] dark:hover:text-gray-200"
        >
          ← Back
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#2f3440] dark:text-gray-100">AI Email Suggestion 📧</h1>
        <p className="mt-1 text-[13px] text-[#8b8f9b] dark:text-gray-400">
          AI-generated email template for this lead
        </p>
        <div className="mt-3 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#1a0b2e]">
          <p className="text-[12px] text-[#6b7280] dark:text-gray-400">
            <span className="font-semibold text-[#840A36]">🤖 AI Email:</span> Generate personalized email templates based on lead context and communication history.
          </p>
        </div>
      </div>

      {/* Purpose Selection */}
      <div className="flex gap-2">
        {["followup", "introduction", "closing", "reengagement"].map((p) => (
          <button
            key={p}
            onClick={() => setPurpose(p as any)}
            className={`px-3 py-2 rounded-soft border text-[13px] font-medium transition-colors ${
              purpose === p
                ? "bg-brand text-white border-brand"
                : "bg-white text-[#2f3440] dark:text-gray-200 border-[#e7e9ef] dark:border-[#2a2f3a] hover:border-brand"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Email Template */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#2f3440] dark:text-gray-100">Email Template</h2>
          <button
            onClick={() => handleCopy(`${suggestion.template.subject}\n\n${suggestion.template.body}`)}
            className="px-3 py-1 rounded-soft bg-brand text-white text-[13px] font-medium hover:bg-brand/90"
          >
            Copy to Clipboard
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-[#8b8f9b] dark:text-gray-400 mb-1">Subject</label>
            <div className="p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
              <p className="text-[14px] text-[#2f3440] dark:text-gray-200">{suggestion.template.subject}</p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] text-[#8b8f9b] dark:text-gray-400 mb-1">Body</label>
            <div className="p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820] whitespace-pre-wrap">
              <p className="text-[14px] text-[#2f3440] dark:text-gray-200">{suggestion.template.body}</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        {suggestion.template.tips.length > 0 && (
          <div className="mt-4 p-3 rounded-lg border border-[#e7e9ef] dark:border-[#2a2f3a] bg-[#f7f8fb] dark:bg-[#0f0820]">
            <p className="text-[12px] font-semibold text-[#8b8f9b] dark:text-gray-400 mb-2">💡 Tips:</p>
            <ul className="space-y-1">
              {suggestion.template.tips.map((tip, index) => (
                <li key={index} className="text-[12px] text-[#6b7280] dark:text-gray-400">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-lg2 border border-[#ececef] dark:border-[#2a2f3a] bg-white dark:bg-[#1a0b2e] p-4">
        <div className="flex gap-4 text-[13px] text-[#6b7280] dark:text-gray-400">
          <span><strong className="text-[#2f3440] dark:text-gray-200">Purpose:</strong> {suggestion.purpose}</span>
          <span><strong className="text-[#2f3440] dark:text-gray-200">Tone:</strong> {suggestion.template.tone}</span>
        </div>
      </div>
    </div>
  );
}
