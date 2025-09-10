// app/(app)/alerts/manage.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Pressable,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { fetchAlerts, AlertRow } from "@/lib/api";
import useMountAnimation from "@/hooks/useMountAnimation";

import {
    ChevronLeft,
    MapPin,
    Megaphone,
    Pencil,
    Plus,
    Trash2,
} from "lucide-react-native";

type Role = "citizen" | "officer";

export default function ManageAlerts() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole: Role = role === "officer" ? "officer" : "citizen";

  const navigation = useNavigation<any>();
  const goBack = useCallback(() => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace({ pathname: "/home", params: { role: resolvedRole } });
  }, [navigation, resolvedRole]);

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

  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts()
      .then(setRows)
      .catch(() => toast.error("Failed to load alerts"))
      .finally(() => setLoading(false));
  }, []);

  const visibleRows = useMemo(() => [...rows], [rows]);

  // Navigation
  const createNew = () => router.push({ pathname: "/alerts/edit", params: { role: "officer" } });
  const editAlert = (id: string) => router.push({ pathname: "/alerts/edit", params: { role: "officer", id } });

  // Actions
  const deleteAlert = (id: string) =>
    setRows(prev => {
      toast.success("Alert removed");
      return prev.filter(r => r.id !== id);
    });

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
              <Text className="text-xl font-semibold text-foreground">Manage alerts</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          {/* Create new alert */}
          <Animated.View className="bg-muted rounded-2xl border border-border p-4" style={animStyle}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-foreground">Create and remove public safety alerts.</Text>
              <Button className="h-10 px-3 rounded-lg" onPress={createNew}>
                <View className="flex-row items-center gap-1">
                  <Plus size={16} color="#FFFFFF" />
                  <Text className="text-[13px] text-primary-foreground">New alert</Text>
                </View>
              </Button>
            </View>
          </Animated.View>

          {/* Alerts list */}
          <Animated.View className="mt-4" style={animStyle}>
            {loading ? (
              <View className="bg-muted rounded-2xl border border-border p-6 items-center">
                <ActivityIndicator color="#0F172A" />
                <Text className="text-xs text-muted-foreground mt-2">Loading alerts...</Text>
              </View>
            ) : visibleRows.length === 0 ? (
              <View className="bg-muted rounded-2xl border border-border p-6 items-center">
                <Megaphone size={28} color="#0F172A" />
                <Text className="mt-3 font-semibold text-foreground">No alerts</Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  Tap “New alert” to add one.
                </Text>
              </View>
            ) : (
              visibleRows.map((it) => (
                <View
                  key={it.id}
                  className="bg-background rounded-xl border border-border px-3 py-3 mb-3"
                >
                  {/* Header */}
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 pr-1">
                      <Text className="text-foreground" numberOfLines={2}>{it.title}</Text>
                      <View className="flex-row flex-wrap items-center gap-2 mt-1">
                        <View className="flex-row items-center gap-1">
                          <MapPin size={14} color="#0F172A" />
                          <Text className="text-xs text-muted-foreground">{it.region}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Message */}
                  <View className="bg-muted rounded-lg border border-border px-3 py-2 mt-3">
                    <Text className="text-[12px] text-foreground">{it.message}</Text>
                  </View>

                  {/* Actions: Edit / Remove */}
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    <Button size="sm" variant="secondary" className="h-9 px-3 rounded-lg" onPress={() => editAlert(it.id)}>
                      <View className="flex-row items-center gap-1">
                        <Pencil size={14} color="#0F172A" />
                        <Text className="text-[12px] text-foreground">Edit</Text>
                      </View>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 px-3 rounded-lg"
                      onPress={() => deleteAlert(it.id)}
                    >
                      <View className="flex-row items-center gap-1">
                        <Trash2 size={14} color="#DC2626" />
                        <Text className="text-[12px]" style={{ color: "#DC2626" }}>Remove</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
