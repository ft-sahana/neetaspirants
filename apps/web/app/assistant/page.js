"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const GREETING = "Hi, I'm here to listen. How are you doing today?";

export default function AssistantPage() {
  const { token, profile, ready } = useAuth();
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const res = await apiFetch("/assistant/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ messages: nextMessages }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The assistant is unavailable right now.");
    } finally {
      setSending(false);
    }
  }

  if (ready && !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink">AI Assistant</h1>
        <p className="mt-2 text-sm text-muted">Sign in to talk with the assistant.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          A supportive space to talk through exam stress, burnout, or anything on your mind.
        </p>
      </div>

      <div className="mt-6 flex h-[65vh] flex-col rounded-xl border border-muted/20 bg-surface">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user" ? "bg-accent text-on-accent" : "bg-base text-ink"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-base px-4 py-2 text-sm text-muted">Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-4 pb-2 text-xs text-accent">{error}</p>}

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-muted/20 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type how you're feeling…"
            disabled={sending}
            className="flex-1 rounded-full border border-muted/30 bg-base px-4 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
