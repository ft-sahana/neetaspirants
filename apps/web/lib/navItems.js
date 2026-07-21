export const NAV_ITEMS = [
  { key: "home", label: "Home", href: "/home", icon: "home" },
  { key: "communities", label: "Communities", href: "/c", icon: "communities" },
  { key: "rooms", label: "Rooms", href: "/rooms", icon: "rooms" },
  { key: "notifications", label: "Notifications", href: "/notifications", icon: "notifications" },
  { key: "profile", label: "Profile", href: "/profile", icon: "profile" },
  { key: "assistant", label: "AI Assistant", href: "/assistant", icon: "assistant" },
];

export function isNavItemActive(pathname, href) {
  if (href === "/home") return pathname === "/home";
  if (href === "/c") return pathname === "/c" || pathname.startsWith("/c/");
  return pathname === href || pathname.startsWith(`${href}/`);
}
