"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function MobileTopBar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-muted/20 bg-surface px-4 py-3 md:hidden">
      <Link href="/" className="text-base font-semibold text-ink">
        neetaspirants
      </Link>
      <ThemeToggle />
    </header>
  );
}
