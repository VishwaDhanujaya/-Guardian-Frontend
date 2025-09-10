// app/(app)/lost-found/_layout.tsx
import { Stack } from "expo-router";

/**
 * Lost & Found group layout.
 * Stacks lost-found related screens without headers.
 */
export default function LostFoundLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="citizen" />
      <Stack.Screen name="officer-found" />
      <Stack.Screen name="officer-lost" />
      <Stack.Screen name="view" />
    </Stack>
  );
}
