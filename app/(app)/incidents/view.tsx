// app/(app)/incidents/view.tsx
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  createElement,
} from "react";
import { ActivityIndicator, Animated, Keyboard, Pressable, Switch, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import useMountAnimation from "@/hooks/useMountAnimation";
import { getIncident, Note, Report } from "@/lib/api";

import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  FileText,
  Info,
  MapPin,
  MessageSquare,
  PackageSearch,
  ShieldAlert,
} from "lucide-react-native";

type Role = "citizen" | "officer";
type Priority = "Urgent" | "Normal" | "Low";
type Status = "New" | "In Review" | "Approved" | "Assigned" | "Ongoing" | "Resolved";
type Section = "pending" | "ongoing" | "solved";

function getMockReport(id: string): Report {
  return {
    id,
    title: "Traffic accident · Main St",
    category: "Safety",
    location: "Main St & 3rd Ave",
    reportedBy: "Alex Johnson",
    reportedAt: "Today · 3:10 PM",
    status: "In Review",
    priority: "Urgent",
    description:
      "Two vehicles collided at the intersection. No visible fire. One lane blocked. Requesting traffic control.",
    notes: [{ id: "n1", text: "Report received. Reviewing details.", at: "3:12 PM", by: "System" }],
  };
}

export default function ViewIncident() {
  const { id, role: roleParam, tab: tabParam } = useLocalSearchParams<{ id?: string; role?: string; tab?: string }>();
  const role: Role = roleParam === "officer" ? "officer" : "citizen";

  const isSection = (v: any): v is Section => v === "pending" || v === "ongoing" || v === "solved";
  const backTab: Section | undefined = isSection(tabParam) ? (tabParam as Section) : undefined;

  // Entrance animation
  const { value: mount } = useMountAnimation({ damping: 14, stiffness: 160, mass: 0.6 });
  const animStyle = {
    opacity: mount.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: mount.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  } as const;

  // Mock report for offline retry option
  const mockReport = useMemo(() => (id ? getMockReport(id) : null), [id]);

  // Load report
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<Status>("New");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoadError(false);
    setReport(null);
    getIncident(id)
      .then((data) => {
        setReport(data);
        setStatus(data.status);
        setPriority(data.priority);
        setNotes(data.notes ?? []);
      })
      .catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const [showUpdate, setShowUpdate] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [newNoteDraft, setNewNoteDraft] = useState("");
  const [newNoteHeight, setNewNoteHeight] = useState<number | undefined>(undefined);
  const [notifyCitizen, setNotifyCitizen] = useState(true);

  // SECTION logic:
  // - Officers: honor the tab they came from (Pending / Ongoing / Solved), regardless of current status.
  // - Citizens: infer from current status.
  const section: Section = useMemo<Section>(() => {
    if (role === "officer" && backTab) return backTab;
    if (status === "Resolved") return "solved";
    if (status === "New" || status === "In Review") return "pending";
    return "ongoing"; // Approved, Assigned, Ongoing
  }, [role, backTab, status]);

  // Officer permissions strictly by tab (per product requirement)
  const canApproveReject = role === "officer" && section === "pending";
  const canUpdateStatus = role === "officer" && section === "ongoing";
  const canAddNotes = role === "officer" && (section === "ongoing" || section === "solved");

  // Navigation
  const navigation = useNavigation<any>();
  const goBack = useCallback(() => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      if (role === "officer") {
        router.replace({ pathname: "/incidents/manage-incidents", params: { role, tab: backTab ?? section } });
      } else {
        router.replace({ pathname: "/incidents/my-reports", params: { role } });
      }
    }
  }, [navigation, role, backTab, section]);

  // Actions
  const onApprove = () => {
    if (!canApproveReject) return;
    setStatus("Approved");
    setShowUpdate(false);
    toast.success("Report approved");
  };

  const onReject = () => {
    if (!canApproveReject) return;
    setStatus("Resolved");
    setShowUpdate(false);
    toast.success("Report rejected");
  };

  const addNote = () => {
    if (!canAddNotes) return;
    const text = newNoteDraft.trim();
    if (!text) return;
    const next: Note = {
      id: `note_${Date.now()}`,
      text,
      at: new Date().toLocaleString(),
      by: role === "officer" ? "Officer" : "You",
    };
    setNotes((arr) => [...arr, next]);
    setNewNoteDraft("");
    setNewNoteHeight(undefined);
    setShowNotes(false);
    toast.success(notifyCitizen && role === "officer" ? "Note added and citizen notified" : "Note added");
  };

  // Icons & tones
  const prioPill = (p: Priority) =>
    p === "Urgent"
      ? { wrap: "bg-destructive/10 border-destructive/30", text: "text-destructive", Icon: AlertTriangle }
      : p === "Normal"
      ? { wrap: "bg-ring/10 border-ring/30", text: "text-ring", Icon: Info }
      : { wrap: "bg-primary/10 border-primary/30", text: "text-primary", Icon: CheckCircle2 };

  const statusTone =
    status === "Ongoing"
      ? "text-ring"
      : status === "Resolved"
      ? "text-muted-foreground"
      : status === "In Review"
      ? "text-primary"
      : "text-foreground";

  if (loadError && !report) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <Text className="text-foreground mb-4">Failed to load report.</Text>
        <View className="flex-row items-center gap-2">
          <Button onPress={load} className="h-10 px-3 rounded-lg">
            <Text className="text-primary-foreground">Retry</Text>
          </Button>
          {mockReport ? (
            <Button
              variant="secondary"
              onPress={() => {
                setReport(mockReport);
                setStatus(mockReport.status);
                setPriority(mockReport.priority);
                setNotes(mockReport.notes);
                setLoadError(false);
              }}
              className="h-10 px-3 rounded-lg"
            >
              <Text className="text-foreground">Use mock</Text>
            </Button>
          ) : null}
          <Button variant="secondary" onPress={goBack} className="h-10 px-3 rounded-lg">
            <Text className="text-foreground">Back</Text>
          </Button>
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator color="#0F172A" />
      </View>
    );
  }

  const catIcon = {
    Safety: ShieldAlert,
    Crime: AlertTriangle,
    Maintenance: PackageSearch,
    Other: Info,
  }[report.category];

  const PillIcon = prioPill(priority).Icon;

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
              <ClipboardList size={18} color="#0F172A" />
              <Text className="text-xl font-semibold text-foreground">Incident report</Text>
            </View>

            <View style={{ width: 56 }} />
          </View>

          {/* Details card */}
          <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-4" style={animStyle}>
            {/* Title + status */}
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 pr-1">
                <Text className="text-foreground text-base">{report.title}</Text>
                <View className="flex-row flex-wrap items-center gap-2 mt-1">
                  <View className="flex-row items-center gap-1">
                    <CalendarDays size={14} color="#0F172A" />
                    <Text className="text-xs text-muted-foreground">{report.reportedAt}</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">• By {report.reportedBy}</Text>
                </View>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-foreground/10">
                <Text className={`text-[11px] ${statusTone}`}>Status: {status}</Text>
              </View>
            </View>

            {/* Meta row */}
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
                {catIcon ? createElement(catIcon, { size: 14, color: "#0F172A" }) : <Info size={14} color="#0F172A" />}
                <Text className="text-[12px] text-foreground">{report.category}</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
                <MapPin size={14} color="#0F172A" />
                <Text className="text-[12px] text-foreground">{report.location}</Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full border flex-row items-center gap-1 ${prioPill(priority).wrap}`}>
                <PillIcon size={12} color="#0F172A" />
                <Text className={`text-[11px] font-medium ${prioPill(priority).text}`}>Priority: {priority}</Text>
              </View>
            </View>

            {/* Description */}
            {report.description ? (
              <View className="bg-background rounded-xl border border-border p-3">
                <View className="flex-row items-center gap-2 mb-1">
                  <FileText size={14} color="#0F172A" />
                  <Text className="text-[12px] text-foreground">Description</Text>
                </View>
                <Text className="text-sm text-foreground">{report.description}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Officer actions by SECTION */}
          {/* Pending: Approve/Reject (tab-driven) */}
          {role === "officer" && canApproveReject ? (
            <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-2 mt-4" style={animStyle}>
              <Text className="text-[12px] text-foreground">Decision</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <Button onPress={onApprove} className="flex-1 h-10 rounded-lg">
                  <View className="flex-row items-center justify-center gap-1">
                    <BadgeCheck size={16} color="#FFFFFF" />
                    <Text className="text-primary-foreground text-[13px]">Approve</Text>
                  </View>
                </Button>
                <Button variant="secondary" onPress={onReject} className="flex-1 h-10 rounded-lg">
                  <View className="flex-row items-center justify-center gap-1">
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text className="text-[13px}" style={{ color: "#DC2626" }}>Reject</Text>
                  </View>
                </Button>
              </View>
              <Text className="text-[11px] text-muted-foreground mt-1">
                Approve to proceed; Reject will mark this as resolved (demo).
              </Text>
            </Animated.View>
          ) : null}

          {/* Ongoing: Update Status + Add Notes (tab-driven) */}
          {role === "officer" && canUpdateStatus ? (
            <Animated.View className="bg-muted rounded-2xl border border-border p-4 gap-3 mt-4" style={animStyle}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-foreground">Status</Text>
                <Button variant="secondary" className="h-9 px-3 rounded-lg" onPress={() => setShowUpdate((v) => !v)}>
                  <View className="flex-row items-center gap-1">
                    <ClipboardList size={14} color="#0F172A" />
                    <Text className="text-[12px] text-foreground">{showUpdate ? "Close" : "Update status"}</Text>
                  </View>
                </Button>
              </View>

              {showUpdate ? (
                <View className="bg-muted rounded-xl border border-border p-3">
                  <Text className="text-[12px] text-foreground">Set status</Text>
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {(["Approved", "Assigned", "Ongoing", "Resolved"] as const).map((opt) => {
                      const active = status === opt;
                      return (
                        <Pressable
                          key={opt}
                          onPress={() => setStatus(opt)}
                          className={`px-3 py-1 rounded-full border ${active ? "bg-foreground/10 border-transparent" : "bg-background border-border"}`}
                          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                        >
                          <Text className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{opt}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View className="flex-row items-center justify-end gap-2 mt-3">
                    <Button variant="secondary" className="h-9 px-3 rounded-lg" onPress={() => setShowUpdate(false)}>
                      <Text className="text-foreground text-[12px]">Cancel</Text>
                    </Button>
                    <Button
                      className="h-9 px-3 rounded-lg"
                      onPress={() => {
                        setShowUpdate(false);
                        toast.success("Status updated");
                      }}
                    >
                      <Text className="text-primary-foreground text-[12px]">Save</Text>
                    </Button>
                  </View>
                </View>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Notes (citizen-visible): only render if notes exist or officer can add */}
          {(notes.length > 0 || canAddNotes) ? (
            <Animated.View className="bg-muted rounded-2xl border border-border mt-4 overflow-hidden" style={animStyle}>
              {/* Header */}
              <View className="px-4 py-3 border-b border-border flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <MessageSquare size={16} color="#0F172A" />
                  <Text className="text-[13px] text-foreground">Notes</Text>
                </View>

                {canAddNotes ? (
                  <Button variant="secondary" className="h-9 px-3 rounded-lg" onPress={() => setShowNotes((v) => !v)}>
                    <Text className="text-[12px] text-foreground">{showNotes ? "Close" : "Add note"}</Text>
                  </Button>
                ) : null}
              </View>

              {/* Existing notes */}
              <View className="px-4 py-3">
                {notes.length > 0 ? (
                  notes.slice().reverse().map((n) => (
                    <View key={n.id} className="bg-background rounded-lg border border-border px-3 py-2 mb-2">
                      <Text className="text-[12px] text-foreground">{n.text}</Text>
                      <Text className="text-[10px] text-muted-foreground mt-1">
                        {n.by} · {n.at}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View className="bg-background rounded-lg border border-border px-3 py-2">
                    <Text className="text-[12px] text-muted-foreground">No notes yet.</Text>
                  </View>
                )}
              </View>

              {/* Composer (officer, ongoing/solved only) */}
              {canAddNotes && showNotes ? (
                <>
                  <View className="px-4">
                    <Input
                      value={newNoteDraft}
                      onChangeText={setNewNoteDraft}
                      onContentSizeChange={(e) => setNewNoteHeight(e.nativeEvent.contentSize.height)}
                      placeholder="Add a note for the citizen…"
                      className="bg-background rounded-xl"
                      style={{ minHeight: 96, height: Math.max(96, newNoteHeight ?? 0), textAlignVertical: "top", paddingTop: 12 }}
                      multiline
                      numberOfLines={4}
                      scrollEnabled={false}
                    />
                  </View>

                  <View className="border-t border-border px-4 py-3 bg-muted">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Switch value={notifyCitizen} onValueChange={setNotifyCitizen} />
                        <Text className="text-[12px] text-foreground">Notify citizen</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Button
                          variant="secondary"
                          className="h-9 px-3 rounded-lg"
                          onPress={() => {
                            setShowNotes(false);
                            setNewNoteDraft("");
                            setNewNoteHeight(undefined);
                          }}
                        >
                          <Text className="text-foreground text-[12px]">Cancel</Text>
                        </Button>
                        <Button className="h-9 px-3 rounded-lg" onPress={addNote}>
                          <Text className="text-primary-foreground text-[12px]">Add note</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                </>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Citizen reassurance footer */}
          {role === "citizen" ? (
            <Animated.View className="bg-muted rounded-2xl border border-border p-4 mt-4" style={animStyle}>
              <View className="flex-row items-center gap-2">
                <CheckCircle size={16} color="#0F172A" />
                <Text className="text-[13px] text-foreground">We’ll keep this page updated as report progresses.</Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Resolved banner */}
          {status === "Resolved" ? (
            <Animated.View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mt-4" style={animStyle}>
              <View className="flex-row items-center gap-2">
                <CheckCircle size={18} color="#2563EB" />
                <Text className="text-[13px] text-primary">This report is marked as resolved.</Text>
              </View>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
