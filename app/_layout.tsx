// app/_layout.tsx
import { ToastOverlay } from "@/components/toast";
import { AuthProvider } from "@/context/AuthContext";
import { PortalHost } from "@rn-primitives/portal";
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import "../global.css";

/**
 * Root application layout.
 * - Applies a light background and safe-area container.
 * - Renders routed content  <Slot />.
 * - Hosts global overlays (toasts, portals) mounted once at the root.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
          <Slot />
        </SafeAreaView>
      </AuthProvider>

      {/* Global overlay hosts (single mount) */}
      <ToastOverlay />
      <PortalHost />
    </>
  );
}
