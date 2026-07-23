"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import VoteButtons from "@/components/VoteButtons";
import CommentThread from "@/components/CommentThread";

export default function ThreadView({ post, onChanged }) {
  const { token, profile } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitComment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/posts/${post.id}/comments`, {
        method: "POST",
        token,
        body: JSON.stringify({ body }),
      });
      setBody("");
      onChanged?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 rounded-xl border border-muted/20 bg-surface p-4">
        <VoteButtons votableType="POST" votableId={post.id} score={post.score} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold text-ink">{post.title}</h1>
          <div className="mt-1 text-xs text-muted">Posted by {post.authorAlias}</div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{post.body}</p>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="mt-3 max-h-[32rem] w-full rounded-lg border border-muted/20 object-contain"
            />
          )}
        </div>
      </div>

      {profile && (
        <form onSubmit={submitComment} className="flex flex-col gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
          >
            Comment
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {post.comments?.map((comment) => (
          <CommentThread key={comment.id} comment={comment} postId={post.id} onReply={onChanged} />
        ))}
        {(!post.comments || post.comments.length === 0) && (
          <p className="text-sm text-muted">No comments yet.</p>
        )}
      </div>
    </div>
  );
}
