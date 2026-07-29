"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const FLUSH_INTERVAL_MS = 30_000;

export default function HeartbeatTracker() {
  const { token, profile } = useAuth();
  const pendingSecondsRef = useRef(0);

  useEffect(() => {
    if (!token || !profile) return;

    const tick = setInterval(() => {
      if (document.visibilityState === "visible") {
        pendingSecondsRef.current += 1;
      }
    }, 1000);

    const flush = setInterval(() => {
      const seconds = pendingSecondsRef.current;
      if (seconds <= 0) return;
      pendingSecondsRef.current = 0;
      apiFetch("/me/heartbeat", {
        method: "POST",
        token,
        body: JSON.stringify({ seconds }),
      }).catch(() => {});
    }, FLUSH_INTERVAL_MS);

    return () => {
      clearInterval(tick);
      clearInterval(flush);
    };
  }, [token, profile]);

  return null;
}
