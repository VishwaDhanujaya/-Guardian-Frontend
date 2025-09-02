// app/index.tsx
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, InteractionManager, View } from "react-native";

/**
 * Initial splash/redirect screen.
 * - Waits for interactions to settle, then redirects to /login.
 * - Avoids navigating before the root layout has mounted.
 */
export default function Index() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // Route groups are not part of the URL; redirect to clean path.
      router.replace("/login");
    });
    return () => task.cancel();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
      }}
    >
      <ActivityIndicator />
    </View>
  );
}
