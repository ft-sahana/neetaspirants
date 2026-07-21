const KEY = "neetaspirants_saved_posts";

function readAll() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function isPostSaved(postId) {
  return readAll().includes(postId);
}

export function toggleSavedPost(postId) {
  const current = readAll();
  const next = current.includes(postId)
    ? current.filter((id) => id !== postId)
    : [...current, postId];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next.includes(postId);
}

export function listSavedPostIds() {
  return readAll();
}
