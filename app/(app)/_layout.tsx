// app/(app)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

/**
 * App group layout.
 * Hosts main authenticated screens without default headers.
 */
export default function AppLayout() {
  return (
    <ProtectedRoute>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="incidents" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="lost-found" />
      </Stack>
    </ProtectedRoute>
  );
}
