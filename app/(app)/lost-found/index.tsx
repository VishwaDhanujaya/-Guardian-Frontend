// app/(app)/lost-found/index.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

/**
 * Lost & Found index.
 * Redirects to citizen or officer found items based on `role` query.
 */
export default function LostFoundIndex() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolved: Role = useMemo(() => (role === "officer" ? "officer" : "citizen"), [role]);
  const pathname = resolved === "officer" ? "/lost-found/officer-found" : "/lost-found/citizen";

  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    router.replace({ pathname, params: { role: resolved } });
  }, [pathname, resolved]);

  return null;
}

type Role = "citizen" | "officer";
