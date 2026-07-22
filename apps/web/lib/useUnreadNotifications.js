"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const POLL_INTERVAL_MS = 30000;

/** Polls the unread notification count while a profile is logged in. */
export function useUnreadNotifications() {
  const { token, profile, ready } = useAuth();
  const [count, setCount] = useState(0);
  const authed = ready && Boolean(token) && Boolean(profile);

  useEffect(() => {
    if (!authed) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch("/notifications/unread-count", { token });
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

  // Derived rather than reset via setState so logging out clears the badge instantly.
  return authed ? count : 0;
}
