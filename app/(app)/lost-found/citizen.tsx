import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
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
import { ChevronLeft, PackageSearch, Plus, Search as SearchIcon, X } from "lucide-react-native";
import { fetchFoundItems, reportLostItem, FoundItem } from "@/lib/api";
import useMountAnimation from "@/hooks/useMountAnimation";

export default function CitizenLostFound() {
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
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    fetchFoundItems()
      .then(setFoundItems)
      .catch(() => toast.error("Failed to load items"))
      .finally(() => setLoadingItems(false));
  }, []);

  const filteredItems = foundItems.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.meta.toLowerCase().includes(search.toLowerCase())
  );

  // lost form state
  const [itemName, setItemName] = useState("");
  const [desc, setDesc] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [color, setColor] = useState("");
  const [lastLoc, setLastLoc] = useState("");

  const resetForm = () => {
    setItemName("");
    setDesc("");
    setModel("");
    setSerial("");
    setColor("");
    setLastLoc("");
  };

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
      resetForm();
      setOpenForm(false);
      router.replace({ pathname: "/incidents/my-reports", params: { role: "citizen", filter: "lost" } });
    } catch (e) {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
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
          <View className="relative mb-4">
            <SearchIcon size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 10 }} />
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder="Search items"
              className="bg-background h-10 rounded-xl pl-9"
            />
          </View>

          <ScrollView>
            {loadingItems ? (
              <ActivityIndicator className="mt-2" color="#0F172A" />
            ) : (
              filteredItems.map((f) => (
                <View key={f.id} className="bg-background rounded-xl border border-border px-3 py-3 mb-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <PackageSearch size={16} color="#0F172A" />
                    <Text className="text-foreground">{f.title}</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">{f.meta}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>

        <Pressable
          onPress={() => setOpenForm(true)}
          className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-foreground items-center justify-center shadow-lg"
          android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
        >
          <Plus size={24} color="#FFFFFF" />
        </Pressable>

        <Modal visible={openForm} animationType="slide" onRequestClose={() => setOpenForm(false)}>
          <KeyboardAwareScrollView
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
            extraScrollHeight={120}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
            contentContainerStyle={{ flexGrow: 1, backgroundColor: "#FFFFFF" }}
          >
            <View className="flex-1 p-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-foreground">Report lost item</Text>
                <Pressable onPress={() => setOpenForm(false)} hitSlop={8}>
                  <X size={20} color="#0F172A" />
                </Pressable>
              </View>
              <View className="gap-3">
                <Input placeholder="Item name*" value={itemName} onChangeText={setItemName} />
                <Input placeholder="Description" value={desc} onChangeText={setDesc} />
                <Input placeholder="Model" value={model} onChangeText={setModel} />
                <Input placeholder="Serial/IMEI (optional)" value={serial} onChangeText={setSerial} />
                <Input placeholder="Colour" value={color} onChangeText={setColor} />
                <Input placeholder="Last location*" value={lastLoc} onChangeText={setLastLoc} />
                <Button onPress={submitLost} className="mt-2 h-11 rounded-lg" disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center justify-center">
                      <Plus size={16} color="#fff" />
                      <Text className="text-primary-foreground ml-1">Submit</Text>
                    </View>
                  )}
                </Button>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </Modal>
      </View>
    </KeyboardAwareScrollView>
  );
}
