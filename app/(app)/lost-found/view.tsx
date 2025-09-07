// app/(app)/lost-found/view.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ChevronLeft, PackageSearch } from "lucide-react-native";
import useMountAnimation from "@/hooks/useMountAnimation";
import { getFoundItem, getLostItem, FoundItemDetail, LostItemDetail } from "@/lib/api";

export default function LostFoundView() {
  const { id, type, role } = useLocalSearchParams<{ id: string; type: "found" | "lost"; role?: string }>();
  const navigation = useNavigation<any>();
  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace({ pathname: "/home", params: { role: role === "officer" ? "officer" : "citizen" } });
  };

  const { value: mount } = useMountAnimation();
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  const [item, setItem] = useState<FoundItemDetail | LostItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = type === "lost" ? await getLostItem(id) : await getFoundItem(id);
        setItem(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, type]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#0F172A" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="mb-4 text-foreground">Failed to load item.</Text>
        <Button onPress={goBack} className="h-10 px-4 rounded-lg">
          <Text className="text-primary-foreground">Go back</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF" }} contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 p-5">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={goBack} className="flex-row items-center gap-1 px-2 py-1 -ml-2" hitSlop={8}>
            <ChevronLeft size={18} color="#0F172A" />
            <Text className="text-foreground">Back</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <PackageSearch size={18} color="#0F172A" />
            <Text className="text-xl font-semibold text-foreground">{type === "lost" ? "Lost item" : "Found item"}</Text>
          </View>
          <View style={{ width: 56 }} />
        </View>
        <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-3" style={animStyle}>
          {renderField("Name", item.name)}
          {renderField("Description", item.description)}
          {renderField("Model", item.model)}
          {renderField("Serial/IMEI", item.serial)}
          {renderField("Colour", item.color)}
          {renderField("Last location", item.lastLocation)}
          {"branch" in item ? renderField("Police branch", item.branch) : null}
          {"reportedBy" in item ? renderField("Reported by", item.reportedBy) : null}
          {"status" in item ? renderField("Status", item.status) : null}
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const renderField = (label: string, value?: string) => {
  if (!value) return null;
  return (
    <View>
      <Text className="text-sm font-medium text-foreground mb-1">{label}</Text>
      <Text className="text-muted-foreground">{value}</Text>
    </View>
  );
};
