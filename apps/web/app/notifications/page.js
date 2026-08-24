"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/timeAgo";
import { announceNotificationsChanged } from "@/lib/notificationEvents";

function ReplyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path d="M9 8L4 12l5 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12h9a6 6 0 016 6v1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpvoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M12 19V6M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FollowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <circle cx="10" cy="8" r="3.2" />
      <path d="M4 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
      <path d="M18 8v4M16 10h4" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path
        d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v7a2.5 2.5 0 01-2.5 2.5H9l-4 3v-3H6.5A2.5 2.5 0 014 13.5v-7z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnvelopeIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7l7.5 6 7.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.5 7.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  );
}

const TYPE_META = {
  REPLY: { icon: ReplyIcon, label: "Reply", color: "var(--color-accent)" },
  UPVOTE: { icon: UpvoteIcon, label: "Upvote", color: "#34d399" },
  MENTION: { icon: AtIcon, label: "Mention", color: "#fbbf24" },
  FOLLOW: { icon: FollowIcon, label: "Follow", color: "#38bdf8" },
  DM_REQUEST: { icon: EnvelopeIcon, label: "Message request", color: "var(--color-accent)" },
  MESSAGE: { icon: MessageIcon, label: "Message", color: "var(--color-accent)" },
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
      announceNotificationsChanged();
    } catch {
      setError("Could not mark notifications as read.");
    } finally {
      setMarking(false);
    }
  }

  async function openNotification(n) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      apiFetch(`/notifications/${n.id}/mark-read`, { method: "POST", token })
        .then(announceNotificationsChanged)
        .catch(() => {});
    }
    if (n.chatRoomId) {
      router.push(`/chat?roomId=${n.chatRoomId}`);
    } else if (n.subforumSlug && n.postSlug) {
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
          <p className="mt-1 text-sm text-muted">Replies, upvotes, mentions, and messages land here.</p>
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-muted/20 bg-surface">
        {notifications === null && !error && <p className="py-10 text-center text-sm text-muted">Loading…</p>}

        {notifications?.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-accent">
              <BellIcon />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">Nothing yet</h2>
              <p className="mt-1 text-sm text-muted">You&apos;ll see replies, upvotes, and mentions here.</p>
            </div>
          </div>
        )}

        {notifications?.map((n, i) => {
          const meta = TYPE_META[n.type] || { icon: BellIcon, label: n.type, color: "var(--color-muted)" };
          const Icon = meta.icon;
          const clickable = Boolean(n.chatRoomId || (n.subforumSlug && n.postSlug));
          return (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              disabled={!clickable && n.read}
              className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                i > 0 ? "border-t border-muted/10" : ""
              } ${n.read ? "" : "bg-accent/5"} ${clickable ? "hover:bg-base" : n.read ? "cursor-default" : "hover:bg-base"}`}
            >
              <div className="relative shrink-0">
                <Avatar alias={n.actorAlias} size={38} />
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface text-white"
                  style={{ background: meta.color }}
                >
                  <Icon />
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm ${n.read ? "text-ink" : "font-medium text-ink"}`}>{n.message}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <span>{meta.label}</span>
                  <span>·</span>
                  <span>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
