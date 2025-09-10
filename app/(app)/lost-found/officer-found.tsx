import { useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import useMountAnimation from "@/hooks/useMountAnimation";

import {
    ChevronLeft,
    Inbox,
    Megaphone,
    PackageSearch,
    Plus,
} from "lucide-react-native";

type Role = "citizen" | "officer";

type FoundItem = {
  id: string;
  name: string;
  description?: string;
  model?: string;
  serial?: string;
  lastLocation?: string;
  color?: string;
  branch?: string;
  postedAt?: string;
};

export default function OfficerFound() {
  const navigation = useNavigation<any>();
  const goBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace("/home?role=officer");
  };

  const { value: mount } = useMountAnimation();
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  // list
  const [items, setItems] = useState<FoundItem[]>([
    { id: "f1", name: "Wallet", description: "Brown leather, cards inside", lastLocation: "Negombo PS", color: "Brown", branch: "Negombo", postedAt: "Today 10:30" },
    { id: "f2", name: "Phone", description: "Samsung, black case", model: "S21", lastLocation: "Colombo Central", color: "Black", branch: "Colombo", postedAt: "Yesterday 15:20" },
  ]);

  // add form
  const [openForm, setOpenForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [lastLoc, setLastLoc] = useState("");
  const [color, setColor] = useState("");
  const [branch, setBranch] = useState("");

  const reset = () => {
    setName(""); setDesc(""); setModel(""); setSerial(""); setLastLoc(""); setColor(""); setBranch("");
  };

  const addFound = () => {
    if (!name || !lastLoc) {
      toast.error("Please fill the required fields");
      return;
    }
    const newItem: FoundItem = {
      id: `f_${Date.now()}`,
      name,
      description: desc,
      model,
      serial,
      lastLocation: lastLoc,
      color,
      branch: branch || "Unknown",
      postedAt: new Date().toLocaleString(),
    };
    setItems(prev => [newItem, ...prev]);
    toast.success("Found item posted");
    reset();
    setOpenForm(false);
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={120}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#FFFFFF", paddingBottom: 16 }}
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
              <Text className="text-xl font-semibold text-foreground">Found items (officer)</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-4" style={animStyle}>
            {/* Add new */}
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-foreground">Create a found item post</Text>
              {!openForm ? (
                <Button className="h-9 px-3 rounded-lg" variant="secondary" onPress={() => setOpenForm(true)}>
                  <View className="flex-row items-center gap-1">
                    <Plus size={14} color="#0F172A" />
                    <Text className="text-[12px] text-foreground">Add new</Text>
                  </View>
                </Button>
              ) : (
                <Button className="h-9 px-3 rounded-lg" variant="secondary" onPress={() => { setOpenForm(false); reset(); }}>
                  <Text className="text-[12px] text-foreground">Close</Text>
                </Button>
              )}
            </View>

            {/* Form */}
            {openForm ? (
              <View className="bg-muted rounded-xl border border-border p-3">
                <View className="gap-4">
                  <View className="gap-1">
                    <Label>Item name*</Label>
                    <Input value={name} onChangeText={setName} />
                  </View>
                  <View className="gap-1">
                    <Label>Description</Label>
                    <Input value={desc} onChangeText={setDesc} />
                  </View>
                  <View className="gap-1">
                    <Label>Model</Label>
                    <Input value={model} onChangeText={setModel} />
                  </View>
                  <View className="gap-1">
                    <Label>Serial/IMEI (optional)</Label>
                    <Input value={serial} onChangeText={setSerial} />
                  </View>
                  <View className="gap-1">
                    <Label>Colour</Label>
                    <Input value={color} onChangeText={setColor} />
                  </View>
                  <View className="gap-1">
                    <Label>Police branch</Label>
                    <Input value={branch} onChangeText={setBranch} />
                  </View>
                  <View className="gap-1">
                    <Label>Last location*</Label>
                    <Input value={lastLoc} onChangeText={setLastLoc} />
                  </View>
                </View>

                <View className="flex-row items-center justify-end gap-2 mt-3">
                  <Button variant="secondary" className="h-9 px-3 rounded-lg" onPress={() => { setOpenForm(false); reset(); }}>
                    <Text className="text-foreground text-[12px]">Cancel</Text>
                  </Button>
                  <Button className="h-9 px-3 rounded-lg" onPress={addFound}>
                    <Text className="text-primary-foreground text-[12px]">Post</Text>
                  </Button>
                </View>
              </View>
            ) : null}

            {/* List */}
            <View>
              {items.length === 0 ? (
                <View className="bg-background rounded-xl border border-border p-6 items-center">
                  <View className="w-14 h-14 rounded-full items-center justify-center bg-ring/10">
                    <Inbox size={28} color="#0F172A" />
                  </View>
                  <Text className="mt-3 font-semibold text-foreground">No found posts yet</Text>
                  <Text className="text-xs text-muted-foreground mt-1 text-center">
                    Use “Add new” to create a post for items handed to your station.
                  </Text>
                </View>
              ) : (
                <ScrollView>
                  {items.map((it) => (
                    <Pressable
                      key={it.id}
                      onPress={() =>
                        router.push({ pathname: "/lost-found/view", params: { id: it.id, type: "found", role: "officer" } })
                      }
                      className="bg-background rounded-xl border border-border px-3 py-3 mb-2"
                    >
                      <View className="flex-row items-center gap-2 mb-1">
                        <PackageSearch size={16} color="#0F172A" />
                        <Text className="text-foreground">{it.name}</Text>
                      </View>
                      {it.description ? <Text className="text-xs text-muted-foreground">{it.description}</Text> : null}
                      <View className="flex-row flex-wrap gap-2 mt-2">
                        {it.model ? <Chip label={`Model: ${it.model}`} /> : null}
                        {it.serial ? <Chip label={`Serial: ${it.serial}`} /> : null}
                        {it.color ? <Chip label={`Color: ${it.color}`} /> : null}
                        {it.lastLocation ? <Chip label={`Location: ${it.lastLocation}`} /> : null}
                        {it.branch ? <Chip label={`Branch: ${it.branch}`} /> : null}
                        {it.postedAt ? <Chip label={`Posted: ${it.postedAt}`} /> : null}
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const Chip = ({ label }: { label: string }) => (
  <View className="px-2 py-0.5 rounded-full border bg-background border-border">
    <Text className="text-[11px] text-foreground">{label}</Text>
  </View>
);
