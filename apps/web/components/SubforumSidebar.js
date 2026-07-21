"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { colorForSlug } from "@/lib/subforumTheme";

export default function SubforumSidebar() {
  const pathname = usePathname();
  const [subforums, setSubforums] = useState([]);

  useEffect(() => {
    apiFetch("/subforums").then(setSubforums).catch(() => {});
  }, []);

  return (
    <aside className="w-60 shrink-0 rounded-2xl border border-muted/20 bg-surface/80 p-4 backdrop-blur-sm">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Sub-forums
      </h2>
      <nav className="flex flex-col gap-1">
        {subforums.map((sf) => {
          const active = pathname === `/c/${sf.slug}`;
          const color = colorForSlug(sf.slug);
          return (
            <Link
              key={sf.id}
              href={`/c/${sf.slug}`}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-accent-muted text-ink" : "text-muted hover:bg-base hover:text-ink"
              }`}
              style={active ? { boxShadow: `inset 2px 0 0 0 ${color}` } : undefined}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: color, boxShadow: `0 0 8px ${color}` }}
              />
              {sf.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
