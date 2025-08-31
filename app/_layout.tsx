// Root layout: sets up a light background and renders children via <Slot />.
// Keep this minimal. You can add providers (Auth, Theme, Toast) later if needed.

import { ToastOverlay } from "@/components/toast";
import { PortalHost } from "@rn-primitives/portal"; // <-- add this
import { Slot } from "expo-router";
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import "../global.css"; // <-- fix path
export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <Slot />
      </SafeAreaView>

      {/* Mount once, after your app tree, so overlays (menus/sheets/toasts) can portal above everything */}
      <ToastOverlay />  
      <PortalHost />
    </>
  );
}
