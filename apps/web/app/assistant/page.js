"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const GREETING = "Hi, I'm here to listen. How are you doing today?";
const STORAGE_PREFIX = "assistant-chat:";

function storageKey(profileId) {
  return `${STORAGE_PREFIX}${profileId}`;
}

function SparkleIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15z" opacity="0.7" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3.4 20.6l17.9-8.2a.6.6 0 000-1.08L3.4 3.1a.6.6 0 00-.85.65l1.8 7.05 10.15 1.2-10.15 1.2-1.8 7.05a.6.6 0 00.85.65z" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AssistantPage() {
  const { token, profile, ready } = useAuth();
  const [messages, setMessages] = useState(() => [{ role: "assistant", content: GREETING, at: new Date().toISOString() }]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  // Restore this profile's saved conversation, if any, before we start persisting.
  useEffect(() => {
    if (!profile) return;
    try {
      const raw = localStorage.getItem(storageKey(profile.profileId));
      const saved = raw ? JSON.parse(raw) : null;
      if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
    } catch {
      // Corrupt or unavailable storage — fall back to the default greeting.
    }
    setHistoryLoaded(true);
  }, [profile]);

  // Persist on every change, but only once the initial restore above has run —
  // otherwise the default greeting would overwrite saved history before it loads.
  useEffect(() => {
    if (!profile || !historyLoaded) return;
    try {
      localStorage.setItem(storageKey(profile.profileId), JSON.stringify(messages));
    } catch {
      // Storage full/unavailable — the conversation just won't survive a reload.
    }
  }, [messages, profile, historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", content: text, at: new Date().toISOString() }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const res = await apiFetch("/assistant/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply, at: new Date().toISOString() }]);
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
    <div className="mx-auto flex max-w-2xl flex-col px-3 py-4 md:px-4 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">AI Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          A supportive space to talk through exam stress, burnout, or anything on your mind.
        </p>
      </div>

      <div className="mt-6 flex h-[calc(100dvh-13rem)] flex-col overflow-hidden rounded-2xl border border-muted/20 bg-surface md:h-[65vh]">
        <div className="flex shrink-0 items-center gap-3 border-b border-muted/20 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-muted text-accent">
            <SparkleIcon />
          </span>
          <div>
            <div className="text-sm font-medium text-ink">Companion</div>
            <div className="text-xs text-muted">Private to you · always here</div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-base/30 px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role !== "user" && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                  <SparkleIcon className="h-3 w-3" />
                </span>
              )}
              <div
                className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  m.role === "user"
                    ? "rounded-br-md bg-accent text-on-accent"
                    : "rounded-bl-md bg-surface text-ink"
                }`}
              >
                {m.content}
                {m.at && (
                  <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-on-accent/70" : "text-muted"}`}>
                    {formatTime(m.at)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-end gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                <SparkleIcon className="h-3 w-3" />
              </span>
              <div className="rounded-2xl rounded-bl-md bg-surface px-3 py-1 shadow-sm">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-4 pb-2 text-xs text-accent">{error}</p>}

        <form onSubmit={sendMessage} className="flex shrink-0 items-center gap-2 border-t border-muted/20 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type how you're feeling…"
            disabled={sending}
            className="flex-1 rounded-full border border-muted/30 bg-base px-4 py-2 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
