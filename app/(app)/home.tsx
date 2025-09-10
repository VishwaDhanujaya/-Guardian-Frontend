// app/home.tsx
import { router, useLocalSearchParams } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FC,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';

import { toast } from '@/components/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { fetchProfile } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
  X,
} from 'lucide-react-native';

type Role = 'citizen' | 'officer';
type IconType = ComponentType<{ size?: number; color?: string }>;
type Tone = 'primary' | 'ring' | 'accent' | 'destructive' | 'foreground';

/** Tailwind tone → class maps (BG/Text variants and faint BG) */
const TONE_BG: Record<Tone, string> = {
  primary: 'bg-primary',
  ring: 'bg-ring',
  accent: 'bg-accent',
  destructive: 'bg-destructive',
  foreground: 'bg-foreground',
};
const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  ring: 'text-ring',
  accent: 'text-accent',
  destructive: 'text-destructive',
  foreground: 'text-foreground',
};
const TONE_BG_FAINT: Record<Tone, string> = {
  primary: 'bg-primary/10',
  ring: 'bg-ring/10',
  accent: 'bg-accent/10',
  destructive: 'bg-destructive/10',
  foreground: 'bg-foreground/10',
};

/**
 * Role-aware dashboard screen.
 * - Renders citizen/officer home with mock data and subtle entrance animations.
 * - Provides quick navigation to incidents flows and common actions.
 * - NOTE: Replace hardcoded “Alex” with profile data when available.
 */
export default function Home() {
  const params = useLocalSearchParams<{ role?: string }>();
  const role: Role = params.role === 'officer' ? 'officer' : 'citizen';

  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Greeting + date (local)
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Overview (mock) — ONLY pending + ongoing
  const overview = useMemo(() => ({ pendingReports: 5, ongoingReports: 7 }), []);
  const counts = useMemo(
    () =>
      role === 'officer'
        ? { incidents: 12, lostFound: 4, alerts: 3 }
        : { reportIncident: 0, lostFound: 2, myReports: 1, alerts: 3 },
    [role]
  );

  // Lists (mock)
  const citizenAlertsAll = useMemo(
    () => [
      // Categories removed – alerts now display without grouping
      {
        id: 'a1',
        title: 'Road closure at Main St',
        meta: 'Until 6 PM',
        icon: AlertTriangle,
        tone: 'destructive' as Tone,
      },
      {
        id: 'a2',
        title: 'Weather advisory: heavy rain',
        meta: 'Today',
        icon: BellRing,
        tone: 'primary' as Tone,
      },
      {
        id: 'a3',
        title: 'Power maintenance: Sector 12',
        meta: 'Tomorrow',
        icon: Megaphone,
        tone: 'accent' as Tone,
      },
    ],
    []
  );
  const citizenRecentAll = useMemo(
    () => [
      {
        id: 'r1',
        title: 'Reported: Streetlight outage',
        meta: '2h ago · #1245',
        icon: FileText,
        tone: 'primary' as Tone,
      },
      {
        id: 'r2',
        title: 'Found item: Wallet',
        meta: 'Yesterday',
        icon: PackageSearch,
        tone: 'accent' as Tone,
      },
      {
        id: 'r3',
        title: 'Alert viewed: Rain advisory',
        meta: 'Yesterday',
        icon: BellRing,
        tone: 'ring' as Tone,
      },
    ],
    []
  );

  // OFFICER: Incoming queue (PENDING INCIDENTS ONLY, routes to Manage Incidents → Pending)
  const officerQueue = useMemo(
    () => [
      {
        id: 'q1',
        title: 'Overdue: Traffic accident',
        meta: 'High · 1h',
        icon: AlertTriangle,
        tone: 'destructive' as Tone,
      },
      {
        id: 'q2',
        title: 'New: Vandalism report',
        meta: 'Medium · 10m',
        icon: FileText,
        tone: 'primary' as Tone,
      },
      {
        id: 'q3',
        title: 'New: Suspicious activity',
        meta: 'Medium · 5m',
        icon: ClipboardList,
        tone: 'ring' as Tone,
      },
    ],
    []
  );

  // OFFICER: manage safety alerts preview
  const safetyAlertsPreviewAll = useMemo(
    () => [
      {
        id: 's1',
        title: 'Draft alert: Parade route',
        meta: 'Needs review',
        icon: Megaphone,
        tone: 'accent' as Tone,
      },
      {
        id: 's2',
        title: 'Scheduled: System maintenance',
        meta: 'Sat 1–3 AM',
        icon: Clock,
        tone: 'ring' as Tone,
      },
    ],
    []
  );

  // Citizen alert lists (no category filtering)
  const citizenAlerts = citizenAlertsAll;
  const citizenRecent = citizenRecentAll;

  // Conditional alert banner
  const showBanner =
    role === 'officer'
      ? officerQueue.some((i) => i.tone === 'destructive')
      : citizenAlertsAll.some((i) => i.tone === 'destructive');

  // Chatbot (citizen only)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Pull-to-refresh (mock)
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const onSignOut = () => router.replace('/login');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('authToken').then((token: string | null) => {
      fetchProfile(token ?? '', role)
        .then((data) => {
          if (mounted) setProfile(data);
        })
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => {
          if (mounted) setProfileLoading(false);
        });
    });
    return () => {
      mounted = false;
    };
  }, [role]);

  // KPI trends (optional visuals kept, values illustrative)
  const trends = {
    pendingReports: { dir: 'up' as const, pct: 4, tone: 'primary' as Tone },
    ongoingReports: { dir: 'up' as const, pct: 11, tone: 'ring' as Tone },
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

  // Navigation helpers
  const goIncidentsIndex = () => router.push({ pathname: '/incidents', params: { role } }); // Citizen: report flow index
  const goManageIncidentsPending = () =>
    router.push({ pathname: '/incidents/manage-incidents', params: { role, tab: 'pending' } }); // Officer: land on Pending

  // Lost & Found routes
  const goLostFoundCitizen = () =>
    router.push({ pathname: '/lost-found/citizen', params: { role, tab: 'found' } });

  const goOfficerLostPending = () =>
    router.push({ pathname: '/lost-found/officer-lost', params: { role, tab: 'pending' } });

  const goOfficerFound = () =>
    router.push({ pathname: '/lost-found/officer-found', params: { role } });

  // Safety alerts routes
  const goCitizenAlerts = () => router.push({ pathname: '/alerts/citizen', params: { role } });

  const goManageAlerts = () => router.push({ pathname: '/alerts/manage', params: { role } });

  const goMyReports = () => router.push({ pathname: '/incidents/my-reports', params: { role } });

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: role === 'citizen' ? 160 : 48,
            flexGrow: 1,
            backgroundColor: '#FFFFFF',
          }}
          keyboardShouldPersistTaps="handled">
          <View className="flex-1 justify-between gap-6">
            {/* Header + hero */}
            <Animated.View style={animStyle(headerAnim)}>
              <View className="pt-10">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <LayoutDashboard size={26} color="#0F172A" />
                    <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
                  </View>
                  <View className="rounded-full bg-primary/10 px-3 py-1">
                    <Text className="text-xs capitalize text-primary">{role}</Text>
                  </View>
                </View>

                {showBanner ? (
                  <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2">
                    <AlertTriangle size={16} color="#DC2626" />
                    <Text className="text-[13px] text-destructive">
                      Is it an emergency? Call 119 in emergency situations
                    </Text>
                  </View>
                ) : null}

                <View className="mt-3 rounded-2xl border border-border bg-primary/5 px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base text-foreground">
                        {greeting},{' '}
                        {profileLoading ? (
                          <ActivityIndicator size="small" color="#0F172A" />
                        ) : (
                          <Text className="font-semibold">{profile?.name ?? 'User'}</Text>
                        )}
                      </Text>
                      <View className="mt-0.5 flex-row items-center gap-2">
                        <CalendarDays size={14} color="#0F172A" />
                        <Text className="text-xs text-muted-foreground">{dateStr}</Text>
                      </View>
                    </View>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/20">
                      <SunMedium size={18} color="#0F172A" />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Main sections */}
            <View className="gap-6">
              {role === 'officer' ? (
                <>
                  <Animated.View style={animStyle(sectionAnims[0])}>
                    <Card>
                      <CardHeader title="Overview" tone="ring" />
                      <View className="mt-3 flex-row gap-3">
                        <Kpi
                          label="Pending reports"
                          value={overview.pendingReports}
                          tone="primary"
                          trend={trends.pendingReports}
                        />
                        <Kpi
                          label="Ongoing reports"
                          value={overview.ongoingReports}
                          tone="ring"
                          trend={trends.ongoingReports}
                        />
                      </View>
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[1])}>
                    <Card>
                      <CardHeader title="Manage" tone="primary" />
                      {/* Order controls left/right columns:
                          0 (left), 1 (right), 2 (left), 3 (right) */}
                      <TileGrid
                        tiles={[
                          {
                            label: 'Manage incidents',
                            icon: Shield,
                            onPress: goManageIncidentsPending,
                            count: counts.incidents,
                          }, // left row 1
                          {
                            label: 'Lost items',
                            icon: PackageSearch,
                            onPress: goOfficerLostPending,
                            variant: 'secondary',
                            count: counts.lostFound,
                          }, // right row 1
                          {
                            label: 'Safety alerts',
                            icon: BellRing,
                            onPress: goManageAlerts,
                            count: counts.alerts,
                          }, // left row 2
                          {
                            label: 'Found items',
                            icon: PackageSearch,
                            onPress: goOfficerFound,
                            variant: 'secondary',
                          }, // right row 2
                        ]}
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[2])}>
                    <Card>
                      <CardHeader
                        title="Incoming queue"
                        tone="accent"
                        actionLabel="See all"
                        onAction={goManageIncidentsPending}
                      />
                      <List
                        items={officerQueue}
                        className="mt-2"
                        emptyTitle="No items in the queue"
                        emptySubtitle="You’re all caught up. New reports will appear here."
                        emptyIcon={Inbox}
                        emptyTone="ring"
                        onItemPress={goManageIncidentsPending}
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[3])}>
                    <Card>
                      <CardHeader
                        title="Manage safety alerts"
                        tone="ring"
                        actionLabel="Manage"
                        onAction={goManageAlerts}
                      />
                      <List
                        items={safetyAlertsPreviewAll}
                        className="mt-2"
                        emptyTitle="No safety alerts"
                        emptySubtitle="When there’s something new, it’ll show up here."
                        emptyIcon={Inbox}
                        emptyTone="accent"
                        onItemPress={goManageAlerts}
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
                          { label: 'Report incident', icon: ShieldPlus, onPress: goIncidentsIndex },
                          {
                            label: 'Lost & found',
                            icon: PackageSearch,
                            onPress: goLostFoundCitizen,
                            variant: 'secondary',
                            count: counts.lostFound,
                          },
                          {
                            label: 'My reports',
                            icon: ClipboardList,
                            onPress: goMyReports,
                            count: 1,
                          },
                          {
                            label: 'Safety alerts',
                            icon: BellRing,
                            onPress: goCitizenAlerts,
                            variant: 'secondary',
                            count: counts.alerts,
                          },
                        ]}
                      />
                    </Card>
                  </Animated.View>

                  <Animated.View style={animStyle(sectionAnims[1])}>
                    <Card>
                      <CardHeader
                        title="Safety alerts"
                        tone="destructive"
                        actionLabel="See all"
                        onAction={goCitizenAlerts}
                      />
                      {/* Categories removed from preview for a cleaner lis */}
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
                      <CardHeader
                        title="Recent activity"
                        tone="ring"
                        actionLabel="View all"
                        onAction={() => {}}
                      />
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

        {role === 'citizen' ? (
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
function getGreeting(hour: number): 'Good morning' | 'Good afternoon' | 'Good evening' {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/* -------------------- UI Partials -------------------- */

/** Card container with standard padding, border, and rounded corners. */
const Card: FC<{ children: ReactNode }> = ({ children }) => (
  <View className="rounded-2xl border border-border bg-muted p-5">{children}</View>
);

/**
 * Section header with title, optional action, and tone bar.
 */
const CardHeader: FC<{
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
}> = ({ title, actionLabel, onAction, tone = 'foreground' }) => (
  <View>
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          className="flex-row items-center gap-1"
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
          <Text className="text-primary">{actionLabel}</Text>
          <ChevronRight size={14} color="#2563EB" />
        </Pressable>
      ) : null}
    </View>
    <View className={`mt-2 h-1 w-16 rounded-full ${TONE_BG[tone]}`} />
  </View>
);

/** Compact trend chip (up/down + %). */
const TrendChip: FC<{ dir: 'up' | 'down'; pct: number; tone: Tone }> = ({
  dir,
  pct,
  tone,
}) => (
  <View className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${TONE_BG_FAINT[tone]}`}>
    {dir === 'up' ? (
      <TrendingUp size={12} color="#0F172A" />
    ) : (
      <TrendingDown size={12} color="#0F172A" />
    )}
    <Text className={`text-[11px] ${TONE_TEXT[tone]}`}>
      {dir === 'up' ? '+' : '-'}
      {pct}%
    </Text>
  </View>
);

/** KPI block with optional trend and progress bar. */
const Kpi: FC<{
  label: string;
  value: number | string;
  tone?: Tone;
  trend?: { dir: 'up' | 'down'; pct: number; tone: Tone; progress?: number };
}> = ({ label, value, tone = 'foreground', trend }) => (
  <View className="flex-1 overflow-hidden rounded-xl border border-border bg-background p-4">
    <View className={`mb-2 h-1.5 rounded-full ${TONE_BG[tone]}`} />
    <View className="flex-row items-end justify-between">
      <Text className="text-3xl font-bold text-foreground">{String(value)}</Text>
      {trend ? <TrendChip dir={trend.dir} pct={trend.pct} tone={trend.tone} /> : null}
    </View>
    <Text className="mt-0.5 text-xs text-muted-foreground">{label}</Text>
    {trend?.progress != null ? (
      <View className="mt-2">
        <View className="h-2 overflow-hidden rounded-full bg-primary/10">
          <View
            style={{ width: `${Math.max(0, Math.min(100, trend.progress))}%` }}
            className="h-2 rounded-full bg-primary"
          />
        </View>
        <Text className="mt-1 text-[11px] text-muted-foreground">{trend.progress}% complete</Text>
      </View>
    ) : null}
  </View>
);

type Tile = {
  label: string;
  icon: IconType;
  onPress?: () => void;
  variant?: 'default' | 'secondary';
  count?: number;
};

/** Responsive 2-column grid of action tiles. */
const TileGrid: FC<{ tiles: Tile[] }> = ({ tiles }) => (
  <View className="-mx-1 mt-3 flex-row flex-wrap">
    {tiles.map((t, i) => (
      <View key={i} className="mb-2 basis-1/2 px-1">
        <IconTileButton {...t} />
      </View>
    ))}
  </View>
);

/** Action tile button with optional count badge. */
const IconTileButton: FC<Tile> = ({
  label,
  icon: IconCmp,
  onPress,
  variant = 'default',
  count,
}) => {
  const isSecondary = variant === 'secondary';
  const iconColor = isSecondary ? '#0F172A' : '#FFFFFF';

  return (
    <Button
      onPress={onPress}
      variant={isSecondary ? 'secondary' : 'default'}
      className="relative h-28 items-center justify-center rounded-2xl px-3 active:scale-95 active:opacity-90">
      {typeof count === 'number' && count > 0 ? (
        <View className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5">
          <Text className="text-[11px] text-primary-foreground">{count}</Text>
        </View>
      ) : null}
      <View className="items-center justify-center gap-2">
        <IconCmp size={30} color={iconColor} />
        <Text
          numberOfLines={2}
          className={
            (isSecondary ? 'text-foreground ' : 'text-primary-foreground ') +
            'text-center text-[14px] leading-tight'
          }>
          {label}
        </Text>
      </View>
    </Button>
  );
};

type ListItem = {
  id: string;
  title: string;
  meta?: string;
  icon: IconType;
  tone: Tone;
  category?: string;
};

/** Empty state block used by list/timeline components. */
const EmptyState: FC<{
  title: string;
  subtitle?: string;
  icon?: IconType;
  tone?: Tone;
}> = ({ title, subtitle, icon: IconCmp = Inbox, tone = 'ring' }) => (
  <View className="items-center justify-center py-8">
    <View className={`h-14 w-14 items-center justify-center rounded-full ${TONE_BG_FAINT[tone]}`}>
      <IconCmp size={28} color="#0F172A" />
    </View>
    <Text className="mt-3 font-semibold text-foreground">{title}</Text>
    {subtitle ? (
      <Text className="mt-1 text-center text-xs text-muted-foreground">{subtitle}</Text>
    ) : null}
  </View>
);

/** Generic list with icon, title, and meta; shows empty state when needed, supports onPress per row. */
const List: FC<{
  items: ListItem[];
  className?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: IconType;
  emptyTone?: Tone;
  onItemPress?: (item: ListItem) => void;
}> = ({
  items,
  className,
  emptyTitle = 'Nothing yet.',
  emptySubtitle,
  emptyIcon,
  emptyTone = 'ring',
  onItemPress,
}) => {
  if (!items || items.length === 0) {
    return (
      <View className={`mt-3 rounded-xl border border-border bg-background ${className ?? ''}`}>
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} tone={emptyTone} />
      </View>
    );
  }
  return (
    <View className={`mt-3 ${className ?? ''}`}>
      {items.map((it) => {
        const Row = (
          <View className="mb-2 flex-row items-center justify-between rounded-xl border border-border bg-background px-3 py-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${TONE_BG_FAINT[it.tone]}`}>
                <it.icon size={18} color="#0F172A" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground">{it.title}</Text>
                {it.meta ? (
                  <Text className={`mt-0.5 text-xs ${TONE_TEXT[it.tone]}`}>{it.meta}</Text>
                ) : null}
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </View>
        );
        return onItemPress ? (
          <Pressable
            key={it.id}
            onPress={() => onItemPress(it)}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
            {Row}
          </Pressable>
        ) : (
          <View key={it.id}>{Row}</View>
        );
      })}
    </View>
  );
};

/** Vertical timeline with bullets and a guiding line; includes empty state. */
const Timeline: FC<{
  items: ListItem[];
  className?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: IconType;
  emptyTone?: Tone;
}> = ({
  items,
  className,
  emptyTitle = 'No recent activity',
  emptySubtitle,
  emptyIcon,
  emptyTone = 'ring',
}) => {
  if (!items || items.length === 0) {
    return (
      <View className={`mt-3 rounded-2xl border border-border bg-background ${className ?? ''}`}>
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} tone={emptyTone} />
      </View>
    );
  }

  return (
    <View className={`mt-3 ${className ?? ''}`}>
      <View className="relative pl-6">
        <View className="absolute bottom-0 left-3 top-0 w-0.5 bg-ring/30" />
        {items.map((it) => (
          <View key={it.id} className="mb-4">
            <View className={`absolute left-2.5 top-1 h-3 w-3 rounded-full ${TONE_BG[it.tone]}`} />
            <View className="rounded-xl border border-border bg-background px-3 py-2">
              <View className="flex-row items-center gap-2">
                <it.icon size={16} color="#0F172A" />
                <Text className="text-foreground">{it.title}</Text>
              </View>
              {it.meta ? (
                <Text className={`mt-0.5 text-xs ${TONE_TEXT[it.tone]}`}>{it.meta}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/** Floating chatbot widget (citizen only). */
const ChatbotWidget: FC<{
  open: boolean;
  onToggle: () => void;
  message: string;
  setMessage: (v: string) => void;
}> = ({ open, onToggle, message, setMessage }) => {
  if (!open) {
    return (
      <View className="absolute bottom-6 right-4">
        <Button
          onPress={onToggle}
          size="lg"
          className="h-14 w-14 items-center justify-center rounded-full p-0">
          <MessageSquare size={24} color="#FFFFFF" />
        </Button>
      </View>
    );
  }

  return (
    <View className="absolute bottom-6 right-4 w-11/12 max-w-[360px]">
      <View className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <View className="flex-row items-center gap-2">
            <MessageSquare size={22} color="#0F172A" />
            <Text className="font-semibold text-foreground">Chatbot</Text>
          </View>

          {/* Close button */}
          <Pressable
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityLabel="Close chat"
            className="h-9 w-9 items-center justify-center rounded-full bg-muted"
            android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: true }}>
            <X size={18} color="#0F172A" />
          </Pressable>
        </View>

        <View className="p-4">
          <View className="rounded-xl border border-border bg-muted p-3">
            <Text className="text-sm text-muted-foreground">
              Hi! I can help with incidents, lost &amp; found, and safety alerts. Ask me anything.
            </Text>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Label nativeID="chatInput" className="hidden">
              <Text>Message</Text>
            </Label>
            <Input
              aria-labelledby="chatInput"
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message…"
              className="h-12 flex-1 rounded-xl bg-background"
              returnKeyType="send"
              onSubmitEditing={() => setMessage('')}
            />
            <Button onPress={() => setMessage('')} className="h-12 rounded-xl px-4">
              <Text className="text-primary-foreground">Send</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};
