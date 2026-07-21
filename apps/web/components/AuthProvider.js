"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { decodeJwt } from "@/lib/jwt";
import { getTokenCookie, setTokenCookie, clearTokenCookie } from "@/lib/auth-cookie";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = getTokenCookie();
    if (existing) {
      const claims = decodeJwt(existing);
      if (claims) {
        setToken(existing);
        setProfile({ profileId: claims.profileId, alias: claims.alias });
      }
    }
    setReady(true);
  }, []);

  function login(newToken) {
    const claims = decodeJwt(newToken);
    setTokenCookie(newToken);
    setToken(newToken);
    setProfile(claims ? { profileId: claims.profileId, alias: claims.alias } : null);
  }

  function logout() {
    clearTokenCookie();
    setToken(null);
    setProfile(null);
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
