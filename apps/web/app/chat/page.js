"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import ChatWindow from "@/components/ChatWindow";

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

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [dmProfileId, setDmProfileId] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  async function loadRooms() {
    const data = await apiFetch("/chat/rooms", { token });
    setRooms(data);
    const preselectId = Number(searchParams.get("roomId"));
    if (preselectId) {
      const match = data.find((r) => r.id === preselectId);
      if (match) setSelectedRoom(match);
    }
  }

  useEffect(() => {
    if (token) loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function startDm(e) {
    e.preventDefault();
    setError(null);
    try {
      const room = await apiFetch("/chat/rooms/dm", {
        method: "POST",
        token,
        body: JSON.stringify({ otherProfileId: Number(dmProfileId) }),
      });
      setDmProfileId("");
      await loadRooms();
      setSelectedRoom(room);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start that conversation");
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="w-64 shrink-0">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Conversations
        </h2>
        <div className="flex flex-col gap-1">
          {rooms.length === 0 && (
            <p className="text-sm text-muted">
              No conversations yet — join a room from{" "}
              <a href="/rooms" className="text-accent">
                Rooms
              </a>
              .
            </p>
          )}
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room)}
              className={`rounded-lg px-3 py-2 text-left text-sm ${
                selectedRoom?.id === room.id
                  ? "bg-accent-muted text-ink"
                  : "text-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {room.type === "DM" ? "Direct message" : room.name}
            </button>
          ))}
        </div>

        <form onSubmit={startDm} className="mt-6 flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Start a DM
          </label>
          <input
            value={dmProfileId}
            onChange={(e) => setDmProfileId(e.target.value)}
            placeholder="Their profile ID"
            className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-full bg-accent-muted px-4 py-1.5 text-sm text-ink hover:opacity-90"
          >
            Message
          </button>
          {error && <p className="text-xs text-accent">{error}</p>}
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        {selectedRoom ? (
          <ChatWindow room={selectedRoom} />
        ) : (
          <p className="text-sm text-muted">Pick a conversation to get started.</p>
        )}
      </div>
    </div>
  );
}
