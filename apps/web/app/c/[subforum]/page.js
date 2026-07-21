"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import PostCard from "@/components/PostCard";
import ThreadView from "@/components/ThreadView";
import { colorForSlug } from "@/lib/subforumTheme";
import JoinLeaveButton from "@/components/JoinLeaveButton";

const SORTS = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "top", label: "Top" },
];

export default function SubforumPage() {
  return (
    <Suspense fallback={null}>
      <SubforumPageInner />
    </Suspense>
  );
}

function SubforumPageInner() {
  const { subforum } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, profile, ready } = useAuth();

  const sort = searchParams.get("sort") || "hot";
  const postSlug = searchParams.get("post");
  const color = colorForSlug(subforum);

  const [subforumInfo, setSubforumInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    if (!ready) return;
    apiFetch("/subforums", token ? { token } : {}).then((list) => {
      setSubforumInfo(list.find((sf) => sf.slug === subforum) || null);
    });
  }, [subforum, token, ready]);

  useEffect(() => {
    if (postSlug) return;
    apiFetch(`/subforums/${subforum}/posts?sort=${sort}`).then((page) => setPosts(page.content));
  }, [subforum, sort, postSlug]);

  useEffect(() => {
    if (!postSlug) {
      setActivePost(null);
      return;
    }
    apiFetch(`/posts/${postSlug}`).then(setActivePost);
  }, [postSlug]);

  function setSort(nextSort) {
    router.push(`/c/${subforum}?sort=${nextSort}`);
  }

  if (postSlug) {
    return (
      <div>
        <Link href={`/c/${subforum}`} className="text-sm text-accent">
          ← Back to {subforumInfo?.name || subforum}
        </Link>
        <div className="mt-4">
          {activePost && (
            <ThreadView
              post={activePost}
              onChanged={() => apiFetch(`/posts/${postSlug}`).then(setActivePost)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-2xl border border-muted/20 p-6"
        style={{
          backgroundImage: `linear-gradient(120deg, color-mix(in srgb, ${color} 22%, var(--color-surface)), var(--color-surface) 65%)`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{subforumInfo?.name || subforum}</h1>
            {subforumInfo?.description && (
              <p className="mt-2 max-w-xl text-sm text-muted">{subforumInfo.description}</p>
            )}
            {subforumInfo && (
              <p className="mt-3 text-xs text-muted">
                {subforumInfo.memberCount} member{subforumInfo.memberCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          {subforumInfo && (
            <JoinLeaveButton subforum={subforumInfo} color={color} onChange={setSubforumInfo} />
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-muted/20 bg-surface p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                sort === s.key ? "text-on-accent" : "text-muted hover:text-ink"
              }`}
              style={sort === s.key ? { background: color } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
        {profile && (
          <Link
            href={`/create-post?subforum=${subforum}`}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90"
          >
            New post
          </Link>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} accentColor={color} showCommunity={false} />
        ))}

        {posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-muted/30 px-8 py-16 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
              style={{ background: `${color}26`, color }}
            >
              ✎
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">No posts yet</h2>
              <p className="mt-1 text-sm text-muted">
                Be the first to share something in {subforumInfo?.name || subforum}.
              </p>
            </div>
            {profile ? (
              <Link
                href={`/create-post?subforum=${subforum}`}
                className="rounded-full px-6 py-2.5 font-medium text-on-accent hover:opacity-90"
                style={{ background: color }}
              >
                Create the first post
              </Link>
            ) : (
              <Link href="/signup" className="text-sm text-accent">
                Join anonymously to post
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
