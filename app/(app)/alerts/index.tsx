// app/(app)/alerts/index.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

/**
 * Alerts index:
 * Redirects to the appropriate alerts route based on `role` (officer | citizen).
 * Defaults to citizen alerts if role is missing/invalid.
 */
export default function AlertsIndex() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const normalizedRole = useMemo<Role>(() => normalizeRole(role), [role]);
  const pathname = useMemo<AlertsPath>(() => getAlertsPath(normalizedRole), [normalizedRole]);

  // Prevent double replace on React strict-mode / re-mounts
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    router.replace({ pathname, params: { role: normalizedRole } });
  }, [pathname, normalizedRole]);

  // No UI; just redirect.
  return null;
}

// Types and helpers

type Role = "officer" | "citizen";

type AlertsPath = "/alerts/manage" | "/alerts/citizen";

function normalizeRole(raw?: string): Role {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "officer" ? "officer" : "citizen";
}

function getAlertsPath(role: Role): AlertsPath {
  return role === "officer" ? "/alerts/manage" : "/alerts/citizen";
}
