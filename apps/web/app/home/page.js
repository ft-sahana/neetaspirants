"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import PostCard from "@/components/PostCard";
import { colorForSlug } from "@/lib/subforumTheme";

const SORTS = [
  { key: "trending", label: "Trending", backendSort: "hot" },
  { key: "latest", label: "Latest", backendSort: "new" },
  { key: "top", label: "Most Upvoted", backendSort: "top" },
  { key: "active", label: "Recently Active", backendSort: "hot" },
  { key: "recommended", label: "Recommended", backendSort: "hot" },
];

const PAGE_SIZE = 10;

function hoursSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

function rankPosts(posts, sortKey) {
  const copy = [...posts];
  switch (sortKey) {
    case "latest":
      return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case "top":
      return copy.sort((a, b) => b.score - a.score);
    case "active":
      return copy.sort(
        (a, b) =>
          (b.commentCount ?? 0) / Math.pow(hoursSince(b.createdAt) + 2, 1.2) -
          (a.commentCount ?? 0) / Math.pow(hoursSince(a.createdAt) + 2, 1.2)
      );
    case "trending":
    case "recommended":
    default:
      return copy.sort(
        (a, b) =>
          b.score / Math.pow(hoursSince(b.createdAt) + 2, 1.5) -
          a.score / Math.pow(hoursSince(a.createdAt) + 2, 1.5)
      );
  }
}

function mergeUnique(existing, incoming) {
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const post of incoming) byId.set(post.id, post);
  return [...byId.values()];
}

export default function HomeFeedPage() {
  const { profile } = useAuth();
  const [subforums, setSubforums] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sort, setSort] = useState("trending");
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef(null);
  const pullStartY = useRef(null);
  const loadTokenRef = useRef(0);

  useEffect(() => {
    apiFetch("/subforums").then(setSubforums).catch(() => {});
  }, []);

  const sortConfig = SORTS.find((s) => s.key === sort) ?? SORTS[0];

  const loadPage = useCallback(
    async (pageNum, replace, slugs) => {
      if (slugs.length === 0) return;
      const token = ++loadTokenRef.current;
      setLoading(true);
      try {
        const results = await Promise.all(
          slugs.map((slug) =>
            apiFetch(`/subforums/${slug}/posts?sort=${sortConfig.backendSort}&page=${pageNum}&size=${PAGE_SIZE}`)
              .then((p) => p.content)
              .catch(() => [])
          )
        );
        if (token !== loadTokenRef.current) return;
        const merged = results.flat();
        setPosts((prev) => rankPosts(replace ? merged : mergeUnique(prev, merged), sort));
        setHasMore(results.some((r) => r.length === PAGE_SIZE));
      } finally {
        if (token === loadTokenRef.current) setLoading(false);
      }
    },
    [sortConfig.backendSort, sort]
  );

  useEffect(() => {
    if (subforums.length === 0) return;
    const slugs = activeFilter === "all" ? subforums.map((s) => s.slug) : [activeFilter];
    setPage(0);
    setPosts([]);
    setHasMore(true);
    loadPage(0, true, slugs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subforums, activeFilter, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const slugs = activeFilter === "all" ? subforums.map((s) => s.slug) : [activeFilter];
          const next = page + 1;
          setPage(next);
          loadPage(next, false, slugs);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadPage, activeFilter, subforums]);

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true);
    const slugs = activeFilter === "all" ? subforums.map((s) => s.slug) : [activeFilter];
    await loadPage(0, true, slugs);
    setPage(0);
    setRefreshing(false);
  }

  function onTouchStart(e) {
    if (window.scrollY === 0) pullStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (pullStartY.current == null) return;
    const delta = e.touches[0].clientY - pullStartY.current;
    if (delta > 90 && !refreshing) {
      pullStartY.current = null;
      refresh();
    }
  }
  function onTouchEnd() {
    pullStartY.current = null;
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative mx-auto max-w-3xl px-4 py-8 pb-28"
    >
      {refreshing && (
        <div className="mb-3 text-center text-xs text-muted">Refreshing…</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Home</h1>
        <Link
          href="/search"
          className="flex items-center gap-2 rounded-full border border-muted/30 px-4 py-1.5 text-sm text-muted hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          Search
        </Link>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-full border border-muted/20 bg-surface p-1">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sort === s.key ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {(sort === "active" || sort === "recommended") && (
        <p className="mt-2 text-xs text-muted">
          {sort === "active"
            ? "Approximated from comment activity and recency."
            : "Personalized recommendations are coming with the AI phase — showing trending posts for now."}
        </p>
      )}

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter("all")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
            activeFilter === "all" ? "bg-accent-muted text-ink" : "text-muted hover:text-ink"
          }`}
        >
          All
        </button>
        {subforums.map((sf) => {
          const color = colorForSlug(sf.slug);
          const active = activeFilter === sf.slug;
          return (
            <button
              key={sf.id}
              onClick={() => setActiveFilter(sf.slug)}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
              style={{
                background: active ? `${color}33` : "transparent",
                color: active ? color : "var(--color-muted)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {sf.name}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && !loading && (
          <p className="py-12 text-center text-sm text-muted">No posts yet in this view.</p>
        )}

        <div ref={sentinelRef} />
        {loading && <p className="py-4 text-center text-sm text-muted">Loading…</p>}
        {!hasMore && posts.length > 0 && (
          <p className="py-4 text-center text-xs text-muted">You&apos;re all caught up.</p>
        )}
      </div>

      {profile && (
        <Link
          href="/create-post"
          aria-label="Create post"
          className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-on-accent shadow-lg hover:opacity-90 md:bottom-8 md:right-8"
        >
          +
        </Link>
      )}
    </div>
  );
}
