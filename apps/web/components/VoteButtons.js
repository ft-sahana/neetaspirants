"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function VoteButtons({ votableType, votableId, score: initialScore }) {
  const { token, profile } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState(0);

  async function vote(value) {
    if (!profile) return;
    const nextValue = myVote === value ? 0 : value;
    try {
      const res = await apiFetch("/votes", {
        method: "POST",
        token,
        body: JSON.stringify({ votableType, votableId, value: nextValue }),
      });
      setScore(res.score);
      setMyVote(nextValue);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col items-center gap-1 text-muted">
      <button
        onClick={() => vote(1)}
        aria-label="Upvote"
        className={`leading-none ${myVote === 1 ? "text-accent" : "hover:text-ink"}`}
      >
        ▲
      </button>
      <span className="text-xs font-medium text-ink">{score}</span>
      <button
        onClick={() => vote(-1)}
        aria-label="Downvote"
        className={`leading-none ${myVote === -1 ? "text-accent" : "hover:text-ink"}`}
      >
        ▼
      </button>
    </div>
  );
}
