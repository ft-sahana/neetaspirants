"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";
import { timeAgo } from "@/lib/timeAgo";
import PostCard from "@/components/PostCard";

const TABS = [
  { key: "posts", label: "Posts" },
  { key: "comments", label: "Comments" },
  { key: "saved", label: "Saved" },
  { key: "liked", label: "Liked" },
  { key: "communities", label: "Communities" },
  { key: "rooms", label: "Rooms" },
];

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0 && minutes === 0) return "< 1m";
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  );
}

function ProfilePageInner() {
  const { token, profile, ready, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "posts";

  const [me, setMe] = useState(null);
  const [bioDraft, setBioDraft] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [tabData, setTabData] = useState(null);
  const [likedComments, setLikedComments] = useState([]);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch("/me", { token }).then((data) => {
      setMe(data);
      setBioDraft(data.bio || "");
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setTabData(null);
    const endpoints = {
      posts: "/me/activity/posts",
      comments: "/me/activity/comments",
      saved: "/saved-posts",
      liked: "/me/activity/liked-posts",
      communities: "/me/activity/communities",
      rooms: "/me/activity/rooms",
    };
    apiFetch(endpoints[activeTab], { token }).then(setTabData).catch(() => setTabData([]));
    if (activeTab === "liked") {
      apiFetch("/me/activity/liked-comments", { token }).then(setLikedComments).catch(() => setLikedComments([]));
    }
  }, [token, activeTab]);

  function setTab(tab) {
    router.push(`/profile?tab=${tab}`);
  }

  async function saveBio(e) {
    e.preventDefault();
    setSavingBio(true);
    try {
      await apiFetch("/me/bio", { method: "PUT", token, body: JSON.stringify({ bio: bioDraft }) });
      setMe((m) => ({ ...m, bio: bioDraft || null }));
      setEditingBio(false);
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Could not save bio");
    } finally {
      setSavingBio(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (!profile || !me) return null;

  const color = colorForSlug(profile.alias);
  const initial = profile.alias?.[0]?.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div
        className="overflow-hidden rounded-2xl border border-muted/20 p-8 text-center"
        style={{
          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${color} 25%, var(--color-surface)), var(--color-surface) 70%)`,
        }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
          style={{ background: color, color: "#0a0a12", boxShadow: `0 0 24px ${color}66` }}
        >
          {initial}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-ink">{profile.alias}</h1>

        {editingBio ? (
          <form onSubmit={saveBio} className="mx-auto mt-3 flex max-w-md flex-col gap-2">
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Tell people a little about yourself…"
              className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <div className="flex justify-center gap-2">
              <button
                type="submit"
                disabled={savingBio}
                className="rounded-full px-4 py-1.5 text-xs font-medium text-on-accent disabled:opacity-60"
                style={{ background: color }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingBio(false);
                  setBioDraft(me.bio || "");
                }}
                className="rounded-full border border-muted/30 px-4 py-1.5 text-xs text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setEditingBio(true)} className="mx-auto mt-2 block max-w-md text-sm">
            {me.bio ? (
              <span className="text-muted">{me.bio}</span>
            ) : (
              <span className="text-muted/60 italic">Add a bio…</span>
            )}
          </button>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <span className="text-muted">
            <span className="font-semibold text-ink">{me.followerCount}</span> followers
          </span>
          <span className="text-muted">
            <span className="font-semibold text-ink">{me.followingCount}</span> following
          </span>
          <Link href={`/u/${profile.alias}`} className="text-xs text-accent">
            View public profile
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: `${color}26`, color }}
          >
            🔥 {me.currentStreak}-day streak{me.activeToday ? "" : " (visit today!)"}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-muted/20 px-3 py-1 text-xs text-muted">
            ⏱ {formatDuration(me.totalActiveSeconds)} in app
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === t.key ? "text-on-accent" : "border border-muted/20 text-muted hover:text-ink"
            }`}
            style={activeTab === t.key ? { background: color } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {tabData === null && <p className="text-sm text-muted">Loading…</p>}

        {tabData !== null && (activeTab === "posts" || activeTab === "saved") && (
          <>
            {tabData.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}
            {tabData.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </>
        )}

        {tabData !== null && activeTab === "comments" && (
          <>
            {tabData.length === 0 && <p className="text-sm text-muted">No comments yet.</p>}
            {tabData.map((c) => (
              <CommentRow key={c.id} comment={c} />
            ))}
          </>
        )}

        {tabData !== null && activeTab === "liked" && (
          <>
            {tabData.length === 0 && likedComments.length === 0 && (
              <p className="text-sm text-muted">Nothing liked yet.</p>
            )}
            {tabData.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {likedComments.map((c) => (
              <CommentRow key={c.id} comment={c} />
            ))}
          </>
        )}

        {tabData !== null && activeTab === "communities" && (
          <>
            {tabData.length === 0 && <p className="text-sm text-muted">No communities joined yet.</p>}
            {tabData.map((sf) => (
              <Link
                key={sf.id}
                href={`/c/${sf.slug}`}
                className="flex items-center justify-between rounded-xl border border-muted/20 bg-surface p-4"
                style={{ boxShadow: `inset 3px 0 0 0 ${colorForSlug(sf.slug)}` }}
              >
                <div>
                  <div className="font-medium text-ink">{sf.name}</div>
                  <div className="text-xs text-muted">{sf.memberCount} members</div>
                </div>
              </Link>
            ))}
          </>
        )}

        {tabData !== null && activeTab === "rooms" && (
          <>
            {tabData.length === 0 && <p className="text-sm text-muted">No rooms joined yet.</p>}
            {tabData.map((room) => (
              <Link
                key={room.id}
                href={`/chat?roomId=${room.id}`}
                className="flex items-center justify-between rounded-xl border border-muted/20 bg-surface p-4"
                style={{ boxShadow: `inset 3px 0 0 0 ${colorForSlug(room.name)}` }}
              >
                <div>
                  <div className="font-medium text-ink">{room.name}</div>
                  <div className="text-xs text-muted">{room.memberCount} members</div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 w-full rounded-full border px-6 py-2.5 font-medium text-ink hover:bg-surface"
        style={{ borderColor: color }}
      >
        Log out
      </button>
    </div>
  );
}

function CommentRow({ comment }) {
  return (
    <Link
      href={`/c/${comment.subforumSlug}?post=${comment.postSlug}`}
      className="block rounded-xl border border-muted/20 bg-surface p-4 hover:border-accent/40"
    >
      <div className="text-xs text-muted">
        on <span className="text-ink">{comment.postTitle}</span> · {timeAgo(comment.createdAt)}
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-ink">{comment.body}</p>
    </Link>
  );
}
