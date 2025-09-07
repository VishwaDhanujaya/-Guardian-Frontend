import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, PackageSearch, Plus } from "lucide-react-native";
import { fetchFoundItems, reportLostItem, FoundItem } from "@/lib/api";
import useMountAnimation from "@/hooks/useMountAnimation";

type TabKey = "found" | "report";

export default function CitizenLostFound() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("found");
  useEffect(() => {
    if (tabParam === "report") setActiveTab("report");
  }, [tabParam]);

  const navigation = useNavigation<any>();
  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace("/home?role=citizen");
  };

  const { value: mount } = useMountAnimation();
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    fetchFoundItems()
      .then(setFoundItems)
      .catch(() => toast.error("Failed to load items"))
      .finally(() => setLoadingItems(false));
  }, []);

  // lost form state
  const [itemName, setItemName] = useState("");
  const [desc, setDesc] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [lastLoc, setLastLoc] = useState("");
  const [color, setColor] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const submitLost = async () => {
    if (!itemName || !lastLoc) {
      toast.error("Please fill required fields");
      return;
    }
    try {
      setSubmitting(true);
      await reportLostItem({ itemName, desc, model, serial, lastLoc, color });
      toast.success("Lost item reported");
      router.replace({ pathname: "/incidents/my-reports", params: { role: "citizen", filter: "lost" } });
    } catch (e) {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const TabBtn = ({ k, label }: { k: TabKey; label: string }) => {
    const active = activeTab === k;
    return (
      <Pressable
        onPress={() => setActiveTab(k)}
        className={`flex-1 items-center py-2 rounded-lg ${active ? "bg-foreground" : "bg-muted"}`}
      >
        <Text className={active ? "text-primary-foreground" : "text-foreground"}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={120}
      style={{ flex: 1, backgroundColor: "#fff" }}
    >
      <View className="flex-1 p-5">
        {/* Top bar */}
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={goBack} className="flex-row items-center gap-1 px-2 py-1 -ml-2">
            <ChevronLeft size={18} color="#0F172A" />
            <Text className="text-foreground">Back</Text>
          </Pressable>
          <View className="flex-row items-center gap-2">
            <PackageSearch size={18} color="#0F172A" />
            <Text className="text-xl font-semibold text-foreground">Lost &amp; Found</Text>
          </View>
          <View style={{ width: 56 }} />
        </View>

        <Animated.View className="bg-muted rounded-2xl border border-border p-4" style={animStyle}>
          {/* tabs */}
          <View className="flex-row mb-4 gap-2">
            <TabBtn k="found" label="Found items" />
            <TabBtn k="report" label="Report lost" />
          </View>

          {activeTab === "found" ? (
            <ScrollView>
              {loadingItems ? (
                <ActivityIndicator className="mt-2" color="#0F172A" />
              ) : (
                foundItems.map((f) => (
                  <View key={f.id} className="bg-background rounded-xl border border-border px-3 py-2 mb-2">
                    <Text className="text-foreground">{f.title}</Text>
                    <Text className="text-xs text-muted-foreground">{f.meta}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <View className="gap-3">
              <Input placeholder="Item name*" value={itemName} onChangeText={setItemName} />
              <Input placeholder="Description" value={desc} onChangeText={setDesc} />
              <Input placeholder="Model" value={model} onChangeText={setModel} />
              <Input placeholder="Serial (optional)" value={serial} onChangeText={setSerial} />
              <Input placeholder="Last location*" value={lastLoc} onChangeText={setLastLoc} />
              <Input placeholder="Colour" value={color} onChangeText={setColor} />
              <Button onPress={submitLost} className="mt-2 h-11 rounded-lg" disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Plus size={16} color="#fff" />
                    <Text className="text-primary-foreground ml-1">Submit</Text>
                  </>
                )}
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </KeyboardAwareScrollView>
  );
}
