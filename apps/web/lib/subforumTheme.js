export const SUBFORUM_COLORS = [
  "#00e5ff",
  "#8b2fe0",
  "#ff2fb0",
  "#3355ff",
  "#14b8a6",
  "#f472b6",
  "#f59e0b",
];

export function colorForSlug(slug) {
  if (!slug) return SUBFORUM_COLORS[0];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return SUBFORUM_COLORS[hash % SUBFORUM_COLORS.length];
}
