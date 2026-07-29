"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";
import FollowButton from "@/components/FollowButton";
import PostCard from "@/components/PostCard";

export default function PublicProfilePage() {
  const { alias } = useParams();
  const { profile: myProfile } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // "followers" | "following" | null
  const [people, setPeople] = useState([]);

  const isSelf = myProfile?.alias === alias;

  useEffect(() => {
    if (isSelf) {
      router.replace("/profile");
    }
  }, [isSelf, router]);

  useEffect(() => {
    setError(null);
    apiFetch(`/profiles/${alias}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load profile"));
    apiFetch(`/profiles/${alias}/posts`).then(setPosts).catch(() => {});
  }, [alias]);

  async function toggleExpanded(which) {
    if (expanded === which) {
      setExpanded(null);
      return;
    }
    const list = await apiFetch(`/profiles/${alias}/${which}`).catch(() => []);
    setPeople(list);
    setExpanded(which);
  }

  if (error) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted">{error}</div>;
  }
  if (!data) return null;

  const color = colorForSlug(alias);
  const initial = alias?.[0]?.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div
        className="overflow-hidden rounded-2xl border border-muted/20 p-8 text-center"
        style={{
          backgroundImage: `linear-gradient(135deg, color-mix(in srgb, ${color} 25%, var(--color-surface)), var(--color-surface) 70%)`,
        }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold"
          style={{ background: color, color: "#0a0a12", boxShadow: `0 0 24px ${color}66` }}
        >
          {initial}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-ink">{alias}</h1>
        {data.bio && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{data.bio}</p>}
        <p className="mt-1 text-xs text-muted">
          Member since {new Date(data.memberSince).toLocaleDateString()}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <button onClick={() => toggleExpanded("followers")} className="text-ink hover:text-accent">
            <span className="font-semibold">{data.followerCount}</span>{" "}
            <span className="text-muted">followers</span>
          </button>
          <button onClick={() => toggleExpanded("following")} className="text-ink hover:text-accent">
            <span className="font-semibold">{data.followingCount}</span>{" "}
            <span className="text-muted">following</span>
          </button>
          <span className="text-muted">
            <span className="font-semibold text-ink">{data.postCount}</span> posts
          </span>
        </div>

        {myProfile && !isSelf && (
          <div className="mt-5">
            <FollowButton
              alias={alias}
              following={data.followingByMe}
              color={color}
              onChange={(nowFollowing) =>
                setData((d) => ({
                  ...d,
                  followingByMe: nowFollowing,
                  followerCount: d.followerCount + (nowFollowing ? 1 : -1),
                }))
              }
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-4 rounded-xl border border-muted/20 bg-surface p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{expanded}</h2>
          {people.length === 0 && <p className="text-sm text-muted">No one yet.</p>}
          <div className="flex flex-col gap-2">
            {people.map((p) => (
              <a
                key={p.profileId}
                href={`/u/${p.alias}`}
                className="rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-base"
              >
                {p.alias}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Posts</h2>
        {posts.length === 0 && <p className="text-sm text-muted">No posts yet.</p>}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
