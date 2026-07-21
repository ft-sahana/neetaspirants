"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function JoinLeaveButton({ subforum, color, onChange, className = "" }) {
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
      const action = subforum.joined ? "leave" : "join";
      const updated = await apiFetch(`/subforums/${subforum.slug}/${action}`, {
        method: "POST",
        token,
      });
      onChange?.(updated);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        subforum.joined
          ? "border border-muted/30 text-muted hover:border-red-400/50 hover:text-red-400"
          : "text-on-accent hover:opacity-90"
      } ${className}`}
      style={subforum.joined ? undefined : { background: color }}
    >
      {subforum.joined ? "Joined" : "Join"}
    </button>
  );
}
