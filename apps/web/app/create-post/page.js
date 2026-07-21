"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

export default function CreatePostPage() {
  return (
    <Suspense fallback={null}>
      <CreatePostPageInner />
    </Suspense>
  );
}

function CreatePostPageInner() {
  const { token, profile, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subforums, setSubforums] = useState([]);
  const [subforumSlug, setSubforumSlug] = useState(searchParams.get("subforum") || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  useEffect(() => {
    apiFetch("/subforums").then((list) => {
      setSubforums(list);
      if (!subforumSlug && list.length > 0) setSubforumSlug(list[0].slug);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const post = await apiFetch("/posts", {
        method: "POST",
        token,
        body: JSON.stringify({ subforumSlug, title, body }),
      });
      router.push(`/c/${post.subforumSlug}?post=${post.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-ink">New post</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Sub-forum
          <select
            value={subforumSlug}
            onChange={(e) => setSubforumSlug(e.target.value)}
            className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          >
            {subforums.map((sf) => (
              <option key={sf.id} value={sf.slug}>
                {sf.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Title
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Body
          <textarea
            required
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </label>

        {error && <p className="text-sm text-accent">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-full bg-accent px-6 py-2.5 font-medium text-on-accent hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
