"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/timeAgo";

const TYPE_META = {
  REPLY: { icon: "💬", label: "Reply" },
  UPVOTE: { icon: "⬆️", label: "Upvote" },
  MENTION: { icon: "📣", label: "Mention" },
};

export default function NotificationsPage() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  useEffect(() => {
    if (!token) return;
    apiFetch("/notifications", { token })
      .then(setNotifications)
      .catch(() => setError("Could not load notifications."));
  }, [token]);

  async function markAllRead() {
    if (!token || marking) return;
    setMarking(true);
    try {
      await apiFetch("/notifications/mark-all-read", { method: "POST", token });
      setNotifications((prev) => (prev ? prev.map((n) => ({ ...n, read: true })) : prev));
    } catch {
      setError("Could not mark notifications as read.");
    } finally {
      setMarking(false);
    }
  }

  function openNotification(n) {
    if (n.subforumSlug && n.postSlug) {
      router.push(`/c/${n.subforumSlug}?post=${n.postSlug}`);
    }
  }

  if (!ready || !profile) return null;

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-muted">Replies, upvotes, and mentions land here.</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unreadCount === 0 || marking}
          className="shrink-0 rounded-full border border-muted/30 px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark all as read
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {notifications === null && !error && (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        )}

        {notifications?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-muted/30 px-8 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-2xl">
              🔔
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Nothing yet</h2>
              <p className="mt-1 text-sm text-muted">
                You&apos;ll see replies, upvotes, and mentions here.
              </p>
            </div>
          </div>
        )}

        {notifications?.map((n) => {
          const meta = TYPE_META[n.type] || { icon: "🔔", label: n.type };
          const clickable = Boolean(n.subforumSlug && n.postSlug);
          return (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              disabled={!clickable}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                n.read
                  ? "border-muted/20 bg-surface"
                  : "border-accent/30 bg-accent-muted"
              } ${clickable ? "hover:border-accent/50" : "cursor-default"}`}
            >
              <Avatar alias={n.actorAlias} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{meta.icon}</span>
                  <span className="uppercase tracking-wide">{meta.label}</span>
                  <span>·</span>
                  <span>{timeAgo(n.createdAt)}</span>
                  {!n.read && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent" />
                  )}
                </div>
                <p className="mt-1 text-sm text-ink">{n.message}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
