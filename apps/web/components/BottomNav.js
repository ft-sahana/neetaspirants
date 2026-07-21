"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/NavIcons";
import { NAV_ITEMS, isNavItemActive } from "@/lib/navItems";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-muted/20 bg-surface px-1 py-2 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            <NavIcon name={item.icon} className="h-5 w-5" />
            {item.label === "AI Assistant" ? "AI" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
