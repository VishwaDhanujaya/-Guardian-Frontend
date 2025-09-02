// app/(app)/incidents/index.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

/**
 * Incidents index screen.
 * - Redirects to the appropriate incidents route based on `role`.
 * - Accepts optional `role` query param ("officer" | "citizen").
 */
export default function IncidentsIndex() {
  const { role } = useLocalSearchParams<{ role?: string }>();

  useEffect(() => {
    const normalizedRole = normalizeRole(role);
    const pathname = getIncidentsPath(normalizedRole);

    // Narrow object shape to the exact route+params the router expects.
    const href = {
      pathname,
      params: { role: normalizedRole },
    } satisfies { pathname: IncidentsPath; params: { role: "officer" | "citizen" } };

    router.replace(href);
  }, [role]);

  // No UI; screen exists only to redirect.
  return null;
}

/** Normalize role to a supported value. */
function normalizeRole(role?: string): "officer" | "citizen" {
  return role === "officer" ? "officer" : "citizen";
}

/** Allowed incidents paths (literal union). */
type IncidentsPath = "/incidents/manage-incidents" | "/incidents/report-incidents";

/** Resolve incidents route by role (returns a literal, not a generic string). */
function getIncidentsPath(role: "officer" | "citizen"): IncidentsPath {
  return role === "officer"
    ? "/incidents/manage-incidents"
    : "/incidents/report-incidents";
}
