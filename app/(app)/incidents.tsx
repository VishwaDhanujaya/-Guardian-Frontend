// app/(app)/incidents.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Keyboard,
    Pressable,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
    FilePlus2,
    FileText,
    Image as ImageIcon,
    Inbox,
    MapPin,
    NotebookPen,
    PencilLine,
    Phone,
    ShieldPlus,
    Trash2,
    UserPlus,
    UserRound,
} from "lucide-react-native";

type Role = "citizen" | "officer";

/** DEFAULT EXPORTED PAGE COMPONENT */
export default function Incidents() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === "officer" ? "officer" : "citizen";

  // Safe back: if no history, go to /home with role
  const navigation = useNavigation<any>();
  const goBack = useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      router.replace({ pathname: "/home", params: { role } });
    }
  }, [navigation, role]);

  // Subtle mount animation
  const mountAnim = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(mountAnim, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);

  const animStyle = {
    opacity: mountAnim.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mountAnim.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={80}
      onScrollBeginDrag={Keyboard.dismiss}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#FFFFFF" }}
    >
      <View className="flex-1 p-5">
        <View className="pt-10 pb-6">
          {/* Top bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={goBack} className="flex-row items-center gap-1 px-2 py-1 -ml-2">
              <ChevronLeft size={18} color="#0F172A" />
              <Text className="text-foreground">Back</Text>
            </Pressable>

            {role === "citizen" ? (
              <View className="flex-row items-center gap-2">
                <ShieldPlus size={18} color="#0F172A" />
                <Text className="text-xl font-semibold text-foreground">Report incident</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <ClipboardList size={18} color="#0F172A" />
                <Text className="text-xl font-semibold text-foreground">Manage incidents</Text>
              </View>
            )}

            <View style={{ width: 56 }} />{/* spacer */}
          </View>

          {/* Role-conditional body */}
          {role === "citizen" ? (
            <CitizenReport animStyle={animStyle} role={role} />
          ) : (
            <OfficerManage animStyle={animStyle} />
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

/* ---------------- CITIZEN VIEW: Report Incident + Witness flow ---------------- */
function CitizenReport({ animStyle, role }: { animStyle: any; role: Role }) {
  const [category, setCategory] = useState<"Theft" | "Accident" | "Hazard" | "Other">("Accident");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");

  type Witness = { id: string; name: string; phone: string; expanded: boolean };
  const [witnesses, setWitnesses] = useState<Witness[]>([]);

  const canBaseSubmit = location.trim().length > 2 && desc.trim().length > 5;

  const sanitizePhone = (v: string) => v.replace(/\D+/g, "").slice(0, 10);
  const isValidPhone = (v: string) => /^0\d{9}$/.test(v);

  const witnessesValid =
    witnesses.length === 0 ||
    witnesses.every((w) => w.name.trim().length > 0 && isValidPhone(w.phone));

  const canSubmit = canBaseSubmit && witnessesValid;

  const addWitness = () =>
    setWitnesses((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), name: "", phone: "", expanded: true }, // show form first
    ]);

  const removeWitness = (id: string) =>
    setWitnesses((prev) => prev.filter((w) => w.id !== id));

  const toggleExpanded = (id: string, force?: boolean) =>
    setWitnesses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, expanded: force ?? !w.expanded } : w))
    );

  const setWitnessField = (id: string, field: "name" | "phone", value: string) =>
    setWitnesses((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, [field]: field === "phone" ? sanitizePhone(value) : value.replace(/\s+/g, " ") }
          : w
      )
    );

  const doneEdit = (id: string) => {
    const w = witnesses.find((x) => x.id === id);
    if (!w) return;
    if (w.name.trim().length === 0 || !isValidPhone(w.phone)) return; // keep open, show error
    toggleExpanded(id, false);
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    router.replace({ pathname: "/home", params: { role } });
  };

  const Chip = ({ value }: { value: "Theft" | "Accident" | "Hazard" | "Other" }) => {
    const active = category === value;
    return (
      <Pressable
        onPress={() => setCategory(value)}
        className={`px-3 py-1 rounded-full border ${
          active ? "bg-primary/10 border-transparent" : "bg-background border-border"
        }`}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        <Text className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>{value}</Text>
      </Pressable>
    );
  };

  return (
    <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-4" style={animStyle}>
      {/* Category */}
      <View>
        <Text className="text-xs text-foreground mb-1">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          <Chip value="Accident" />
          <Chip value="Theft" />
          <Chip value="Hazard" />
          <Chip value="Other" />
        </View>
      </View>

      {/* Location */}
      <View className="gap-1">
        <Label nativeID="locLabel" className="text-xs">
          <Text className="text-xs text-foreground">Location</Text>
        </Label>
        <View className="relative">
          <MapPin size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
          <Input
            aria-labelledby="locLabel"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Main St & 5th"
            className="bg-background h-12 rounded-xl pl-9"
            returnKeyType="next"
          />
        </View>
      </View>

      {/* Description */}
      <View className="gap-1">
        <Label nativeID="descLabel" className="text-xs">
          <Text className="text-xs text-foreground">Description</Text>
        </Label>
        <View className="relative">
          <NotebookPen size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
          <Input
            aria-labelledby="descLabel"
            value={desc}
            onChangeText={setDesc}
            placeholder="What happened?"
            className="bg-background rounded-xl pl-9"
            style={{ minHeight: 100, paddingTop: 14, textAlignVertical: "top" }}
            multiline
          />
        </View>
      </View>

      {/* Attachment */}
      <View className="bg-background rounded-xl border border-border p-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <ImageIcon size={18} color="#0F172A" />
          <Text className="text-foreground">Attach photo (optional)</Text>
        </View>
        <Button size="sm" variant="secondary" onPress={() => {}}>
          <View className="flex-row items-center gap-1">
            <FilePlus2 size={14} color="#0F172A" />
            <Text className="text-foreground">Choose</Text>
          </View>
        </Button>
      </View>

      {/* Witnesses */}
      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs text-foreground">Witnesses (optional)</Text>
          <Button size="sm" variant="secondary" onPress={addWitness} className="h-8 px-2 rounded-lg">
            <View className="flex-row items-center gap-1">
              <UserPlus size={14} color="#0F172A" />
              <Text className="text-[12px] text-foreground">Add witness</Text>
            </View>
          </Button>
        </View>

        {witnesses.length === 0 ? (
          <View className="bg-background rounded-xl border border-border p-3 items-center">
            <Text className="text-xs text-muted-foreground">No witnesses added.</Text>
          </View>
        ) : (
          <View className="gap-2">
            {witnesses.map((w) => {
              const nameOk = w.name.trim().length > 0;
              const phoneOk = isValidPhone(w.phone);
              const showError = w.expanded && (!nameOk || !phoneOk);

              if (!w.expanded) {
                // Collapsed summary chip
                return (
                  <Pressable
                    key={w.id}
                    onPress={() => toggleExpanded(w.id, true)}
                    className="bg-background rounded-xl border border-border px-3 py-3 flex-row items-center justify-between"
                    android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className="w-8 h-8 rounded-full items-center justify-center bg-primary/10">
                        <UserRound size={18} color="#0F172A" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-foreground">
                          {nameOk ? w.name : <Text className="text-muted-foreground">Unnamed</Text>}
                        </Text>
                        <Text className={`text-xs mt-0.5 ${phoneOk ? "text-primary" : "text-muted-foreground"}`}>
                          {w.phone ? w.phone : "Add phone"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <PencilLine size={16} color="#94A3B8" />
                      <ChevronRight size={16} color="#94A3B8" />
                    </View>
                  </Pressable>
                );
              }

              // Expanded editor (shown when adding)
              return (
                <View key={w.id} className="bg-background rounded-xl border border-border p-3">
                  {/* Name */}
                  <View className="gap-1">
                    <Label nativeID={`wname-${w.id}`} className="text-[11px]">
                      <Text className="text-[11px] text-foreground">Name</Text>
                    </Label>
                    <View className="relative">
                      <UserRound size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                      <Input
                        aria-labelledby={`wname-${w.id}`}
                        value={w.name}
                        onChangeText={(t) => setWitnessField(w.id, "name", t)}
                        placeholder="e.g. Jamie Lee"
                        className="bg-background h-12 rounded-xl pl-9"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Phone */}
                  <View className="gap-1 mt-2">
                    <Label nativeID={`wphone-${w.id}`} className="text-[11px]">
                      <Text className="text-[11px] text-foreground">Phone</Text>
                    </Label>
                    <View className="relative">
                      <Phone size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                      <Input
                        aria-labelledby={`wphone-${w.id}`}
                        value={w.phone}
                        onChangeText={(t) => setWitnessField(w.id, "phone", t)}
                        placeholder="e.g. 0714404243"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        className="bg-background h-12 rounded-xl pl-9 pr-10"
                        maxLength={10}
                      />
                      {/* Remove */}
                      <Pressable
                        onPress={() => removeWitness(w.id)}
                        className="absolute right-1 top-1 h-10 w-10 rounded-full items-center justify-center"
                        android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
                        accessibilityLabel="Remove witness"
                      >
                        <Trash2 size={16} color="#0F172A" />
                      </Pressable>
                    </View>

                    {/* Inline error + format helper */}
                    {showError ? (
                      <Text className="text-[11px] text-destructive mt-1">
                        {nameOk ? "Enter a valid phone (10 digits starting with 0)." : "Enter the witness name."}
                      </Text>
                    ) : null}
                    <Text className="text-[11px] text-muted-foreground mt-1">Format: 0XXXXXXXXX</Text>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center justify-between mt-3">
                    <Button variant="link" onPress={() => removeWitness(w.id)} className="h-auto p-0">
                      <View className="flex-row items-center gap-1">
                        <Trash2 size={14} color="#DC2626" />
                        <Text className="text-[12px] text-destructive">Remove</Text>
                      </View>
                    </Button>
                    <Button size="sm" onPress={() => doneEdit(w.id)} className="px-3 h-9 rounded-lg">
                      <Text className="text-primary-foreground">Done</Text>
                    </Button>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <Button
        onPress={onSubmit}
        size="lg"
        variant="default"
        className="mt-1 h-12 rounded-xl"
        disabled={!canSubmit}
      >
        <Text className="font-semibold text-primary-foreground">Submit report</Text>
      </Button>
    </Animated.View>
  );
}

/* ---------------- OFFICER VIEW: Manage Incidents ---------------- */
function OfficerManage({ animStyle }: { animStyle: any }) {
  type Row = { id: string; title: string; meta: string; kind: "New" | "Overdue" | "High" };

  const all = useMemo<Row[]>(
    () => [
      { id: "m1", title: "Traffic accident · Main St", meta: "Overdue · 1h", kind: "Overdue" },
      { id: "m2", title: "Vandalism report", meta: "New · 10m", kind: "New" },
      { id: "m3", title: "Robbery · High priority", meta: "High · 5m", kind: "High" },
    ],
    []
  );

  const [filter, setFilter] = useState<"All" | "New" | "Overdue" | "High">("All");
  const rows = useMemo(() => (filter === "All" ? all : all.filter((r) => r.kind === filter)), [all, filter]);

  const Chip = ({ v }: { v: "All" | "New" | "Overdue" | "High" }) => {
    const active = filter === v;
    return (
      <Pressable
        onPress={() => setFilter(v)}
        className={`px-3 py-1 rounded-full border ${
          active ? "bg-primary/10 border-transparent" : "bg-background border-border"
        }`}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        <Text className={`text-xs ${active ? "text-primary" : "text-muted-foreground"}`}>{v}</Text>
      </Pressable>
    );
  };

  const Empty = () => (
    <View className="bg-background rounded-xl border border-border p-6 items-center">
      <View className="w-14 h-14 rounded-full items-center justify-center bg-ring/10">
        <Inbox size={28} color="#0F172A" />
      </View>
      <Text className="mt-3 font-semibold text-foreground">No incidents</Text>
      <Text className="text-xs text-muted-foreground mt-1 text-center">New reports will appear here.</Text>
    </View>
  );

  const kindTone = (k: Row["kind"]) =>
    k === "Overdue" ? "text-destructive" : k === "High" ? "text-ring" : "text-primary";

  return (
    <Animated.View className="bg-muted rounded-2xl border border-border p-4" style={animStyle}>
      <View className="flex-row gap-2 mb-3">
        <Chip v="All" />
        <Chip v="New" />
        <Chip v="Overdue" />
        <Chip v="High" />
      </View>

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <View className="mt-1">
          {rows.map((r) => (
            <View
              key={r.id}
              className="bg-background rounded-xl border border-border px-3 py-3 mb-2 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-8 h-8 rounded-full items-center justify-center bg-primary/10">
                  {r.kind === "Overdue" ? (
                    <Clock size={18} color="#0F172A" />
                  ) : r.kind === "High" ? (
                    <AlertTriangle size={18} color="#0F172A" />
                  ) : (
                    <FileText size={18} color="#0F172A" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-foreground">{r.title}</Text>
                  <Text className={`text-xs mt-0.5 ${kindTone(r.kind)}`}>{r.meta}</Text>
                </View>
              </View>
              <Button size="sm" onPress={() => {}}>
                <Text className="text-primary-foreground">Open</Text>
              </Button>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
