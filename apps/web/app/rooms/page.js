"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";

const PAGE_COLOR = "#00e5ff";

export default function RoomsPage() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [myRoomIds, setMyRoomIds] = useState(new Set());
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState(null);

  async function loadRooms() {
    const [discover, mine] = await Promise.all([
      apiFetch("/chat/rooms/discover"),
      token ? apiFetch("/chat/rooms", { token }) : Promise.resolve([]),
    ]);
    setRooms(discover);
    setMyRoomIds(new Set(mine.map((r) => r.id)));
  }

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function joinRoom(roomId) {
    if (!profile) {
      router.push("/login");
      return;
    }
    await apiFetch(`/chat/rooms/group/${roomId}/join`, { method: "POST", token });
    router.push(`/chat?roomId=${roomId}`);
  }

  async function createRoom(e) {
    e.preventDefault();
    if (!profile) {
      router.push("/login");
      return;
    }
    setError(null);
    try {
      const room = await apiFetch("/chat/rooms/group", {
        method: "POST",
        token,
        body: JSON.stringify({ name, topic }),
      });
      setName("");
      setTopic("");
      router.push(`/chat?roomId=${room.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create room");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div
        className="relative overflow-hidden rounded-2xl border border-muted/20 p-6"
        style={{
          backgroundImage: `linear-gradient(120deg, color-mix(in srgb, ${PAGE_COLOR} 22%, var(--color-surface)), var(--color-surface) 65%)`,
        }}
      >
        <h1 className="text-2xl font-semibold text-ink">Rooms</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Join a topic-based group room, or start your own.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3">
            {rooms.map((room) => {
              const color = colorForSlug(room.name);
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between rounded-xl border border-muted/20 bg-surface p-4"
                  style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
                >
                  <div>
                    <div className="font-medium text-ink">{room.name}</div>
                    {room.topic && <div className="text-sm text-muted">{room.topic}</div>}
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-on-accent hover:opacity-90"
                    style={{ background: myRoomIds.has(room.id) ? "var(--color-accent-muted)" : color, color: myRoomIds.has(room.id) ? undefined : "#0a0a12" }}
                  >
                    {myRoomIds.has(room.id) ? "Open" : "Join"}
                  </button>
                </div>
              );
            })}

            {rooms.length === 0 && (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-muted/30 px-8 py-16 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                  style={{ background: `${PAGE_COLOR}26`, color: PAGE_COLOR }}
                >
                  💬
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-ink">No rooms yet</h2>
                  <p className="mt-1 text-sm text-muted">Be the first to start a group room.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {ready && profile && (
          <div className="w-full shrink-0 sm:w-72">
            <form
              onSubmit={createRoom}
              className="flex flex-col gap-3 rounded-2xl border border-muted/20 bg-surface p-4"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Start a new room
              </h2>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Room name, e.g. Late-night grind"
                className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Topic (optional)"
                className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
              {error && <p className="text-sm text-accent">{error}</p>}
              <button
                type="submit"
                className="self-start rounded-full px-5 py-2 text-sm font-medium hover:opacity-90"
                style={{ background: PAGE_COLOR, color: "#0a0a12" }}
              >
                Create room
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
