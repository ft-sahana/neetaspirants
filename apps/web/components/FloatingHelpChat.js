"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

const GREETING = "Hi! Ask me anything about how neetaspirants works.";

export default function FloatingHelpChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const res = await apiFetch("/help/chat", {
        method: "POST",
        body: JSON.stringify({ messages: nextMessages }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Help chat is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-24 left-4 z-30 md:bottom-8">
      {open && (
        <div className="mb-3 flex h-96 w-80 flex-col overflow-hidden rounded-2xl border border-muted/20 bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-muted/20 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-ink">App Help</div>
              <div className="text-xs text-muted">How do I use this?</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close help chat"
              className="rounded-full p-1 text-muted hover:bg-base hover:text-ink"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-1.5 text-xs ${
                    m.role === "user" ? "bg-accent text-on-accent" : "bg-base text-ink"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-base px-3 py-1.5 text-xs text-muted">Thinking…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="px-3 pb-1 text-[11px] text-accent">{error}</p>}

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-muted/20 p-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              disabled={sending}
              className="flex-1 rounded-full border border-muted/30 bg-base px-3 py-1.5 text-xs text-ink outline-none focus:border-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help chat" : "Open help chat"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-lg text-on-accent shadow-lg hover:opacity-90"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
