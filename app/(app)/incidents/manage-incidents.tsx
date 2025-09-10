// app/(app)/incidents/manage-incidents.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  Animated,
  Keyboard,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import useMountAnimation from "@/hooks/useMountAnimation";

import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Hammer,
  Inbox,
  Info as InfoIcon,
} from "lucide-react-native";

type Role = "citizen" | "officer";
type Priority = "Urgent" | "Normal" | "Low";
type Status =
  | "New"
  | "In Review"
  | "Approved"
  | "Assigned"
  | "Ongoing"
  | "Resolved";

type Note = { id: string; text: string; at: string; by: string };

type Row = {
  id: string;
  title: string;
  citizen: string;
  status: Status;
  suggestedPriority: Priority;
  reportedAgo: string;
  notes?: Note[];
  showUpdate?: boolean;
  showNotes?: boolean;
  newNoteDraft?: string;
  newNoteHeight?: number;
};

type TabKey = "pending" | "ongoing" | "solved";

function isTabKey(v: any): v is TabKey {
  return v === "pending" || v === "ongoing" || v === "solved";
}

export default function ManageIncidents() {
  const { role, tab: tabParam } = useLocalSearchParams<{ role?: string; tab?: string }>();
  const resolvedRole: Role = role === "officer" ? "officer" : "citizen";

  const { width } = useWindowDimensions();
  const isCompact = width < 360;
  const isNarrow = width < 400;

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

  // Mock data
  const [rows, setRows] = useState<Row[]>([
    { id: "m1", title: "Traffic accident · Main St", citizen: "Alex J.", status: "Ongoing",    suggestedPriority: "Urgent", reportedAgo: "1h ago", notes: [] },
    { id: "m2", title: "Vandalism · Park gate",      citizen: "Priya K.", status: "In Review", suggestedPriority: "Normal", reportedAgo: "12m ago", notes: [] },
    { id: "m3", title: "Robbery · 3rd Ave",          citizen: "Omar R.",  status: "Ongoing",   suggestedPriority: "Urgent", reportedAgo: "5m ago",  notes: [] },
    { id: "m4", title: "Lost item · Phone",          citizen: "Jin L.",   status: "In Review", suggestedPriority: "Low",    reportedAgo: "3m ago",  notes: [] },
    { id: "m5", title: "Power line down",            citizen: "Sara D.",  status: "Ongoing",   suggestedPriority: "Urgent", reportedAgo: "2h ago",  notes: [] },
    { id: "m6", title: "Suspicious activity",        citizen: "Ken M.",   status: "In Review", suggestedPriority: "Normal", reportedAgo: "8m ago",  notes: [] },
    { id: "m7", title: "Noise complaint",            citizen: "Maria P.", status: "Resolved",  suggestedPriority: "Low",    reportedAgo: "1d ago",  notes: [] },
  ]);

  // Tabs (init from URL if present)
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  useEffect(() => {
    if (isTabKey(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  // Priority filter
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All");
  const priorityWeight: Record<Priority, number> = { Urgent: 3, Normal: 2, Low: 1 };
  const statusWeight: Record<Status, number> = {
    "In Review": 5,
    Approved: 4,
    Assigned: 3,
    Ongoing: 2,
    Resolved: 1,
    New: 6,
  };

  // Partition by tab
  const tabBuckets = useMemo(() => {
    const pendingSet: Status[] = ["New", "In Review"];
    const ongoingSet: Status[] = ["Approved", "Assigned", "Ongoing"];
    const solvedSet: Status[]  = ["Resolved"];

    const pending = rows.filter(r => pendingSet.includes(r.status));
    const ongoing = rows.filter(r => ongoingSet.includes(r.status));
    const solved  = rows.filter(r => solvedSet.includes(r.status));

    return { pending, ongoing, solved } as const;
  }, [rows]);

  const counts = {
    pending: tabBuckets.pending.length,
    ongoing: tabBuckets.ongoing.length,
    solved:  tabBuckets.solved.length,
  } as const;

  // Visible rows by filter + sort
  const visibleRows = useMemo(() => {
    const base =
      activeTab === "pending" ? tabBuckets.pending :
      activeTab === "ongoing" ? tabBuckets.ongoing :
                                tabBuckets.solved;

    const filtered = base.filter(r => priorityFilter === "All" ? true : r.suggestedPriority === priorityFilter);

    return [...filtered].sort((a, b) => {
      const sw = statusWeight[b.status] - statusWeight[a.status];
      if (sw !== 0) return sw;
      const pw = priorityWeight[b.suggestedPriority] - priorityWeight[a.suggestedPriority];
      return pw;
    });
  }, [activeTab, tabBuckets, priorityFilter]);

  // Priority pill
  const prioPill = (p: Priority) =>
    p === "Urgent"
      ? { wrap: "bg-destructive/10 border-destructive/30", text: "text-destructive", Icon: AlertTriangle }
      : p === "Normal"
      ? { wrap: "bg-ring/10 border-ring/30", text: "text-ring", Icon: InfoIcon }
      : { wrap: "bg-primary/10 border-primary/30", text: "text-primary", Icon: CheckCircle2 };

  // Status tone
  const statusTone = (s: Status) =>
    s === "Ongoing" ? "text-ring"
      : s === "Resolved" ? "text-muted-foreground"
      : s === "In Review" ? "text-primary"
      : "text-foreground";

  // Small filter chip
  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1 rounded-full border ${active ? "bg-foreground/10 border-transparent" : "bg-background border-border"}`}
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
      hitSlop={8}
    >
      <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );

  // Toggle panels + actions
  const toggleUpdatePanel = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, showUpdate: !r.showUpdate, showNotes: false } : r)));
  const toggleNotesPanel = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, showNotes: !r.showNotes, showUpdate: false } : r)));

  const approveRow = (id: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status: "Approved", showUpdate: false } : r)));

  // REJECT: soft-archive (remove from list)
  const rejectRow = (id: string) =>
    setRows(prev => {
      const next = prev.filter(r => r.id !== id);
      toast.success("Report rejected");
      return next;
    });

  const setDraftNote = (id: string, text: string) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, newNoteDraft: text } : r)));

  const setNoteHeight = (id: string, height: number) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, newNoteHeight: height } : r)));

  const addNote = (id: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const text = (r.newNoteDraft ?? "").trim();
      if (!text) return r;
      const nextNote: Note = {
        id: `note_${Date.now()}`,
        text,
        at: new Date().toLocaleString(),
        by: "Officer",
      };
      const next: Row = {
        ...r,
        notes: [...(r.notes ?? []), nextNote],
        newNoteDraft: "",
        newNoteHeight: undefined,
        showNotes: true,
      };
      toast.success("Note added");
      return next;
    }));
  };

  // Segmented tabs (responsive)
  const TabButton = ({
    tab,
    label,
    count,
    Icon,
  }: {
    tab: TabKey;
    label: string;
    count?: number;
    Icon: ComponentType<{ size?: number; color?: string }>;
  }) => {
    const active = activeTab === tab;
    const h = isCompact ? 36 : 40;
    const iconSize = isCompact ? 14 : 16;
    const textCls = active
      ? (isCompact ? "text-primary-foreground text-[12px]" : "text-primary-foreground text-[13px]")
      : (isCompact ? "text-foreground text-[12px]" : "text-foreground text-[13px]");
    return (
      <Pressable
        onPress={() => {
          setActiveTab(tab);
          // Reflect tab in URL so view screen can return here
          router.setParams({ role: resolvedRole, tab });
        }}
        className={`flex-1 flex-row items-center justify-center gap-1 rounded-lg px-3 ${active ? "bg-foreground" : "bg-transparent"}`}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        style={{ height: h }}
      >
        <Icon size={iconSize} color={active ? "#FFFFFF" : "#0F172A"} />
        <Text className={textCls}>{label}</Text>
        {typeof count === "number" ? (
          <View className={active ? "bg-primary/30 px-1.5 py-0.5 rounded-full" : "bg-foreground/10 px-1.5 py-0.5 rounded-full"}>
            <Text className={isCompact ? (active ? "text-primary-foreground text-[10px]" : "text-foreground text-[10px]") : (active ? "text-primary-foreground text-[11px]" : "text-foreground text-[11px]")}>
              {count}
            </Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const canShowApprove = (status: Status) =>
    activeTab === "pending" && (status === "New" || status === "In Review");
  const canAddNote = (_status: Status) => true;

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      enableAutomaticScroll
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={120}
      onScrollBeginDrag={Keyboard.dismiss}
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
              <ClipboardList size={18} color="#0F172A" />
              <Text className="text-xl font-semibold text-foreground">Manage incidents</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          <Animated.View
            className="bg-muted rounded-2xl border border-border"
            style={[animStyle, { padding: isNarrow ? 12 : 16 }]}
          >
            {/* Tabs */}
            <View className="flex-row flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-1">
              <TabButton tab="pending"  label="Pending"  count={counts.pending} Icon={BadgeCheck} />
              <TabButton tab="ongoing"  label="Ongoing"  count={counts.ongoing} Icon={Hammer} />
              <TabButton tab="solved"   label="Solved"   count={counts.solved}  Icon={CheckCircle} />
            </View>

            {/* Filters */}
            <View className="mt-4">
              <Text className="text-xs text-foreground mb-1">Priority filter</Text>
              <View className="flex-row flex-wrap gap-2">
                {(["All", "Urgent", "Normal", "Low"] as const).map((p) => (
                  <Chip key={p} label={p} active={priorityFilter === p} onPress={() => setPriorityFilter(p)} />
                ))}
              </View>
            </View>

            {/* List */}
            <View className="mt-4">
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
                visibleRows.map((r) => {
                  const pill = prioPill(r.suggestedPriority);
                  const PillIcon = pill.Icon;

                  return (
                    <Pressable
                      key={r.id}
                      className="bg-background rounded-xl border border-border px-3 py-3 mb-3"
                      onPress={() =>
                        router.push({
                          pathname: "/incidents/view",
                          params: { id: r.id, role: resolvedRole, tab: activeTab },
                        })
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.04)" }}
                    >
                      {/* Header: responsive to avoid overlap */}
                      {isCompact ? (
                        <View className="gap-2">
                          <View className="pr-1 min-w-0">
                            <Text className="text-foreground shrink" numberOfLines={2} ellipsizeMode="tail">
                              {r.title}
                            </Text>

                            {/* Meta row with 'Read more' for In Review */}
                            <View className="flex-row flex-wrap items-center gap-2 mt-1">
                              <Text className={`text-xs ${statusTone(r.status)}`}>{r.status}</Text>
                              {r.status === "In Review" ? (
                                <Pressable
                                  onPress={() =>
                                    router.push({
                                      pathname: "/incidents/view",
                                      params: { id: r.id, role: resolvedRole, tab: activeTab },
                                    })
                                  }
                                  className="flex-row items-center"
                                  hitSlop={6}
                                >
                                  <Text className="text-xs text-primary"> · Read more</Text>
                                  <ChevronRight size={12} color="#2563EB" />
                                </Pressable>
                              ) : null}
                              <Text className="text-xs text-muted-foreground">• {r.reportedAgo}</Text>
                              <Text className="text-xs text-muted-foreground">• By {r.citizen}</Text>
                            </View>
                          </View>

                          <View className={`self-start px-2 py-0.5 rounded-full border flex-row items-center gap-1 ${pill.wrap}`}>
                            <PillIcon size={12} color="#0F172A" />
                            <Text className={`text-[11px] font-medium ${pill.text}`}>Priority: {r.suggestedPriority}</Text>
                          </View>
                        </View>
                      ) : (
                        <View className="flex-row flex-wrap items-start justify-between gap-3 gap-y-2">
                          <View className="flex-1 pr-1 min-w-0">
                            <Text className="text-foreground shrink" numberOfLines={2} ellipsizeMode="tail">
                              {r.title}
                            </Text>

                            <View className="flex-row flex-wrap items-center gap-2 mt-1">
                              <Text className={`text-xs ${statusTone(r.status)}`}>{r.status}</Text>
                              {r.status === "In Review" ? (
                                <Pressable
                                  onPress={() =>
                                    router.push({
                                      pathname: "/incidents/view",
                                      params: { id: r.id, role: resolvedRole, tab: activeTab },
                                    })
                                  }
                                  className="flex-row items-center"
                                  hitSlop={6}
                                >
                                  <Text className="text-xs text-primary"> · Read more</Text>
                                  <ChevronRight size={12} color="#2563EB" />
                                </Pressable>
                              ) : null}
                              <Text className="text-xs text-muted-foreground">• {r.reportedAgo}</Text>
                              <Text className="text-xs text-muted-foreground">• By {r.citizen}</Text>
                            </View>
                          </View>

                          <View className={`px-2 py-0.5 rounded-full border flex-row items-center gap-1 ${pill.wrap} self-start max-w-[60%]`}>
                            <PillIcon size={12} color="#0F172A" />
                            <Text className={`text-[11px] font-medium ${pill.text}`}>Priority: {r.suggestedPriority}</Text>
                          </View>
                        </View>
                      )}

                      {/* Actions: wrap cleanly */}
                      <View className="flex-row flex-wrap items-center gap-2 mt-3">
                        {activeTab === "pending" ? (
                          <>
                            <Button
                              size="sm"
                              variant={canShowApprove(r.status) ? "default" : "secondary"}
                              disabled={!canShowApprove(r.status)}
                              onPress={() => {
                                approveRow(r.id);
                                toast.success("Report approved");
                              }}
                              className="px-3 h-9 rounded-lg min-w-[120px]"
                            >
                              <View className="flex-row items-center gap-1">
                                <CheckCircle2 size={14} color={canShowApprove(r.status) ? "#FFFFFF" : "#0F172A"} />
                                <Text className={canShowApprove(r.status) ? "text-primary-foreground text-[12px]" : "text-foreground text-[12px]"}>Approve</Text>
                              </View>
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => rejectRow(r.id)}
                              className="px-3 h-9 rounded-lg min-w-[100px]"
                            >
                              <View className="flex-row items-center gap-1">
                                <AlertTriangle size={14} color="#DC2626" />
                                <Text className="text-[12px]" style={{ color: "#DC2626" }}>Reject</Text>
                              </View>
                            </Button>
                          </>
                        ) : null}

                        {activeTab === "ongoing" ? (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => toggleUpdatePanel(r.id)}
                              className="px-3 h-9 rounded-lg min-w-[120px]"
                            >
                              <View className="flex-row items-center gap-1">
                                <ClipboardList size={14} color="#0F172A" />
                                <Text className="text-[12px] text-foreground">Update status</Text>
                              </View>
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => toggleNotesPanel(r.id)}
                              className="px-3 h-9 rounded-lg min-w-[100px]"
                            >
                              <Text className="text-[12px] text-foreground">Notes</Text>
                            </Button>
                          </>
                        ) : null}

                        {activeTab === "solved" && canAddNote(r.status) ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => toggleNotesPanel(r.id)}
                            className="px-3 h-9 rounded-lg min-w-[100px]"
                          >
                            <Text className="text-[12px] text-foreground">Notes</Text>
                          </Button>
                        ) : null}
                      </View>

                      {/* Update Panel (Ongoing tab) */}
                      {activeTab === "ongoing" && r.showUpdate ? (
                        <View className="bg-muted rounded-xl border border-border p-3 mt-3">
                          <Text className="text-[12px] text-foreground">Set status</Text>
                          <View className="flex-row flex-wrap gap-2 mt-2">
                            {(["Approved", "Assigned", "Ongoing", "Resolved"] as const).map((opt) => {
                              const active = r.status === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  onPress={() => setRows(prev => prev.map(x => (x.id === r.id ? { ...x, status: opt } : x)))}
                                  className={`px-3 py-1 rounded-full border ${active ? "bg-foreground/10 border-transparent" : "bg-background border-border"}`}
                                  android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                                >
                                  <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{opt}</Text>
                                </Pressable>
                              );
                            })}
                          </View>

                          <View className="flex-row flex-wrap items-center justify-end mt-3 gap-2">
                            <Button variant="secondary" size="sm" className="px-3 h-9 rounded-lg" onPress={() => toggleUpdatePanel(r.id)}>
                              <Text className="text-foreground text-[12px]">Cancel</Text>
                            </Button>
                            <Button
                              size="sm"
                              className="px-3 h-9 rounded-lg"
                              onPress={() => {
                                setRows(prev => prev.map(x => (x.id === r.id ? { ...x, showUpdate: false } : x)));
                                toast.success("Status updated");
                              }}
                            >
                              <Text className="text-primary-foreground text-[12px]">Save</Text>
                            </Button>
                          </View>
                        </View>
                      ) : null}

                      {/* Notes Panel (citizen-visible) */}
                      {r.showNotes ? (
                        <View className="bg-muted rounded-xl border border-border mt-3 overflow-hidden">
                          {/* Header */}
                          <View className="px-4 py-3">
                            <View className="flex-row items-center gap-1">
                              <InfoIcon size={14} color="#0F172A" />
                              <Text className="text-[12px] text-foreground">Notes (visible to the citizen)</Text>
                            </View>
                          </View>

                          {/* Existing notes */}
                          <View className="px-4 pb-1">
                            {(r.notes ?? []).length > 0 ? (
                              (r.notes ?? []).slice().reverse().map(n => (
                                <View key={n.id} className="bg-background rounded-lg border border-border px-3 py-2 mb-2">
                                  <Text className="text-[12px] text-foreground">{n.text}</Text>
                                  <Text className="text-[10px] text-muted-foreground mt-1">{n.by} · {n.at}</Text>
                                </View>
                              ))
                            ) : (
                              <View className="bg-background rounded-lg border border-border px-3 py-2">
                                <Text className="text-[12px] text-muted-foreground">No notes yet.</Text>
                              </View>
                            )}
                          </View>

                          {/* Note editor */}
                          <View className="px-4 pt-2 pb-3">
                            <Input
                              value={r.newNoteDraft ?? ""}
                              onChangeText={(t) => setDraftNote(r.id, t)}
                              onContentSizeChange={(e) => setNoteHeight(r.id, e.nativeEvent.contentSize.height)}
                              placeholder="Add a note for the citizen…"
                              className="bg-background rounded-xl"
                              style={{ minHeight: 96, height: Math.max(96, r.newNoteHeight ?? 0), textAlignVertical: "top", paddingTop: 12 }}
                              multiline
                              numberOfLines={4}
                              scrollEnabled={false}
                            />
                          </View>

                          {/* Footer (inside card) */}
                          <View className="border-t border-border px-4 py-3 bg-muted">
                            <View className="flex-row flex-wrap items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="px-3 h-9 rounded-lg min-w-[96px]"
                                onPress={() => toggleNotesPanel(r.id)}
                              >
                                <Text className="text-foreground text-[12px]">Close</Text>
                              </Button>
                              <Button
                                size="sm"
                                className="px-3 h-9 rounded-lg min-w-[96px]"
                                onPress={() => addNote(r.id)}
                              >
                                <Text className="text-primary-foreground text-[12px]">Add note</Text>
                              </Button>
                            </View>
                          </View>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </View>
          </Animated.View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
