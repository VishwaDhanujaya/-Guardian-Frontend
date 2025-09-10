// app/(app)/incidents/_layout.tsx
import { Stack } from "expo-router";

/**
 * Incidents group layout.
 * Stacks incident-related screens with headers hidden.
 */
export default function IncidentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="manage-incidents" />
      <Stack.Screen name="report-incidents" />
      <Stack.Screen name="my-reports" />
      <Stack.Screen name="view" />
    </Stack>
  );
}
