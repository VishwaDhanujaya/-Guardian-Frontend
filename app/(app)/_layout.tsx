// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * App group layout.
 * Hosts main authenticated screens without default headers.
 */
export default function AppLayout() {
  const { session, checkAuthed } = useContext(AuthContext);

  useEffect(() => {
    checkAuthed();
  }, [checkAuthed]);

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="incidents" />
      <Stack.Screen name="alerts" />
      <Stack.Screen name="lost-found" />
    </Stack>
  );
}
