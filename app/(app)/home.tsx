// app/home.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  PackageSearch,
  Shield,
  ShieldPlus,
  SunMedium,
  TrendingDown,
  TrendingUp,
  X, // <-- added
} from "lucide-react-native";

type Role = "citizen" | "officer";
type IconType = React.ComponentType<{ size?: number; color?: string }>;
type Tone = "primary" | "ring" | "accent" | "destructive" | "foreground";

/** Tailwind tone → class maps (BG/Text variants and faint BG) */
const TONE_BG: Record<Tone, string> = {
  primary: "bg-primary",
  ring: "bg-ring",
  accent: "bg-accent",
  destructive: "bg-destructive",
  foreground: "bg-foreground",
};
const TONE_TEXT: Record<Tone, string> = {
  primary: "text-primary",
  ring: "text-ring",
  accent: "text-accent",
  destructive: "text-destructive",
  foreground: "text-foreground",
};
const TONE_BG_FAINT: Record<Tone, string> = {
  primary: "bg-primary/10",
  ring: "bg-ring/10",
  accent: "bg-accent/10",
  destructive: "bg-destructive/10",
  foreground: "bg-foreground/10",
};

/**
 * Role-aware dashboard screen.
 * - Renders citizen/officer home with mock data and subtle entrance animations.
 * - Provides quick navigation to incidents flows and common actions.
 * - NOTE: Replace hardcoded “Alex” with profile data when available.
 */
export default function Home() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === "officer" ? "officer" : "citizen";

  // Greeting + date (local)
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Overview + counts (mock)
  const overview = useMemo(() => ({ activeReports: 8, remainingToday: 3, pendingCases: 5 }), []);
  const counts = useMemo(
    () =>
      role === "officer"
        ? { incidents: 12, lostFound: 4, alerts: 3, cases: 6 }
        : { reportIncident: 0, lostFound: 2, myReports: 1, alerts: 3 },
    [role]
  );

  // Lists (mock)
  const citizenAlertsAll = useMemo(
    () => [
      { id: "a1", title: "Road closure at Main St", meta: "Until 6 PM", icon: AlertTriangle, tone: "destructive" as Tone, category: "Road" },
      { id: "a2", title: "Weather advisory: heavy rain", meta: "Today", icon: BellRing, tone: "primary" as Tone, category: "Weather" },
      { id: "a3", title: "Power maintenance: Sector 12", meta: "Tomorrow", icon: Megaphone, tone: "accent" as Tone, category: "Maintenance" },
    ],
    []
  );
  const citizenRecentAll = useMemo(
    () => [
      { id: "r1", title: "Reported: Streetlight outage", meta: "2h ago · #1245", icon: FileText, tone: "primary" as Tone },
      { id: "r2", title: "Found item: Wallet", meta: "Yesterday", icon: PackageSearch, tone: "accent" as Tone },
      { id: "r3", title: "Alert viewed: Rain advisory", meta: "Yesterday", icon: BellRing, tone: "ring" as Tone },
    ],
    []
  );
  const officerQueueAll = useMemo(
    () => [
      { id: "q1", title: "Overdue: Traffic accident", meta: "High · 1h", icon: AlertTriangle, tone: "destructive" as Tone, category: "Overdue" },
      { id: "q2", title: "New: Vandalism report", meta: "Medium · 10m", icon: FileText, tone: "primary" as Tone, category: "New" },
      { id: "q3", title: "Lost item: Phone", meta: "Low · 5m", icon: PackageSearch, tone: "accent" as Tone, category: "Lost" },
    ],
    []
  );
  const officerNewsAll = useMemo(
    () => [
      { id: "n1", title: "Internal memo: parade route", meta: "Read before Friday", icon: Megaphone, tone: "accent" as Tone },
      { id: "n2", title: "System maintenance window", meta: "Saturday 1–3 AM", icon: Clock, tone: "ring" as Tone },
    ],
    []
  );

  // Filters (chips)
  const [alertFilter, setAlertFilter] = useState<"All" | "Road" | "Weather" | "Maintenance">("All");
  const [queueFilter, setQueueFilter] = useState<"All" | "Overdue" | "New" | "Lost">("All");

  const citizenAlerts = useMemo(
    () => (alertFilter === "All" ? citizenAlertsAll : citizenAlertsAll.filter((i) => i.category === alertFilter)),
    [alertFilter, citizenAlertsAll]
  );
  const officerQueue = useMemo(
    () => (queueFilter === "All" ? officerQueueAll : officerQueueAll.filter((i) => i.category === queueFilter)),
    [queueFilter, officerQueueAll]
  );
  const citizenRecent = citizenRecentAll;

  // Conditional alert banner
  const showBanner =
    role === "officer"
      ? officerQueueAll.some((i) => i.tone === "destructive")
      : citizenAlertsAll.some((i) => i.tone === "destructive");

  // Chatbot (citizen only)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // Pull-to-refresh (mock)
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const onSignOut = () => router.replace("/login");

  // KPI trends (mock)
  const trends = {
    activeReports: { dir: "up" as const, pct: 12, tone: "ring" as Tone },
    remainingToday: { dir: "down" as const, pct: 5, tone: "primary" as Tone, progress: 70 },
    pendingCases: { dir: "up" as const, pct: 3, tone: "destructive" as Tone },
  };

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0.9)).current;
  const sectionAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.9))).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      90,
      sectionAnims.map((a) =>
        Animated.spring(a, {
          toValue: 1,
          damping: 14,
          stiffness: 160,
          mass: 0.6,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [headerAnim, sectionAnims]);

  const animStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] }),
    transform: [{ translateY: v.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] }) }],
  });

  // Navigation helpers (use the /incidents index redirector everywhere)
  const goIncidents = () => router.push({ pathname: "/incidents", params: { role } });
  const goMyReports = () => router.push({ pathname: "/(app)/incidents/my-reports", params: { role } });

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: role === "citizen" ? 160 : 48,
            flexGrow: 1,
            backgroundColor: "#FFFFFF",
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-between gap-6">
            {/* Header + hero */}
            <Animated.View style={animStyle(headerAnim)}>
              <View className="pt-10">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <LayoutDashboard size={26} color="#0F172A" />
                    <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
                  </View>
                  <View className="rounded-full px-3 py-1 bg-primary/10">
                    <Text className="text-xs capitalize text-primary">{role}</Text>
                  </View>
                </View>

                {showBanner ? (
                  <View className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 flex-row items-center gap-2">
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text className="text-[13px] text-destructive">
                      There are high-priority alerts that may require your attention.
                    </Text>
                  </View>
                ) : null}

                <View className="bg-primary/5 border border-border rounded-2xl px-4 py-3 mt-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base text-foreground">
                        {greeting}, <Text className="font-semibold">Alex</Text>
                      </Text>
                      <View className="flex-row items-center gap-2 mt-0.5">
                        <CalendarDays size={14} color="#0F172A" />
                        <Text className="text-xs text-muted-foreground">{dateStr}</Text>
                      </View>
                    </View>
                    <View className="w-9 h-9 rounded-full items-center justify-center bg-accent/20">
                      <SunMedium size={18} color="#0F172A" />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Main sections */}
            <View className="gap-6">
              {role === "officer" ? (
                <>
                  <Animated.View style={animStyle(sectionAnims[0])}>
                    <Card>
                      <CardHeader title="Overview" tone="ring" />
                      <View className="flex-row gap-3 mt-3">
                        <Kpi label="Active reports" value={overview.activeReports} tone="primary" trend={trends.activeReports} />
                        <Kpi label="Remaining today" value={overview.remainingToday} tone="ring" trend={trends.remainingToday} />
                        <Kpi label="Pending cases" value={overview.pendingCases} tone="destructive" trend={trends.pendingCases} />
                      </View>
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[1])}>
                    <Card>
                      <CardHeader title="Manage" tone="primary" />
                      <TileGrid
                        tiles={[
                          { label: "Manage incidents", icon: Shield, onPress: goIncidents, count: counts.incidents },
                          { label: "Lost & found", icon: PackageSearch, onPress: () => {}, variant: "secondary", count: counts.lostFound },
                          { label: "Safety alerts", icon: BellRing, onPress: () => {}, count: counts.alerts },
                          { label: "Case overview", icon: ClipboardList, onPress: () => {}, variant: "secondary", count: counts.cases },
                        ]}
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[2])}>
                    <Card>
                      <CardHeader title="Incoming queue" tone="accent" actionLabel="See all" onAction={goIncidents} />
                      <FilterChips
                        options={["All", "Overdue", "New", "Lost"]}
                        active={queueFilter}
                        onChange={setQueueFilter}
                        tone="accent"
                        className="mt-3"
                      />
                      <List
                        items={officerQueue}
                        className="mt-2"
                        emptyTitle="No items in the queue"
                        emptySubtitle="You’re all caught up. New reports will appear here."
                        emptyIcon={Inbox}
                        emptyTone="ring"
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[3])}>
                    <Card>
                      <CardHeader title="Announcements" tone="ring" actionLabel="View" onAction={() => {}} />
                      <List
                        items={officerNewsAll}
                        className="mt-2"
                        emptyTitle="No announcements"
                        emptySubtitle="When there’s something new, it’ll show up here."
                        emptyIcon={Inbox}
                        emptyTone="accent"
                      />
                    </Card>
                  </Animated.View>
                </>
              ) : (
                <>
                  <Animated.View style={animStyle(sectionAnims[0])}>
                    <Card>
                      <CardHeader title="Quick actions" tone="primary" />
                      <TileGrid
                        tiles={[
                          { label: "Report incident", icon: ShieldPlus, onPress: goIncidents },
                          { label: "Lost & found", icon: PackageSearch, onPress: () => {}, variant: "secondary", count: counts.lostFound },
                          { label: "My reports", icon: ClipboardList, onPress: goMyReports, count: counts.myReports },
                          { label: "Safety alerts", icon: BellRing, onPress: () => {}, variant: "secondary", count: counts.alerts },
                        ]}
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[1])}>
                    <Card>
                      <CardHeader title="Safety alerts (near you)" tone="destructive" actionLabel="See all" onAction={() => {}} />
                      <FilterChips
                        options={["All", "Road", "Weather", "Maintenance"]}
                        active={alertFilter}
                        onChange={setAlertFilter}
                        tone="destructive"
                        className="mt-3"
                      />
                      <List
                        items={citizenAlerts}
                        className="mt-2"
                        emptyTitle="No nearby alerts"
                        emptySubtitle="Great news — nothing urgent in your area."
                        emptyIcon={Inbox}
                        emptyTone="primary"
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[2])}>
                    <Card>
                      <CardHeader title="Recent activity" tone="ring" actionLabel="View all" onAction={() => {}} />
                      <Timeline
                        items={citizenRecent}
                        className="mt-3"
                        emptyTitle="No recent activity"
                        emptySubtitle="Your actions and updates will appear here."
                        emptyIcon={Inbox}
                        emptyTone="ring"
                      />
                    </Card>
                  </Animated.View>
                </>
              )}
            </View>

            <View>
              <Button onPress={onSignOut} size="lg" className="h-12 rounded-xl">
                <Text className="font-semibold text-primary-foreground">Sign out</Text>
              </Button>
            </View>
          </View>
        </ScrollView>

        {role === "citizen" ? (
          <ChatbotWidget
            open={chatOpen}
            onToggle={() => setChatOpen((v) => !v)}
            message={chatMessage}
            setMessage={setChatMessage}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Return a local greeting for the given hour.
 * @param hour - 0–23 hour in local time.
 */
function getGreeting(hour: number): "Good morning" | "Good afternoon" | "Good evening" {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* -------------------- UI Partials -------------------- */

/** Card container with standard padding, border, and rounded corners. */
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View className="bg-muted rounded-2xl border border-border p-5">{children}</View>
);

/**
 * Section header with title, optional action, and tone bar.
 */
const CardHeader: React.FC<{
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
}> = ({ title, actionLabel, onAction, tone = "foreground" }) => (
  <View>
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} className="flex-row items-center gap-1" android_ripple={{ color: "rgba(0,0,0,0.06)" }}>
          <Text className="text-primary">{actionLabel}</Text>
          <ChevronRight size={14} color="#2563EB" />
        </Pressable>
      ) : null}
    </View>
    <View className={`h-1 rounded-full mt-2 w-16 ${TONE_BG[tone]}`} />
  </View>
);

/** Compact trend chip (up/down + %). */
const TrendChip: React.FC<{ dir: "up" | "down"; pct: number; tone: Tone }> = ({ dir, pct, tone }) => (
  <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${TONE_BG_FAINT[tone]}`}>
    {dir === "up" ? <TrendingUp size={12} color="#0F172A" /> : <TrendingDown size={12} color="#0F172A" />}
    <Text className={`text-[11px] ${TONE_TEXT[tone]}`}>{dir === "up" ? "+" : "-"}{pct}%</Text>
  </View>
);

/** KPI block with optional trend and progress bar. */
const Kpi: React.FC<{
  label: string;
  value: number | string;
  tone?: Tone;
  trend?: { dir: "up" | "down"; pct: number; tone: Tone; progress?: number };
}> = ({ label, value, tone = "foreground", trend }) => (
  <View className="flex-1 bg-background rounded-xl border border-border p-4 overflow-hidden">
    <View className={`h-1.5 rounded-full mb-2 ${TONE_BG[tone]}`} />
    <View className="flex-row items-end justify-between">
      <Text className="text-3xl font-bold text-foreground">{String(value)}</Text>
      {trend ? <TrendChip dir={trend.dir} pct={trend.pct} tone={trend.tone} /> : null}
    </View>
    <Text className="text-xs text-muted-foreground mt-0.5">{label}</Text>
    {trend?.progress != null ? (
      <View className="mt-2">
        <View className="h-2 rounded-full bg-primary/10 overflow-hidden">
          <View style={{ width: `${Math.max(0, Math.min(100, trend.progress))}%` }} className="h-2 rounded-full bg-primary" />
        </View>
        <Text className="text-[11px] text-muted-foreground mt-1">{trend.progress}% complete</Text>
      </View>
    ) : null}
  </View>
);

type Tile = {
  label: string;
  icon: IconType;
  onPress?: () => void;
  variant?: "default" | "secondary";
  count?: number;
};

/** Responsive 2-column grid of action tiles. */
const TileGrid: React.FC<{ tiles: Tile[] }> = ({ tiles }) => (
  <View className="flex-row flex-wrap -mx-1 mt-3">
    {tiles.map((t, i) => (
      <View key={i} className="basis-1/2 px-1 mb-2">
        <IconTileButton {...t} />
      </View>
    ))}
  </View>
);

/** Action tile button with optional count badge. */
const IconTileButton: React.FC<Tile> = ({ label, icon: IconCmp, onPress, variant = "default", count }) => {
  const isSecondary = variant === "secondary";
  const iconColor = isSecondary ? "#0F172A" : "#FFFFFF";

  return (
    <Button
      onPress={onPress}
      variant={isSecondary ? "secondary" : "default"}
      className="h-28 rounded-2xl items-center justify-center px-3 relative active:opacity-90 active:scale-95"
    >
      {typeof count === "number" && count > 0 ? (
        <View className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5">
          <Text className="text-[11px] text-primary-foreground">{count}</Text>
        </View>
      ) : null}
      <View className="items-center justify-center gap-2">
        <IconCmp size={30} color={iconColor} />
        <Text
          numberOfLines={2}
          className={(isSecondary ? "text-foreground " : "text-primary-foreground ") + "text-center leading-tight text-[14px]"}
        >
          {label}
        </Text>
      </View>
    </Button>
  );
};

type ListItem = { id: string; title: string; meta?: string; icon: IconType; tone: Tone; category?: string };

/** Empty state block used by list/timeline components. */
const EmptyState: React.FC<{
  title: string;
  subtitle?: string;
  icon?: IconType;
  tone?: Tone;
}> = ({ title, subtitle, icon: IconCmp = Inbox, tone = "ring" }) => (
  <View className="items-center justify-center py-8">
    <View className={`w-14 h-14 rounded-full items-center justify-center ${TONE_BG_FAINT[tone]}`}>
      <IconCmp size={28} color="#0F172A" />
    </View>
    <Text className="mt-3 text-foreground font-semibold">{title}</Text>
    {subtitle ? <Text className="text-xs text-muted-foreground mt-1 text-center">{subtitle}</Text> : null}
  </View>
);

/** Generic list with icon, title, and meta; shows empty state when needed. */
const List: React.FC<{
  items: ListItem[];
  className?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: IconType;
  emptyTone?: Tone;
}> = ({ items, className, emptyTitle = "Nothing yet.", emptySubtitle, emptyIcon, emptyTone = "ring" }) => {
  if (!items || items.length === 0) {
    return (
      <View className={`bg-background rounded-xl border border-border mt-3 ${className ?? ""}`}>
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} tone={emptyTone} />
      </View>
    );
  }
  return (
    <View className={`mt-3 ${className ?? ""}`}>
      {items.map((it) => (
        <View
          key={it.id}
          className="flex-row items-center justify-between bg-background rounded-xl border border-border px-3 py-3 mb-2"
        >
          <View className="flex-row items-center gap-3 flex-1">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${TONE_BG_FAINT[it.tone]}`}>
              <it.icon size={18} color="#0F172A" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground">{it.title}</Text>
              {it.meta ? <Text className={`text-xs mt-0.5 ${TONE_TEXT[it.tone]}`}>{it.meta}</Text> : null}
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </View>
      ))}
    </View>
  );
};

/** Filter chip row. */
const FilterChips: React.FC<{
  options: string[];
  active: string;
  onChange: (v: any) => void;
  tone?: Tone;
  className?: string;
}> = ({ options, active, onChange, tone = "primary", className }) => (
  <View className={`flex-row flex-wrap gap-2 ${className ?? ""}`}>
    {options.map((opt) => {
      const isActive = opt === active;
      return (
        <Pressable
          key={opt}
          onPress={() => onChange(opt as any)}
          className={`px-3 py-1 rounded-full border ${
            isActive ? `${TONE_BG_FAINT[tone]} border-transparent` : "bg-background border-border"
          }`}
          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        >
          <Text className={`text-xs ${isActive ? TONE_TEXT[tone] : "text-muted-foreground"}`}>{opt}</Text>
        </Pressable>
      );
    })}
  </View>
);

/** Vertical timeline with bullets and a guiding line; includes empty state. */
const Timeline: React.FC<{
  items: ListItem[];
  className?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: IconType;
  emptyTone?: Tone;
}> = ({ items, className, emptyTitle = "No recent activity", emptySubtitle, emptyIcon, emptyTone = "ring" }) => {
  if (!items || items.length === 0) {
    return (
      <View className={`bg-background rounded-2xl border border-border mt-3 ${className ?? ""}`}>
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} tone={emptyTone} />
      </View>
    );
  }

  return (
    <View className={`mt-3 ${className ?? ""}`}>
      <View className="relative pl-6">
        <View className="absolute left-3 top-0 bottom-0 w-0.5 bg-ring/30" />
        {items.map((it) => (
          <View key={it.id} className="mb-4">
            <View className={`absolute left-2.5 top-1 w-3 h-3 rounded-full ${TONE_BG[it.tone]}`} />
            <View className="bg-background rounded-xl border border-border px-3 py-2">
              <View className="flex-row items-center gap-2">
                <it.icon size={16} color="#0F172A" />
                <Text className="text-foreground">{it.title}</Text>
              </View>
              {it.meta ? <Text className={`text-xs mt-0.5 ${TONE_TEXT[it.tone]}`}>{it.meta}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/** Floating chatbot widget (citizen only). */
const ChatbotWidget: React.FC<{
  open: boolean;
  onToggle: () => void;
  message: string;
  setMessage: (v: string) => void;
}> = ({ open, onToggle, message, setMessage }) => {
  if (!open) {
    return (
      <View className="absolute right-4 bottom-6">
        <Button onPress={onToggle} size="lg" className="rounded-full h-14 w-14 p-0 items-center justify-center">
          <MessageSquare size={24} color="#FFFFFF" />
        </Button>
      </View>
    );
  }

  return (
    <View className="absolute right-4 bottom-6 w-11/12 max-w-[360px]">
      <View className="bg-background rounded-2xl border border-border shadow-lg overflow-hidden">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View className="flex-row items-center gap-2">
            <MessageSquare size={22} color="#0F172A" />
            <Text className="font-semibold text-foreground">Chatbot</Text>
          </View>

          {/* Close button */}
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel="Close chat"
            className="w-9 h-9 items-center justify-center rounded-full bg-muted"
            android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}
          >
            <X size={18} color="#0F172A" />
          </Pressable>
        </View>

        <View className="p-4">
          <View className="bg-muted rounded-xl border border-border p-3">
            <Text className="text-sm text-muted-foreground">
              Hi! I can help with incidents, lost &amp; found, and safety alerts. Ask me anything.
            </Text>
          </View>

          <View className="flex-row items-center gap-2 mt-3">
            <Label nativeID="chatInput" className="hidden">
              <Text>Message</Text>
            </Label>
            <Input
              aria-labelledby="chatInput"
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message…"
              className="flex-1 bg-background h-12 rounded-xl"
              returnKeyType="send"
              onSubmitEditing={() => setMessage("")}
            />
            <Button onPress={() => setMessage("")} className="h-12 px-4 rounded-xl">
              <Text className="text-primary-foreground">Send</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};
