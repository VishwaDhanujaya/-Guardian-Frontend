// app/index.tsx
// Splash that redirects to /login AFTER the root mounts.
// - Uses InteractionManager to avoid "navigate before mount"
// - Uses clean paths (no group names in URL)

import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, InteractionManager, View } from "react-native";

export default function Index() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      router.replace("/(auth)/login"); // ✅ no (auth) in path
    });
    return () => task.cancel();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
      <ActivityIndicator />
    </View>
  );
}
