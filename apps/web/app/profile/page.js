"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { colorForSlug } from "@/lib/subforumTheme";

export default function ProfilePage() {
  const { profile, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.push("/login");
  }, [ready, profile, router]);

  if (!profile) return null;

  function handleLogout() {
    logout();
    router.push("/");
  }

  const color = colorForSlug(profile.alias);
  const initial = profile.alias?.[0]?.toUpperCase() || "?";

  return (
    <div className="mx-auto max-w-md px-4 py-20">
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
        <h1 className="mt-4 text-xl font-semibold text-ink">{profile.alias}</h1>
        <span
          className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide"
          style={{ background: `${color}26`, color }}
        >
          Profile #{profile.profileId}
        </span>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-full border px-6 py-2.5 font-medium text-ink hover:bg-surface"
        style={{ borderColor: color }}
      >
        Log out
      </button>
    </div>
  );
}
