"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { listSavedPostIds } from "@/lib/savedPosts";

const IMPORTED_FLAG_KEY = "neetaspirants_saved_posts_imported";
const SavedPostsContext = createContext(null);

export function SavedPostsProvider({ children }) {
  const { token, profile } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    if (!token || !profile) {
      setSavedIds(new Set());
      return;
    }

    let cancelled = false;
    apiFetch("/saved-posts/ids", { token }).then(async (ids) => {
      if (cancelled) return;
      let finalIds = ids;

      const alreadyImported = window.localStorage.getItem(IMPORTED_FLAG_KEY) === "true";
      if (!alreadyImported) {
        const legacyIds = listSavedPostIds().filter((id) => !ids.includes(id));
        if (legacyIds.length > 0) {
          await Promise.all(
            legacyIds.map((id) => apiFetch(`/saved-posts/${id}`, { method: "POST", token }).catch(() => {}))
          );
          finalIds = [...ids, ...legacyIds];
        }
        window.localStorage.setItem(IMPORTED_FLAG_KEY, "true");
      }

      if (!cancelled) setSavedIds(new Set(finalIds));
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, profile]);

  const isSaved = useCallback((postId) => savedIds.has(postId), [savedIds]);

  const toggle = useCallback(
    (postId) => {
      if (!token) return;
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
          apiFetch(`/saved-posts/${postId}`, { method: "DELETE", token }).catch(() => {});
        } else {
          next.add(postId);
          apiFetch(`/saved-posts/${postId}`, { method: "POST", token }).catch(() => {});
        }
        return next;
      });
    },
    [token]
  );

  return (
    <SavedPostsContext.Provider value={{ isSaved, toggle }}>
      {children}
    </SavedPostsContext.Provider>
  );
}

export function useSavedPosts() {
  return useContext(SavedPostsContext);
}
