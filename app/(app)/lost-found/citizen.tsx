import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
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

  const mount = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(mount, { toValue: 1, useNativeDriver: true }).start();
  }, [mount]);
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  // mock data
  const foundItems = useMemo(
    () => [
      { id: "f1", title: "Wallet", meta: "Negombo · Brown leather" },
      { id: "f2", title: "Phone", meta: "Colombo · Samsung, black" },
    ],
    []
  );

  // lost form state
  const [itemName, setItemName] = useState("");
  const [desc, setDesc] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [lastLoc, setLastLoc] = useState("");
  const [color, setColor] = useState("");

  const submitLost = () => {
    if (!itemName || !lastLoc) {
      toast.error("Please fill required fields");
      return;
    }
      toast.success("Lost item reported");
      router.replace({ pathname: "/incidents/my-reports", params: { role: "citizen", filter: "lost" } });
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
              {foundItems.map((f) => (
                <View key={f.id} className="bg-background rounded-xl border border-border px-3 py-2 mb-2">
                  <Text className="text-foreground">{f.title}</Text>
                  <Text className="text-xs text-muted-foreground">{f.meta}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="gap-3">
              <Input placeholder="Item name*" value={itemName} onChangeText={setItemName} />
              <Input placeholder="Description" value={desc} onChangeText={setDesc} />
              <Input placeholder="Model" value={model} onChangeText={setModel} />
              <Input placeholder="Serial (optional)" value={serial} onChangeText={setSerial} />
              <Input placeholder="Last location*" value={lastLoc} onChangeText={setLastLoc} />
              <Input placeholder="Colour" value={color} onChangeText={setColor} />
              <Button onPress={submitLost} className="mt-2 h-11 rounded-lg">
                <Plus size={16} color="#fff" />
                <Text className="text-primary-foreground ml-1">Submit</Text>
              </Button>
            </View>
          )}
        </Animated.View>
      </View>
    </KeyboardAwareScrollView>
  );
}
