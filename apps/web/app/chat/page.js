"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import ChatWindow from "@/components/ChatWindow";
import { timeAgo } from "@/lib/timeAgo";

const SEARCH_DEBOUNCE_MS = 250;

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.5-4.5" strokeLinecap="round" />
    </svg>
  );
}

function EnvelopeIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7l7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [rooms, setRooms] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [busyRoomId, setBusyRoomId] = useState(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  async function loadRooms(preselectRoomId) {
    const data = await apiFetch("/chat/rooms", { token });
    setRooms(data);
    const targetId = preselectRoomId ?? Number(searchParams.get("roomId"));
    if (targetId) {
      const match = data.find((r) => r.id === targetId);
      if (match) setSelectedRoom(match);
    }
  }

  useEffect(() => {
    if (token) loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await apiFetch(`/profiles/search?alias=${encodeURIComponent(query.trim())}&limit=6`, { token });
        setResults(matches);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(searchTimeout.current);
  }, [query, token]);

  async function startDm(otherProfileId) {
    setError(null);
    try {
      const room = await apiFetch("/chat/rooms/dm", {
        method: "POST",
        token,
        body: JSON.stringify({ otherProfileId }),
      });
      setQuery("");
      setResults([]);
      await loadRooms(room.id);
      setSelectedRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start that conversation");
    }
  }

  async function respondToRequest(room, accept) {
    setBusyRoomId(room.id);
    setError(null);
    try {
      if (accept) {
        await apiFetch(`/chat/rooms/${room.id}/accept`, { method: "POST", token });
        await loadRooms(room.id);
      } else {
        await apiFetch(`/chat/rooms/${room.id}/decline`, { method: "POST", token });
        if (selectedRoom?.id === room.id) setSelectedRoom(null);
        await loadRooms();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update that request");
    } finally {
      setBusyRoomId(null);
    }
  }

  const { conversations, requests } = useMemo(() => {
    const conv = [];
    const req = [];
    for (const room of rooms ?? []) {
      if (room.type === "DM" && room.dmStatus === "PENDING" && !room.dmRequestedByMe) {
        req.push(room);
      } else {
        conv.push(room);
      }
    }
    conv.sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));
    return { conversations: conv, requests: req };
  }, [rooms]);

  function roomLabel(room) {
    if (room.type === "DM") return room.otherAlias || "Direct message";
    return room.name;
  }

  function previewFor(room) {
    if (room.type === "DM" && room.dmStatus === "PENDING" && room.dmRequestedByMe) {
      return "Waiting for them to accept…";
    }
    if (!room.lastMessagePreview) {
      return room.type === "GROUP" ? room.topic || "No messages yet" : "Say hello 👋";
    }
    const mine = room.lastMessageSenderAlias === profile?.alias;
    return `${mine ? "You: " : ""}${room.lastMessagePreview}`;
  }

  const hasAnything = rooms !== null && (conversations.length > 0 || requests.length > 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col px-3 py-4 md:px-4 md:py-10">
      <h1 className="text-2xl font-semibold text-ink">Messages</h1>
      <p className="mt-1 text-sm text-muted">Direct conversations with people you've connected with.</p>

      <div className="mt-6 flex h-[calc(100dvh-13rem)] min-h-[420px] overflow-hidden rounded-2xl border border-muted/20 bg-surface md:h-[75vh]">
        <aside
          className={`w-full shrink-0 flex-col border-r border-muted/20 md:flex md:w-80 ${
            selectedRoom ? "hidden" : "flex"
          }`}
        >
          <div className="shrink-0 p-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <SearchIcon />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Message someone by alias…"
                className="w-full rounded-full border border-muted/25 bg-base px-9 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
              />
              {query.trim() && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-muted/20 bg-surface shadow-xl">
                  {searching && <div className="px-3 py-2.5 text-xs text-muted">Searching…</div>}
                  {!searching && results.length === 0 && (
                    <div className="px-3 py-2.5 text-xs text-muted">No one found</div>
                  )}
                  {!searching &&
                    results.map((r) => (
                      <button
                        key={r.profileId}
                        onClick={() => startDm(r.profileId)}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-base"
                      >
                        <Avatar alias={r.alias} size={28} />
                        {r.alias}
                      </button>
                    ))}
                </div>
              )}
            </div>
            {error && <p className="mt-2 px-1 text-xs text-accent">{error}</p>}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-2">
            {rooms === null && <p className="px-4 py-3 text-sm text-muted">Loading…</p>}

            {rooms !== null && !hasAnything && (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-accent">
                  <EnvelopeIcon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">No messages yet</h2>
                  <p className="mt-1 text-xs text-muted">
                    Search for someone above, or join a room from{" "}
                    <a href="/rooms" className="text-accent hover:underline">
                      Rooms
                    </a>
                    .
                  </p>
                </div>
              </div>
            )}

            {requests.length > 0 && (
              <div className="mt-2 px-3">
                <h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Message requests
                </h2>
                <div className="flex flex-col gap-2">
                  {requests.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5"
                    >
                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="flex w-full items-center gap-2.5 text-left"
                      >
                        <Avatar alias={room.otherAlias} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink">{room.otherAlias}</div>
                          {room.lastMessagePreview && (
                            <div className="truncate text-xs text-muted">{room.lastMessagePreview}</div>
                          )}
                        </div>
                      </button>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => respondToRequest(room, true)}
                          disabled={busyRoomId === room.id}
                          className="flex-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => respondToRequest(room, false)}
                          disabled={busyRoomId === room.id}
                          className="flex-1 rounded-full border border-muted/30 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {conversations.length > 0 && (
              <div className="mt-4">
                {requests.length > 0 && (
                  <h2 className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Conversations
                  </h2>
                )}
                <div className="flex flex-col">
                  {conversations.map((room) => {
                    const selected = selectedRoom?.id === room.id;
                    const pendingByMe = room.type === "DM" && room.dmStatus === "PENDING" && room.dmRequestedByMe;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          selected ? "bg-accent-muted" : "hover:bg-base"
                        }`}
                      >
                        <Avatar alias={roomLabel(room)} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-ink">{roomLabel(room)}</span>
                            <span className="shrink-0 text-[10.5px] text-muted">
                              {timeAgo(room.lastActivityAt)}
                            </span>
                          </div>
                          <div
                            className={`truncate text-xs ${pendingByMe ? "italic text-muted/80" : "text-muted"}`}
                          >
                            {previewFor(room)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className={`min-w-0 flex-1 flex-col md:flex ${selectedRoom ? "flex" : "hidden"}`}>
          {selectedRoom ? (
            <ChatWindow
              room={selectedRoom}
              onRespond={(accept) => respondToRequest(selectedRoom, accept)}
              onBack={() => setSelectedRoom(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-base text-muted">
                <EnvelopeIcon className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">Pick a conversation</h2>
                <p className="mt-1 text-xs text-muted">Choose someone from the list to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
