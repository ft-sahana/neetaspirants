const KEY = "neetaspirants_saved_posts";

// Legacy client-only saved-posts store. Superseded by the backend-persisted
// /saved-posts API (see components/SavedPostsProvider.js); this now only
// exists to seed a one-time import of whatever was saved locally before.
export function listSavedPostIds() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
