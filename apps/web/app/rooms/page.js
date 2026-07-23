"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";
import { COMMUNITY_CATEGORIES } from "@/lib/communityCategories";

const PAGE_COLOR = "#00e5ff";

const SORTS = [
  { key: "active", label: "Recently Active" },
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "scheduled", label: "Scheduled" },
];

export default function RoomsPage() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState([]);
  const [myRoomIds, setMyRoomIds] = useState(new Set());
  const [sort, setSort] = useState("active");
  const [category, setCategory] = useState("All");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [roomCategory, setRoomCategory] = useState(COMMUNITY_CATEGORIES[0]);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [error, setError] = useState(null);

  async function loadRooms() {
    const params = new URLSearchParams({ sort });
    if (category !== "All") params.set("category", category);
    const [discover, mine] = await Promise.all([
      apiFetch(`/chat/rooms/discover?${params.toString()}`),
      token ? apiFetch("/chat/rooms", { token }) : Promise.resolve([]),
    ]);
    setRooms(discover);
    setMyRoomIds(new Set(mine.map((r) => r.id)));
  }

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sort, category]);

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
        body: JSON.stringify({
          name,
          topic,
          category: roomCategory,
          scheduledFor: scheduling && scheduledFor ? new Date(scheduledFor).toISOString() : null,
        }),
      });
      setName("");
      setTopic("");
      setScheduling(false);
      setScheduledFor("");
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

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sort === s.key ? "text-on-accent" : "border border-muted/20 text-muted hover:text-ink"
            }`}
            style={sort === s.key ? { background: PAGE_COLOR } : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {["All", ...COMMUNITY_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? "border-accent bg-accent-muted text-ink"
                : "border-muted/20 text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3">
            {rooms.map((room) => {
              const color = colorForSlug(room.name);
              const isScheduled = room.scheduledFor && new Date(room.scheduledFor) > new Date();
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-muted/20 bg-surface p-4"
                  style={{ boxShadow: `inset 3px 0 0 0 ${color}` }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{room.name}</span>
                      {room.live && (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          live
                        </span>
                      )}
                      {room.category && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: `${color}26`, color }}
                        >
                          {room.category}
                        </span>
                      )}
                    </div>
                    {room.topic && <div className="mt-0.5 text-sm text-muted">{room.topic}</div>}
                    <div className="mt-1 text-xs text-muted">
                      {room.memberCount} member{room.memberCount === 1 ? "" : "s"}
                      {room.onlineCount > 0 && ` · ${room.onlineCount} online`}
                      {isScheduled && ` · starts ${new Date(room.scheduledFor).toLocaleString()}`}
                    </div>
                  </div>
                  <button
                    onClick={() => joinRoom(room.id)}
                    className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-on-accent hover:opacity-90"
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
                placeholder="Description (optional)"
                className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
              <select
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {COMMUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={scheduling}
                  onChange={(e) => setScheduling(e.target.checked)}
                />
                Schedule for later
              </label>
              {scheduling && (
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              )}

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
