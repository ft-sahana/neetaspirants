"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import NavIcon from "@/components/NavIcons";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navItems";
import { useUnreadNotifications } from "@/lib/useUnreadNotifications";
import { useUnreadMessages } from "@/lib/useUnreadMessages";

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, ready, logout } = useAuth();
  const { theme } = useTheme();
  const unreadCount = useUnreadNotifications();
  const unreadMessages = useUnreadMessages();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-muted/20 bg-surface px-4 py-6 md:flex">
      <Link href="/" className="px-2 text-lg font-semibold text-ink">
        neetaspirants
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-accent-muted text-ink" : "text-muted hover:bg-base hover:text-ink"
              }`}
            >
              <span className="relative flex">
                <NavIcon name={item.icon} />
                {item.key === "notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-none text-on-accent">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {item.key === "messages" && unreadMessages > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold leading-none text-on-accent">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}

        {profile?.role === "ADMIN" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname.startsWith("/admin") ? "bg-accent-muted text-ink" : "text-muted hover:bg-base hover:text-ink"
            }`}
          >
            <NavIcon name="admin" />
            Admin
          </Link>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-muted/20 pt-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted">{theme === "dark" ? "Dark theme" : "Light theme"}</span>
          <ThemeToggle />
        </div>

        {ready && profile ? (
          <button
            onClick={logout}
            className="rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-base hover:text-ink"
          >
            Log out ({profile.alias})
          </button>
        ) : (
          ready && (
            <div className="flex flex-col gap-2 px-2">
              <Link href="/login" className="text-sm text-muted hover:text-ink">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-2 text-center text-sm font-medium text-on-accent hover:opacity-90"
              >
                Join anonymously
              </Link>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
