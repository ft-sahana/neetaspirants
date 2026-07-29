"use client";

import Link from "next/link";
import VoteButtons from "@/components/VoteButtons";
import Avatar from "@/components/Avatar";
import { timeAgo } from "@/lib/timeAgo";
import { useSavedPosts } from "@/components/SavedPostsProvider";
import { colorForSlug } from "@/lib/subforumTheme";

function subforumLabel(slug) {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PostCard({ post, accentColor, showCommunity = true }) {
  const { isSaved, toggle } = useSavedPosts();
  const saved = isSaved(post.id);
  const communityColor = accentColor || colorForSlug(post.subforumSlug);

  function handleSave(e) {
    e.preventDefault();
    toggle(post.id);
  }

  async function handleShare(e) {
    e.preventDefault();
    const url = `${window.location.origin}/c/${post.subforumSlug}?post=${post.slug}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
    }
  }

  function handleReport(e) {
    e.preventDefault();
    window.alert("Thanks — this post has been flagged for review.");
  }

  return (
    <div
      className="flex gap-4 rounded-xl border border-muted/20 bg-surface p-4"
      style={{ boxShadow: `inset 3px 0 0 0 ${communityColor}` }}
    >
      <VoteButtons votableType="POST" votableId={post.id} score={post.score} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Avatar alias={post.authorAlias} size={22} />
          <span className="text-ink">{post.authorAlias}</span>
          {showCommunity && (
            <>
              <span>·</span>
              <Link
                href={`/c/${post.subforumSlug}`}
                className="rounded-full px-2 py-0.5 font-medium"
                style={{ background: `${communityColor}26`, color: communityColor }}
              >
                {subforumLabel(post.subforumSlug)}
              </Link>
            </>
          )}
          <span>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>

        <Link
          href={`/c/${post.subforumSlug}?post=${post.slug}`}
          className="mt-1 block font-medium text-ink hover:text-accent"
        >
          {post.title}
        </Link>
        {post.bodyExcerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{post.bodyExcerpt}</p>
        )}
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="mt-2 max-h-72 w-full rounded-lg border border-muted/20 object-cover"
          />
        )}

        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span>{post.commentCount ?? 0} comments</span>
          <button
            onClick={handleSave}
            className={`hover:text-ink ${saved ? "text-accent" : ""}`}
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={handleShare} className="hover:text-ink">
            Share
          </button>
          <button onClick={handleReport} className="hover:text-ink">
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
