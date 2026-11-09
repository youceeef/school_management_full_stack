"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { getSystemHealth } from "../services/systemHealthService";
import { evaluateApiCompatibility } from "../utils/systemCompatibility";

const SystemHealthContext = createContext(null);

const hasAdminRole = (user) =>
  user?.roles?.some((role) => (typeof role === "string" ? role === "admin" : role.name === "admin"));

export function SystemHealthProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = hasAdminRole(user);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAdmin) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await getSystemHealth();
      setHealth(data);
      return data;
    } catch {
      setHealth(null);
      setError("API_HEALTH_UNAVAILABLE");
      return null;
    } finally {
      setLastCheckedAt(new Date());
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!isAdmin) {
      setHealth(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    refresh();
    const interval = window.setInterval(refresh, 5 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [authLoading, isAdmin, refresh]);

  const compatibility = useMemo(
    () => evaluateApiCompatibility(health),
    [health]
  );

  const value = useMemo(
    () => ({
      isAdmin,
      health,
      loading,
      error,
      lastCheckedAt,
      compatibility,
      frontendVersion: process.env.NEXT_PUBLIC_APP_VERSION || "local",
      frontendBuildTime: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      expectedApiSchemaVersion:
        process.env.NEXT_PUBLIC_API_SCHEMA_VERSION || "1",
      refresh,
    }),
    [isAdmin, health, loading, error, lastCheckedAt, compatibility, refresh]
  );

  return <SystemHealthContext.Provider value={value}>{children}</SystemHealthContext.Provider>;
}

export function useSystemHealth() {
  const context = useContext(SystemHealthContext);

  if (!context) {
    throw new Error("useSystemHealth must be used within a SystemHealthProvider");
  }

  return context;
}
