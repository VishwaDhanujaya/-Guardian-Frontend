// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";

/**
 * Auth group layout.
 * - Hosts authentication screens with no headers for a clean look.
 * - Keep options minimal; global providers live in the root layout.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="mfa" />
    </Stack>
  );
}
