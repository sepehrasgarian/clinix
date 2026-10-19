"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ChatMessage } from "@clinix/contracts";
import { copy } from "@/lib/copy";

export function ChatDrawer({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: ChatMessage[] }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  if (!open) return null;

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const now = new Date().toISOString();
    setMessages((m) => [
      ...m,
      { id: `local_${m.length}`, role: "user", content: text, citedReviewIds: [], createdAt: now },
      { id: `local_${m.length + 1}`, role: "assistant", content: "The assistant is connected to your reports on the next build. This preview shows the layout only.", citedReviewIds: [], createdAt: now },
    ]);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/20" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <div className="flex h-full w-full max-w-md flex-col bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-line p-4">
          <div>
            <h2 id="chat-title" className="font-semibold">{copy.chat.title}</h2>
            <p className="text-xs text-muted">{copy.chat.intro}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-lg hover:bg-surface">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-8 rounded-xl bg-primary-soft p-3 text-sm" : "mr-8 rounded-xl border border-line p-3 text-sm"}>
              {m.content}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="chat-input" className="sr-only">{copy.chat.placeholder}</label>
          <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={copy.chat.placeholder} className="min-h-11 flex-1 rounded-lg border border-line px-3 text-sm" />
          <button type="submit" className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white">{copy.chat.send}</button>
        </form>
      </div>
    </div>
  );
}
