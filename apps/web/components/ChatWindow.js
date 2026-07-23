"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { useChatSocket } from "@/lib/useChatSocket";
import MessageBubble from "@/components/MessageBubble";

export default function ChatWindow({ room }) {
  const { token, profile } = useAuth();
  const { client, connected } = useChatSocket(token);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typingAlias, setTypingAlias] = useState(null);
  const [onlineAliases, setOnlineAliases] = useState([]);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

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
    <div className="flex h-[70vh] flex-col rounded-xl border border-muted/20 bg-surface">
      <div className="border-b border-muted/20 px-4 py-3">
        <div className="font-medium text-ink">{room.name || "Direct message"}</div>
        {room.topic && <div className="text-xs text-muted">{room.topic}</div>}
        <div className="text-xs text-muted">
          {!connected
            ? "connecting…"
            : onlineAliases.length > 0
              ? `${onlineAliases.length} online · ${onlineAliases.join(", ")}`
              : "online"}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} isOwn={m.senderAlias === profile?.alias} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="h-5 px-4 text-xs text-muted">
        {typingAlias ? `${typingAlias} is typing…` : ""}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-muted/20 p-3">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyTyping(true);
          }}
          onBlur={() => notifyTyping(false)}
          placeholder="Say something supportive…"
          className="flex-1 rounded-full border border-muted/30 bg-base px-4 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90"
        >
          Send
        </button>
      </form>
    </div>
  );
}
