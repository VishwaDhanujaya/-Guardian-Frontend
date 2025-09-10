// app/(app)/alerts/_layout.tsx
import { Stack } from "expo-router";

/**
 * Alerts group layout.
 * Organizes alert-related screens under a hidden-header stack.
 */
export default function AlertsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="citizen" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
