import { colorForSlug } from "@/lib/subforumTheme";

export default function Avatar({ alias, size = 36 }) {
  const color = colorForSlug(alias);
  const initial = alias?.[0]?.toUpperCase() || "?";

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: color,
        color: "#0a0a12",
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </span>
  );
}
