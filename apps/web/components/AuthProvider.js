"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { decodeJwt } from "@/lib/jwt";
import { getTokenCookie, setTokenCookie, clearTokenCookie } from "@/lib/auth-cookie";
import { refreshAccessToken, logoutRequest } from "@/lib/api";

const AuthContext = createContext(null);
const REFRESH_BUFFER_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const refreshTimer = useRef(null);

  function scheduleRefresh(exp) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!exp) return;
    const delay = Math.max(exp * 1000 - Date.now() - REFRESH_BUFFER_MS, MIN_REFRESH_DELAY_MS);
    refreshTimer.current = setTimeout(runRefresh, delay);
  }

  function applyToken(newToken) {
    const claims = decodeJwt(newToken);
    if (!claims) return null;
    setTokenCookie(newToken);
    setToken(newToken);
    setProfile({ profileId: claims.profileId, alias: claims.alias, role: claims.role });
    scheduleRefresh(claims.exp);
    return claims;
  }

  function clearAuth() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    clearTokenCookie();
    setToken(null);
    setProfile(null);
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("assistant-chat:")) localStorage.removeItem(key);
    }
  }

  async function runRefresh() {
    const newToken = await refreshAccessToken();
    if (newToken) {
      applyToken(newToken);
    } else {
      clearAuth();
    }
  }

  useEffect(() => {
    (async () => {
      const existing = getTokenCookie();
      const claims = existing ? decodeJwt(existing) : null;
      const expiringSoon = !claims || claims.exp * 1000 - Date.now() < REFRESH_BUFFER_MS;

      if (claims && !expiringSoon) {
        setToken(existing);
        setProfile({ profileId: claims.profileId, alias: claims.alias, role: claims.role });
        scheduleRefresh(claims.exp);
      } else {
        await runRefresh();
      }
      setReady(true);
    })();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function login(newToken) {
    applyToken(newToken);
  }

  function logout() {
    logoutRequest();
    clearAuth();
  }

  return (
    <AuthContext.Provider value={{ token, profile, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
