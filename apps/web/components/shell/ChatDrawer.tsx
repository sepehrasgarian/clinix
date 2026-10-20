"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { ChatMessage, Review } from "@clinix/contracts";
import { EvidenceCard } from "@/components/ui/EvidenceCard";
import { copy } from "@/lib/copy";
import { ApiError, getChatHistory, sendChatMessage } from "@/lib/api";

/** Ask ClinX: answers from the clinic's own reports, each cited review shown under the answer. */
export function ChatDrawer({ open, onClose, clinicId, competitorNames = {} }: { open: boolean; onClose: () => void; clinicId: string; competitorNames?: Record<string, string> }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reviews, setReviews] = useState<Map<string, Review>>(new Map());
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    const handle = setTimeout(async () => {
      try {
        const h = await getChatHistory(clinicId);
        setMessages(h.messages);
        setReviews(new Map(h.reviews.map((r) => [r.id, r])));
      } catch {
        /* an empty thread is a fine start */
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [open, loaded, clinicId]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages.length, busy]);

  if (!open) return null;

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setDraft("");
    const now = new Date().toISOString();
    setMessages((m) => [...m, { id: `local_${m.length}`, role: "user", content: text, citedReviewIds: [], createdAt: now }]);
    try {
      const { answer, reviews: cited } = await sendChatMessage(clinicId, text);
      setReviews((r) => new Map([...r, ...cited.map((x) => [x.id, x] as const)]));
      setMessages((m) => [...m, answer]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "We couldn't reach our servers just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const sourceName = (placeId: string) => competitorNames[placeId] ?? "Your clinic";

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
          {loaded && messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              <p>Try one of these:</p>
              <ul className="mt-2 space-y-1">
                {["What do my own patients complain about?", "Why do patients choose the clinic with the most reviews?", "What should I do first this week?"].map((q) => (
                  <li key={q}><button type="button" onClick={() => setDraft(q)} className="text-left text-primary hover:underline">{q}</button></li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-8 rounded-xl bg-primary-soft p-3 text-sm" : "mr-4 rounded-xl border border-line p-3 text-sm"}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === "assistant" && m.citedReviewIds.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">{copy.findings.evidence}</p>
                  {m.citedReviewIds.map((id) => {
                    const r = reviews.get(id);
                    return r ? <EvidenceCard key={id} review={r} quote={r.text.slice(0, 160)} sourceName={sourceName(r.placeId)} /> : null;
                  })}
                </div>
              )}
            </div>
          ))}
          {busy && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 size={14} className="animate-spin" aria-hidden /> Reading your reports…</p>}
          {error && <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">{error}</p>}
          <div ref={endRef} />
        </div>
        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor="chat-input" className="sr-only">{copy.chat.placeholder}</label>
          <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={copy.chat.placeholder} disabled={busy} className="min-h-11 flex-1 rounded-lg border border-line px-3 text-sm" />
          <button type="submit" disabled={busy || !draft.trim()} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white disabled:opacity-50">{copy.chat.send}</button>
        </form>
      </div>
    </div>
  );
}
