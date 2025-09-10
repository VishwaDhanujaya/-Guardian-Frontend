// app/(app)/incidents/my-reports.tsx
import { router } from "expo-router";
import { useMemo, useState, type ComponentType, type FC, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Inbox
} from "lucide-react-native";

/** Types */
type Priority = "Urgent" | "Normal" | "Low";
type Status = "New" | "In Review" | "Approved" | "Assigned" | "Ongoing" | "Resolved";
type IconType = ComponentType<{ size?: number; color?: string }>;

type Row = {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  reportedAgo: string;
};

/** Helpers */
const Card: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <View className={`bg-muted rounded-2xl border border-border ${className ?? ""}`}>
    <View className="p-4">{children}</View>
  </View>
);

const CardHeader: FC<{ title: string; tone?: "primary" | "ring" | "accent" | "destructive" | "foreground" }> = ({
  title,
  tone = "foreground",
}) => {
  const TONE_BG: Record<string, string> = {
    primary: "bg-primary",
    ring: "bg-ring",
    accent: "bg-accent",
    destructive: "bg-destructive",
    foreground: "bg-foreground",
  };
  return (
    <View>
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      <View className={`h-1 rounded-full mt-2 w-16 ${TONE_BG[tone]}`} />
    </View>
  );
};

const statusTone = (s: Status) =>
  s === "Resolved" ? "text-muted-foreground"
  : s === "Ongoing" || s === "Assigned" || s === "Approved" ? "text-ring"
  : s === "In Review" ? "text-primary"
  : "text-foreground";

const priorityPill = (p: Priority) =>
  p === "Urgent"
    ? { wrap: "bg-destructive/10 border-destructive/30", text: "text-destructive" }
    : p === "Normal"
    ? { wrap: "bg-ring/10 border-ring/30", text: "text-ring" }
    : { wrap: "bg-primary/10 border-primary/30", text: "text-primary" };

/** Screen */
export default function MyReports() {
  // Mock user's reports
  const all = useMemo<Row[]>(
    () => [
      { id: "m1", title: "Traffic accident · Main St", status: "Ongoing",   priority: "Urgent", reportedAgo: "2h ago" },
      { id: "m2", title: "Vandalism · Park gate",      status: "In Review", priority: "Normal", reportedAgo: "Yesterday" },
      { id: "m3", title: "Streetlight outage",         status: "Resolved",  priority: "Low",    reportedAgo: "2d ago" },
    ],
    []
  );

  const [filter, setFilter] = useState<"All" | "Pending" | "Ongoing" | "Resolved">("All");
  const filtered = useMemo(() => {
    if (filter === "All") return all;
    if (filter === "Pending") return all.filter((r) => r.status === "New" || r.status === "In Review");
    if (filter === "Ongoing") return all.filter((r) => r.status === "Approved" || r.status === "Assigned" || r.status === "Ongoing");
    return all.filter((r) => r.status === "Resolved");
  }, [all, filter]);

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={80}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{ flexGrow: 1, padding: 20 }}
    >
      {/* Top bar */}
      <View className="pt-10 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 -ml-2 px-2 py-1" hitSlop={8}>
            <ChevronLeft size={18} color="#0F172A" />
            <Text className="text-foreground">Back</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <ClipboardList size={18} color="#0F172A" />
            <Text className="text-xl font-semibold text-foreground">My reports</Text>
          </View>

          <View style={{ width: 56 }} />
        </View>
      </View>

      {/* Filters + list */}
      <Card>
        <CardHeader title="Your reports" tone="primary" />
        <View className="mt-3">
          <View className="flex-row flex-wrap gap-2">
            {(["All", "Pending", "Ongoing", "Resolved"] as const).map((f) => {
              const active = filter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full border ${active ? "bg-foreground/10 border-transparent" : "bg-background border-border"}`}
                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                >
                  <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{f}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* List */}
          <View className="mt-3">
            {filtered.length === 0 ? (
              <View className="bg-background rounded-xl border border-border p-6 items-center">
                <View className="w-14 h-14 rounded-full items-center justify-center bg-ring/10">
                  <Inbox size={28} color="#0F172A" />
                </View>
                <Text className="mt-3 font-semibold text-foreground">No reports yet</Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">When you submit a report, it will appear here.</Text>
              </View>
            ) : (
              filtered.map((r) => {
                const pr = priorityPill(r.priority);
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => router.push({ pathname: "/incidents/view", params: { id: r.id, role: "citizen" } })}
                    className="bg-background rounded-xl border border-border px-3 py-3 mb-2"
                    android_ripple={{ color: "rgba(0,0,0,0.04)" }}
                  >
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 pr-1 min-w-0">
                        <Text className="text-foreground" numberOfLines={2}>{r.title}</Text>
                        <View className="flex-row flex-wrap items-center gap-2 mt-1">
                          <Text className={`text-xs ${statusTone(r.status)}`}>{r.status}</Text>
                          <Text className="text-xs text-muted-foreground">• {r.reportedAgo}</Text>
                        </View>
                      </View>
                      <View className={`px-2 py-0.5 rounded-full border ${pr.wrap} self-start`}>
                        <Text className={`text-[11px] font-medium ${pr.text}`}>Priority: {r.priority}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-end mt-2">
                      <ChevronRight size={16} color="#94A3B8" />
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </Card>

      {/* CTA to create new */}
      <View className="mt-4">
        <Button onPress={() => router.push({ pathname: "/incidents", params: { role: "citizen" } })} className="h-12 rounded-xl">
          <Text className="text-primary-foreground">Report a new incident</Text>
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
}
