"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";
import { COMMUNITY_CATEGORIES } from "@/lib/communityCategories";
import JoinLeaveButton from "@/components/JoinLeaveButton";

export default function CommunitiesPage() {
  const { token, profile } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [subforums, setSubforums] = useState([]);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    apiFetch(`/subforums/search?q=${encodeURIComponent(query)}`, token ? { token } : {})
      .then(setSubforums)
      .catch(() => {});
  }, [query, token]);

  useEffect(() => {
    if (!profile) {
      setRecommended([]);
      return;
    }
    apiFetch("/subforums/recommended?limit=5", { token }).then(setRecommended).catch(() => {});
  }, [profile, token]);

  function updateSubforum(updated) {
    setSubforums((list) => list.map((sf) => (sf.slug === updated.slug ? updated : sf)));
    setRecommended((list) => list.filter((sf) => sf.slug !== updated.slug));
  }

  const filtered = category === "All" ? subforums : subforums.filter((sf) => sf.category === category);
  const categories = ["All", ...COMMUNITY_CATEGORIES];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Communities</h1>
      <p className="mt-1 text-sm text-muted">Find and join communities that match what you're going through.</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search communities..."
        className="mt-4 w-full rounded-full border border-muted/20 bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? "border-accent bg-accent-muted text-ink"
                : "border-muted/20 text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended for you</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recommended.map((sf) => (
              <SubforumCard key={sf.id} subforum={sf} onChange={updateSubforum} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          {category === "All" ? "All communities" : category}
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {filtered.map((sf) => (
            <SubforumCard key={sf.id} subforum={sf} onChange={updateSubforum} />
          ))}
        </div>
        {filtered.length === 0 && <p className="mt-4 text-sm text-muted">No communities found.</p>}
      </section>
    </div>
  );
}

function SubforumCard({ subforum, onChange }) {
  const color = colorForSlug(subforum.slug);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-muted/20 bg-surface p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ background: `${color}26`, color }}
      >
        {subforum.iconEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/c/${subforum.slug}`} className="block font-medium text-ink hover:text-accent">
          {subforum.name}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted">
          {subforum.memberCount} member{subforum.memberCount === 1 ? "" : "s"} · {subforum.category}
        </p>
      </div>
      <JoinLeaveButton subforum={subforum} color={color} onChange={onChange} />
    </div>
  );
}
