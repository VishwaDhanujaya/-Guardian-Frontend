// app/(app)/incidents/manage-incidents.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Keyboard,
    Pressable,
    Switch,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";

import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle,
    CheckCircle2,
    ChevronLeft,
    ClipboardList,
    Hammer,
    Inbox,
    Info,
    MessageSquare,
} from "lucide-react-native";

type Role = "citizen" | "officer";
type Priority = "Urgent" | "Normal" | "Low";
type Status =
  | "New"
  | "In Review"
  | "Approved"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Overdue";

type Row = {
  id: string;
  title: string;
  citizen: string;
  status: Status;
  suggestedPriority: Priority;
  reportedAgo: string;
  slaProgress?: number;
  showUpdate?: boolean;
  showMessage?: boolean;
  notifyCitizen?: boolean;
  messageDraft?: string;
};

type TabKey = "approve" | "update" | "solved";

export default function ManageIncidents() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const resolvedRole: Role = role === "officer" ? "officer" : "citizen";

  // Nav safety
  const navigation = useNavigation<any>();
  const goBack = useCallback(() => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else router.replace({ pathname: "/home", params: { role: resolvedRole } });
  }, [navigation, resolvedRole]);

  // Mount animation
  const mount = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(mount, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [mount]);
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  };

  // Data (mock)
  const [rows, setRows] = useState<Row[]>([
    { id: "m1", title: "Traffic accident · Main St", citizen: "Alex J.", status: "Overdue",     suggestedPriority: "Urgent", reportedAgo: "1h ago", slaProgress: 95 },
    { id: "m2", title: "Vandalism · Park gate",      citizen: "Priya K.", status: "New",         suggestedPriority: "Normal", reportedAgo: "12m ago", slaProgress: 10 },
    { id: "m3", title: "Robbery · 3rd Ave",          citizen: "Omar R.",  status: "In Progress", suggestedPriority: "Urgent", reportedAgo: "5m ago",  slaProgress: 40 },
    { id: "m4", title: "Lost item · Phone",          citizen: "Jin L.",   status: "New",         suggestedPriority: "Low",    reportedAgo: "3m ago",  slaProgress: 5  },
    { id: "m5", title: "Power line down",            citizen: "Sara D.",  status: "Overdue",     suggestedPriority: "Urgent", reportedAgo: "2h ago", slaProgress: 98 },
    { id: "m6", title: "Suspicious activity",        citizen: "Ken M.",   status: "In Review",   suggestedPriority: "Normal", reportedAgo: "8m ago",  slaProgress: 15 },
    { id: "m7", title: "Noise complaint",            citizen: "Maria P.", status: "Resolved",    suggestedPriority: "Low",    reportedAgo: "1d ago" },
  ]);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>("approve");

  // Priority filter (applies within tab)
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const priorityWeight: Record<Priority, number> = { Urgent: 3, Normal: 2, Low: 1 };
  const statusWeight: Record<Status, number> = {
    Overdue: 7, New: 6, "In Review": 5, Approved: 4, Assigned: 3, "In Progress": 2, Resolved: 1, Closed: 0,
  };

  // Partition rows by tab
  const tabBuckets = useMemo(() => {
    const approveSet: Status[] = ["New", "In Review"];
    const updateSet: Status[] = ["Approved", "Assigned", "In Progress", "Overdue"];
    const solvedSet:  Status[] = ["Resolved", "Closed"];

    const approve = rows.filter(r => approveSet.includes(r.status));
    const update  = rows.filter(r => updateSet.includes(r.status));
    const solved  = rows.filter(r => solvedSet.includes(r.status));

    return { approve, update, solved };
  }, [rows]);

  // Counts (for tab badges)
  const counts = {
    approve: tabBuckets.approve.length,
    update:  tabBuckets.update.length,
    solved:  tabBuckets.solved.length,
  };

  // List for active tab + priority filter + sensible sort
  const visibleRows = useMemo(() => {
    const base =
      activeTab === "approve" ? tabBuckets.approve :
      activeTab === "update"  ? tabBuckets.update  :
                                tabBuckets.solved;

    const filtered = base.filter(r => priorityFilter === "All" ? true : r.suggestedPriority === priorityFilter);

    filtered.sort((a, b) => {
      // Overdue & higher status first (use weight within the subset)
      const sw = statusWeight[b.status] - statusWeight[a.status];
      if (sw !== 0) return sw;
      // Higher suggested priority next
      const pw = priorityWeight[b.suggestedPriority] - priorityWeight[a.suggestedPriority];
      if (pw !== 0) return pw;
      // Higher SLA usage last
      return (b.slaProgress ?? 0) - (a.slaProgress ?? 0);
    });

    return filtered;
  }, [activeTab, tabBuckets, priorityFilter]);

  // Helpers
  const prioPill = (p: Priority) =>
    p === "Urgent"
      ? { wrap: "bg-destructive/10 border-destructive/30", text: "text-destructive", Icon: AlertTriangle }
      : p === "Normal"
      ? { wrap: "bg-ring/10 border-ring/30", text: "text-ring", Icon: Info }
      : { wrap: "bg-primary/10 border-primary/30", text: "text-primary", Icon: CheckCircle2 };

  const statusTone = (s: Status) =>
    s === "Overdue" ? "text-destructive"
      : s === "In Progress" ? "text-ring"
      : s === "Resolved" || s === "Closed" ? "text-muted-foreground"
      : "text-foreground";

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1 rounded-full border ${active ? "bg-foreground/10 border-transparent" : "bg-background border-border"}`}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
    >
      <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );

  // Action toggles per row
  const toggleUpdatePanel = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, showUpdate: !r.showUpdate, showMessage: false } : r)));
  const toggleMessagePanel = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, showMessage: !r.showMessage, showUpdate: false } : r)));

  const approveRow = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: "Approved", showUpdate: false } : r)));

  const setDraft = (id: string, text: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, messageDraft: text } : r)));
  const setNotify = (id: string, value: boolean) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, notifyCitizen: value } : r)));

  const saveStatus = (id: string, newStatus: Status, notify: boolean, msg?: string) => {
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, status: newStatus, showUpdate: false, notifyCitizen: false, messageDraft: "" } : r))
    );
    if (notify && (msg?.trim()?.length ?? 0) > 0) toast.success("Update sent to citizen");
    else toast.success("Status updated");
  };

  const sendMessage = (id: string, msg?: string) => {
    if (!msg || !msg.trim()) return;
    setRows(prev => prev.map(r => (r.id === id ? { ...r, showMessage: false, messageDraft: "" } : r)));
    toast.success("Message sent to citizen");
  };

  const statusOptions: Status[] = ["New", "In Review", "Approved", "Assigned", "In Progress", "Resolved", "Closed"];
  const templates = [
    "We’ve received your report and are reviewing it.",
    "Your case has been approved and assigned.",
    "We’re on our way.",
    "Your report has been resolved. Thank you!",
  ];

  // Tab button (segmented style)
  const TabButton = ({
    tab,
    label,
    count,
    Icon,
  }: {
    tab: TabKey;
    label: string;
    count?: number;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
  }) => {
    const active = activeTab === tab;
    return (
      <Pressable
        onPress={() => setActiveTab(tab)}
        className={`flex-1 flex-row items-center justify-center gap-2 h-10 rounded-xl border ${
          active ? "bg-foreground border-transparent" : "bg-background border-border"
        }`}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      >
        <Icon size={16} color={active ? "#FFFFFF" : "#0F172A"} />
        <Text className={active ? "text-primary-foreground text-[13px]" : "text-foreground text-[13px]"}>{label}</Text>
        {typeof count === "number" ? (
          <View className={active ? "bg-primary/30 px-1.5 py-0.5 rounded-full" : "bg-foreground/10 px-1.5 py-0.5 rounded-full"}>
            <Text className={active ? "text-primary-foreground text-[11px]" : "text-foreground text-[11px]"}>{count}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  // Action availability by tab
  const canShowApprove = (status: Status) => activeTab === "approve" && (status === "New" || status === "In Review");
  const canShowUpdate = (status: Status) => activeTab === "update"; // update tab controls statuses
  const canShowMessage = (status: Status) =>
    activeTab === "approve" || activeTab === "update" || (activeTab === "solved" && status !== "Closed" ? true : true);

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

            <View className="flex-row items-center gap-2">
              <ClipboardList size={18} color="#0F172A" />
              <Text className="text-xl font-semibold text-foreground">Manage incidents</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          {/* Tabs */}
          <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-4" style={animStyle}>
            <View className="flex-row gap-2">
              <TabButton tab="approve" label="Approve" count={counts.approve} Icon={BadgeCheck} />
              <TabButton tab="update"  label="Update"  count={counts.update}  Icon={Hammer} />
              <TabButton tab="solved"  label="Solved"  count={counts.solved}  Icon={CheckCircle} />
            </View>

            {/* Priority filter */}
            <View>
              <Text className="text-xs text-foreground mb-1">Suggested priority</Text>
              <View className="flex-row flex-wrap gap-2">
                {(["All", "Urgent", "Normal", "Low"] as const).map((p) => (
                  <Chip key={p} label={p} active={priorityFilter === p} onPress={() => setPriorityFilter(p)} />
                ))}
              </View>
            </View>

            {/* List */}
            {visibleRows.length === 0 ? (
              <View className="bg-background rounded-xl border border-border p-6 items-center">
                <View className="w-14 h-14 rounded-full items-center justify-center bg-ring/10">
                  <Inbox size={28} color="#0F172A" />
                </View>
                <Text className="mt-3 font-semibold text-foreground">Nothing here</Text>
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  Try a different tab or adjust the priority filter.
                </Text>
              </View>
            ) : (
              <View className="mt-1">
                {visibleRows.map((r) => {
                  const pill = prioPill(r.suggestedPriority);
                  const PillIcon = pill.Icon;

                  return (
                    <View key={r.id} className="bg-background rounded-xl border border-border px-3 py-3 mb-2">
                      {/* Header */}
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <Text className="text-foreground">{r.title}</Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Text className={`text-xs ${statusTone(r.status)}`}>{r.status}</Text>
                            <Text className="text-xs text-muted-foreground">• {r.reportedAgo}</Text>
                            <Text className="text-xs text-muted-foreground">• By {r.citizen}</Text>
                          </View>
                        </View>

                        <View className={`px-2 py-0.5 rounded-full border flex-row items-center gap-1 ${pill.wrap}`}>
                          <PillIcon size={12} color="#0F172A" />
                          <Text className={`text-[11px] font-medium ${pill.text}`}>Suggested: {r.suggestedPriority}</Text>
                        </View>
                      </View>

                      {/* SLA progress (where available) */}
                      {typeof r.slaProgress === "number" ? (
                        <View className="mt-3">
                          <View className="h-2 rounded-full bg-primary/10 overflow-hidden">
                            <View
                              style={{ width: `${Math.max(0, Math.min(100, r.slaProgress))}%` }}
                              className={`h-2 rounded-full ${
                                r.slaProgress > 90 ? "bg-destructive" : r.slaProgress > 60 ? "bg-ring" : "bg-primary"
                              }`}
                            />
                          </View>
                          <Text className="text-[10px] text-muted-foreground mt-0.5">SLA usage</Text>
                        </View>
                      ) : null}

                      {/* Actions (vary by tab) */}
                      <View className="flex-row items-center gap-2 mt-3">
                        {/* Approve tab: Approve + Message */}
                        {activeTab === "approve" ? (
                          <>
                            <Button
                              size="sm"
                              variant={canShowApprove(r.status) ? "default" : "secondary"}
                              disabled={!canShowApprove(r.status)}
                              onPress={() => {
                                approveRow(r.id);
                                toast.success("Report approved");
                              }}
                              className="px-3 h-9 rounded-lg"
                            >
                              <View className="flex-row items-center gap-1">
                                <CheckCircle2 size={14} color={canShowApprove(r.status) ? "#FFFFFF" : "#0F172A"} />
                                <Text className={canShowApprove(r.status) ? "text-primary-foreground text-[12px]" : "text-foreground text-[12px]"}>
                                  Approve
                                </Text>
                              </View>
                            </Button>

                            <Button
                              size="sm"
                              onPress={() => toggleMessagePanel(r.id)}
                              className="px-3 h-9 rounded-lg"
                            >
                              <View className="flex-row items-center gap-1">
                                <MessageSquare size={14} color="#FFFFFF" />
                                <Text className="text-primary-foreground text-[12px]">Message</Text>
                              </View>
                            </Button>
                          </>
                        ) : null}

                        {/* Update tab: Update Status + Message */}
                        {activeTab === "update" ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => toggleUpdatePanel(r.id)}
                              className="px-3 h-9 rounded-lg"
                            >
                              <View className="flex-row items-center gap-1">
                                <ClipboardList size={14} color="#0F172A" />
                                <Text className="text-[12px] text-foreground">Update status</Text>
                              </View>
                            </Button>

                            <Button
                              size="sm"
                              onPress={() => toggleMessagePanel(r.id)}
                              className="px-3 h-9 rounded-lg"
                            >
                              <View className="flex-row items-center gap-1">
                                <MessageSquare size={14} color="#FFFFFF" />
                                <Text className="text-primary-foreground text-[12px]">Message</Text>
                              </View>
                            </Button>
                          </>
                        ) : null}

                        {/* Solved tab: Message only */}
                        {activeTab === "solved" ? (
                          <Button
                            size="sm"
                            onPress={() => toggleMessagePanel(r.id)}
                            className="px-3 h-9 rounded-lg"
                          >
                            <View className="flex-row items-center gap-1">
                              <MessageSquare size={14} color="#FFFFFF" />
                              <Text className="text-primary-foreground text-[12px]">Message</Text>
                            </View>
                          </Button>
                        ) : null}
                      </View>

                      {/* Inline Update Panel (only in Update tab) */}
                      {activeTab === "update" && r.showUpdate ? (
                        <View className="bg-muted rounded-xl border border-border p-3 mt-3">
                          <Text className="text-[12px] text-foreground">Set status</Text>
                          <View className="flex-row flex-wrap gap-2 mt-2">
                            {(["Approved", "Assigned", "In Progress", "Resolved", "Closed"] as const).map((opt) => {
                              const active = r.status === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => setRows(prev => prev.map(x => (x.id === r.id ? { ...x, status: opt } : x)))}
                                  className={`px-3 py-1 rounded-full border ${
                                    active ? "bg-foreground/10 border-transparent" : "bg-background border-border"
                                  }`}
                                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                                >
                                  <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{opt}</Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          <View className="flex-row items-center justify-between mt-3">
                            <View className="flex-row items-center gap-2">
                              <Switch value={r.notifyCitizen ?? false} onValueChange={(v) => setNotify(r.id, v)} />
                              <Text className="text-[12px] text-foreground">Notify citizen</Text>
                            </View>
                            <Text className="text-[11px] text-muted-foreground">Optional message</Text>
                          </View>

                          <Input
                            value={r.messageDraft ?? ""}
                            onChangeText={(t) => setDraft(r.id, t)}
                            placeholder="Type a short update…"
                            className="bg-background mt-2 rounded-xl"
                            style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }}
                            multiline
                          />

                          <View className="flex-row items-center justify-end mt-3 gap-2">
                            <Button variant="secondary" size="sm" className="px-3 h-9 rounded-lg" onPress={() => toggleUpdatePanel(r.id)}>
                              <Text className="text-foreground text-[12px]">Cancel</Text>
                            </Button>
                            <Button
                              size="sm"
                              className="px-3 h-9 rounded-lg"
                              onPress={() => saveStatus(r.id, r.status, !!r.notifyCitizen, r.messageDraft)}
                            >
                              <Text className="text-primary-foreground text-[12px]">Save</Text>
                            </Button>
                          </View>
                        </View>
                      ) : null}

                      {/* Inline Message Panel (all tabs) */}
                      {r.showMessage ? (
                        <View className="bg-muted rounded-xl border border-border p-3 mt-3">
                          <Text className="text-[12px] text-foreground">Message citizen</Text>

                          <View className="flex-row flex-wrap gap-2 mt-2">
                            {templates.map((t) => (
                              <Pressable
                                key={t}
                                onPress={() => setDraft(r.id, t)}
                                className="px-3 py-1 rounded-full border bg-background border-border"
                                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                              >
                                <Text className="text-[11px] text-muted-foreground">{t}</Text>
                              </Pressable>
                            ))}
                          </View>

                          <Input
                            value={r.messageDraft ?? ""}
                            onChangeText={(t) => setDraft(r.id, t)}
                            placeholder="Write your message…"
                            className="bg-background mt-2 rounded-xl"
                            style={{ minHeight: 100, textAlignVertical: "top", paddingTop: 12 }}
                            multiline
                          />

                          <View className="flex-row items-center justify-between mt-3">
                            <View className="flex-row items-center gap-2">
                              <Switch value={r.notifyCitizen ?? true} onValueChange={(v) => setNotify(r.id, v)} />
                              <Text className="text-[12px] text-foreground">Notify citizen</Text>
                            </View>
                            <View className="flex-row items-center gap-2">
                              <Button variant="secondary" size="sm" className="px-3 h-9 rounded-lg" onPress={() => toggleMessagePanel(r.id)}>
                                <Text className="text-foreground text-[12px]">Cancel</Text>
                              </Button>
                              <Button size="sm" className="px-3 h-9 rounded-lg" onPress={() => sendMessage(r.id, r.messageDraft)}>
                                <Text className="text-primary-foreground text-[12px]">Send</Text>
                              </Button>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
