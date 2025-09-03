// app/(app)/incidents/index.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

/**
 * Incidents index:
 * Redirects to the appropriate incidents route based on `role` (officer | citizen).
 * Falls back to citizen if role is missing/invalid. Runs once, avoids double-redirects.
 */
export default function IncidentsIndex() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  const normalizedRole = useMemo<"officer" | "citizen">(() => normalizeRole(role), [role]);
  const pathname = useMemo<IncidentsPath>(() => getIncidentsPath(normalizedRole), [normalizedRole]);

  // Prevent double replace on React strict-mode / re-mounts
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    const href = {
      pathname,
      params: { role: normalizedRole },
    } satisfies { pathname: IncidentsPath; params: { role: "officer" | "citizen" } };

    router.replace(href);
  }, [pathname, normalizedRole]);

  // No UI; just redirect.
  return null;
}

/** Normalize role to a supported value. */
function normalizeRole(raw?: string): "officer" | "citizen" {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "officer" ? "officer" : "citizen";
}

/** Allowed incidents paths (literal union). */
type IncidentsPath = "/incidents/manage-incidents" | "/incidents/report-incidents";

/** Resolve incidents route by role. */
function getIncidentsPath(role: "officer" | "citizen"): IncidentsPath {
  return role === "officer"
    ? "/incidents/manage-incidents"
    : "/incidents/report-incidents";
}
