// app/index.tsx
import { router } from "expo-router";
import React, { useEffect, useContext } from "react";
import { ActivityIndicator, InteractionManager, View } from "react-native";
import { AuthContext } from "@/context/AuthContext";

/**
 * Initial splash/redirect screen.
 * - Waits for interactions to settle, then redirects to /login.
 * - Avoids navigating before the root layout has mounted.
 */
export default function Index() {
  const { session } = useContext(AuthContext);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      router.replace(session ? "/home" : "/login");
    });
    return () => task.cancel();
  }, [session]);

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
