// Auth group layout: manages login/register/mfa screens.
// Header is hidden for a clean auth look.

import { Stack } from "expo-router";
import React from "react";
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      {/* Add these later if you need them:
          <Stack.Screen name="register" />
          <Stack.Screen name="mfa" />
      */}
    </Stack>
  );
}
