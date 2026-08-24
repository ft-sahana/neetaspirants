"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useChatSocket } from "@/lib/useChatSocket";
import Avatar from "@/components/Avatar";
import MessageBubble from "@/components/MessageBubble";

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M3.4 20.6l17.9-8.2a.6.6 0 000-1.08L3.4 3.1a.6.6 0 00-.85.65l1.8 7.05 10.15 1.2-10.15 1.2-1.8 7.05a.6.6 0 00.85.65z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatWindow({ room, onRespond, onBack }) {
  const { token, profile } = useAuth();
  const { client, connected } = useChatSocket(token);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typingAlias, setTypingAlias] = useState(null);
  const [onlineAliases, setOnlineAliases] = useState([]);
  const [responding, setResponding] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  const roomTitle = room.name || room.otherAlias || "Direct message";
  const pendingForMe = room.type === "DM" && room.dmStatus === "PENDING" && !room.dmRequestedByMe;
  const pendingForThem = room.type === "DM" && room.dmStatus === "PENDING" && room.dmRequestedByMe;
  const isOnline = onlineAliases.length > 0;

  async function respond(accept) {
    if (!onRespond || responding) return;
    setResponding(true);
    try {
      await onRespond(accept);
    } finally {
      setResponding(false);
    }
  }

  useEffect(() => {
    setMessages([]);
    apiFetch(`/chat/rooms/${room.id}/messages`, { token }).then(setMessages);
  }, [room.id, token]);

  useEffect(() => {
    setOnlineAliases([]);
    apiFetch(`/chat/rooms/${room.id}/presence`, { token })
      .then((event) => setOnlineAliases(event.onlineAliases || []))
      .catch(() => {});
  }, [room.id, token]);

  useEffect(() => {
    if (!client || !connected) return;

    // Subscribe to presence first: the server broadcasts presence as a side
    // effect of the room-topic subscribe below, so this must already be
    // listening or it misses its own initial broadcast.
    const presenceSub = client.subscribe(`/topic/room/${room.id}/presence`, (frame) => {
      const event = JSON.parse(frame.body);
      setOnlineAliases(event.onlineAliases || []);
    });

    const messageSub = client.subscribe(`/topic/room/${room.id}`, (frame) => {
      const message = JSON.parse(frame.body);
      setMessages((prev) => [...prev, message]);
    });

    const typingSub = client.subscribe(`/topic/room/${room.id}/typing`, (frame) => {
      const event = JSON.parse(frame.body);
      if (event.alias === profile?.alias) return;
      setTypingAlias(event.typing ? event.alias : null);
      if (event.typing) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingAlias(null), 3000);
      }
    });

    return () => {
      messageSub.unsubscribe();
      typingSub.unsubscribe();
      presenceSub.unsubscribe();
      setOnlineAliases([]);
    };
  }, [client, connected, room.id, profile?.alias]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim() || !client || !connected) return;
    client.publish({
      destination: `/app/chat.send/${room.id}`,
      body: JSON.stringify({ body: draft }),
    });
    setDraft("");
  }

  function notifyTyping(isTyping) {
    if (!client || !connected) return;
    client.publish({
      destination: `/app/chat.typing/${room.id}`,
      body: JSON.stringify({ alias: profile?.alias, typing: isTyping }),
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-muted/20 px-4 py-3">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back to conversations"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-ink md:hidden"
          >
            <BackIcon />
          </button>
        )}
        <Avatar alias={roomTitle} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-ink">{roomTitle}</div>
          {room.topic && !pendingForMe && !pendingForThem && (
            <div className="truncate text-xs text-muted">{room.topic}</div>
          )}
          {pendingForMe && <div className="text-xs font-medium text-accent">Message request</div>}
          {pendingForThem && <div className="text-xs text-muted">Pending — waiting for them to accept</div>}
          {!pendingForMe && !pendingForThem && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {connected && (
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-muted/50"}`} />
              )}
              <span>
                {!connected
                  ? "connecting…"
                  : isOnline
                    ? `${onlineAliases.length} online · ${onlineAliases.join(", ")}`
                    : "offline"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-base/30 px-4 py-3">
        {messages.length === 0 && !pendingForMe && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-ink">No messages yet</p>
            <p className="text-xs text-muted">Say hello to start the conversation.</p>
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.senderAlias === profile?.alias} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 shrink-0 px-4 text-xs text-muted">
        {typingAlias ? `${typingAlias} is typing…` : ""}
      </div>

      {pendingForMe ? (
        <div className="shrink-0 border-t border-muted/20 bg-accent/5 p-3">
          <p className="px-1 text-xs text-muted">Accept to reply, or decline to remove this request.</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => respond(true)}
              disabled={responding}
              className="flex-1 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respond(false)}
              disabled={responding}
              className="flex-1 rounded-full border border-muted/30 px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={sendMessage} className="flex shrink-0 items-center gap-2 border-t border-muted/20 p-3">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping(true);
            }}
            onBlur={() => notifyTyping(false)}
            placeholder="Say something supportive…"
            className="flex-1 rounded-full border border-muted/30 bg-base px-4 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </form>
      )}
    </div>
  );
}
