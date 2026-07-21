"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import PostCard from "@/components/PostCard";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    const data = await apiFetch(`/search?q=${encodeURIComponent(q)}`);
    setResults(data);
    setSearched(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold text-ink">Search</h1>

      <form onSubmit={runSearch} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts…"
          className="flex-1 rounded-lg border border-muted/30 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-on-accent hover:opacity-90"
        >
          Search
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {searched && results.length === 0 && (
          <p className="text-sm text-muted">No posts matched your search.</p>
        )}
      </div>
    </div>
  );
}
