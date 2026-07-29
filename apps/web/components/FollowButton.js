"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function FollowButton({ alias, following, onChange, color, className = "" }) {
  const { token, profile } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle(e) {
    e.preventDefault();
    if (!profile) {
      router.push("/login");
      return;
    }
    setPending(true);
    try {
      const action = following ? "unfollow" : "follow";
      await apiFetch(`/profiles/${alias}/${action}`, { method: "POST", token });
      onChange?.(!following);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        following
          ? "border border-muted/30 text-muted hover:border-red-400/50 hover:text-red-400"
          : "text-on-accent hover:opacity-90"
      } ${className}`}
      style={following ? undefined : { background: color }}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
