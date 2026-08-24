"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const POLL_INTERVAL_MS = 30000;

/** Polls the unread DM/message-request count while a profile is logged in. */
export function useUnreadMessages() {
  const { token, profile, ready } = useAuth();
  const [count, setCount] = useState(0);
  const authed = ready && Boolean(token) && Boolean(profile);

  useEffect(() => {
    if (!authed) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch("/chat/unread-count", { token });
        if (!cancelled) setCount(data?.count ?? 0);
      } catch {
        // Ignore transient errors (e.g. token expiry mid-poll); next tick retries.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [authed, token]);

  return authed ? count : 0;
}
