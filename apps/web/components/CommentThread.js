"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import VoteButtons from "@/components/VoteButtons";

export default function CommentThread({ comment, postId, onReply }) {
  const { token, profile } = useAuth();
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReport() {
    const detail = window.prompt("What's wrong with this comment? (optional)");
    if (detail === null) return;
    try {
      await apiFetch(`/comments/${comment.id}/report`, {
        method: "POST",
        token,
        body: JSON.stringify({ reasonCode: "OTHER", detail: detail || null }),
      });
      window.alert("Thanks — this comment has been flagged for review.");
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : "Failed to report this comment");
    }
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ body, parentCommentId: comment.id }),
      });
      setBody("");
      setReplying(false);
      onReply?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-3">
      <VoteButtons votableType="COMMENT" votableId={comment.id} score={comment.score} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted">{comment.authorAlias}</div>
        <p className="mt-1 text-sm text-ink">{comment.body}</p>

        {profile && (
          <div className="mt-1 flex gap-3">
            <button
              onClick={() => setReplying((r) => !r)}
              className="text-xs text-muted hover:text-accent"
            >
              Reply
            </button>
            <button onClick={handleReport} className="text-xs text-muted hover:text-accent">
              Report
            </button>
          </div>
        )}

        {replying && (
          <form onSubmit={submitReply} className="mt-2 flex flex-col gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              className="rounded-lg border border-muted/30 bg-base px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={submitting}
              className="self-start rounded-full bg-accent-muted px-4 py-1 text-xs text-ink hover:opacity-90 disabled:opacity-60"
            >
              Reply
            </button>
          </form>
        )}

        {comment.replies?.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l border-muted/20 pl-4">
            {comment.replies.map((reply) => (
              <CommentThread key={reply.id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
