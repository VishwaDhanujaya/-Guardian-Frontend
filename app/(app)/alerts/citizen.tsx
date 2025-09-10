// app/(app)/alerts/citizen.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Animated, Keyboard, Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import useMountAnimation from "@/hooks/useMountAnimation";

import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    MapPin,
    Megaphone,
} from "lucide-react-native";

type Role = "citizen" | "officer";

type AlertRow = {
  id: string;
  title: string;
  message: string;
  region: string;
  meta?: string; // e.g., "Today", "Until 6 PM"
};

export default function CitizenAlerts() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole: Role = role === "officer" ? "officer" : "citizen";

  // Entrance animation
  const { value: mount } = useMountAnimation({
    damping: 14,
    stiffness: 160,
    mass: 0.6,
  });
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  const navigation = useNavigation<any>();
  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace({ pathname: "/home", params: { role: resolvedRole } });
  };

  // Mock: nearby/active alerts; region matching can be added later
  const initial = useMemo<AlertRow[]>(
    () => [
      {
        id: "a1",
        title: "Road closure at Main St",
        message: "Main St is closed between 3rd and 6th from 9–12 for a parade. Use the 5th Ave detour.",
        region: "Central Branch",
        meta: "Today",
      },
      {
        id: "a2",
        title: "Heavy rain advisory",
        message: "Avoid low-lying roads. Expect flash floods in underpasses. Drive carefully.",
        region: "West Branch",
        meta: "Until 6 PM",
      },
      {
        id: "a3",
        title: "Power maintenance: Sector 12",
        message: "Scheduled maintenance tonight 1–3 AM. Temporary outages possible in Sector 12.",
        region: "North Branch",
        meta: "Tonight",
      },
    ],
    []
  );

  // Local state for read/expanded
  const [rows, setRows] = useState(
    initial.map((r) => ({ ...r, isRead: false as boolean, expanded: false as boolean }))
  );

  const toggleExpanded = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, expanded: !r.expanded } : r)));

  const toggleRead = (id: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: !r.isRead } : r)));

  const anyDestructive = rows.length > 0; // simple banner trigger

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={120}
      onScrollBeginDrag={Keyboard.dismiss}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#FFFFFF" }}
    >
      <View className="flex-1 p-5">
        <View className="pt-10 pb-6">
          {/* Top bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={goBack} className="flex-row items-center gap-1 px-2 py-1 -ml-2" hitSlop={8}>
              <ChevronLeft size={18} color="#0F172A" />
              <Text className="text-foreground">Back</Text>
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Megaphone size={18} color="#0F172A" />
              <Text className="text-xl font-semibold text-foreground">Safety alerts</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          {/* Banner */}
          {anyDestructive ? (
            <Animated.View className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 flex-row items-center gap-2 mb-3" style={animStyle}>
              <AlertTriangle size={16} color="#DC2626" />
              <Text className="text-[13px] text-destructive">If this is an emergency, call 119 immediately.</Text>
            </Animated.View>
          ) : null}

          {/* List */}
          <Animated.View style={animStyle}>
            {rows.length === 0 ? (
              <View className="bg-muted rounded-2xl border border-border p-6 items-center">
                <Megaphone size={28} color="#0F172A" />
                <Text className="mt-3 font-semibold text-foreground">No nearby alerts</Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  Great news — nothing urgent in your area.
                </Text>
              </View>
            ) : (
              rows.map((it) => (
                <View key={it.id} className="bg-background rounded-xl border border-border px-3 py-3 mb-3">
                  <Pressable
                    onPress={() => toggleExpanded(it.id)}
                    android_ripple={{ color: "rgba(0,0,0,0.04)" }}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-3">
                      <Text className={`text-foreground ${it.isRead ? "opacity-70" : ""}`}>
                        {it.title}
                      </Text>
                      <View className="flex-row flex-wrap items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <MapPin size={14} color="#0F172A" />
                          <Text className="text-xs text-muted-foreground">{it.region}</Text>
                        </View>
                        {it.meta ? <Text className="text-xs text-muted-foreground">• {it.meta}</Text> : null}
                      </View>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </Pressable>

                  {it.expanded ? (
                    <View className="bg-muted rounded-lg border border-border px-3 py-2 mt-3">
                      <Text className="text-[12px] text-foreground">{it.message}</Text>

                      <View className="flex-row items-center gap-2 mt-3">
                        <Button
                          variant="secondary"
                          className="h-9 px-3 rounded-lg"
                          onPress={() => toggleRead(it.id)}
                        >
                          <View className="flex-row items-center gap-1">
                            {it.isRead ? <EyeOff size={14} color="#0F172A" /> : <Eye size={14} color="#0F172A" />}
                            <Text className="text-[12px] text-foreground">{it.isRead ? "Marked as read" : "Mark as read"}</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </Animated.View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
