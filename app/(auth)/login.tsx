// app/(auth)/login.tsx
import { router } from "expo-router";
import {
  useEffect,
  useRef,
  useState,
  useContext,
  type ComponentType,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Logo from "@/assets/images/icon.png";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import {
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Shield,
  UserRound,
} from "lucide-react-native";
import { AuthContext } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";

type Role = "citizen" | "officer";

/**
 * Login screen for Guardian.
 * - Roles: Citizen (username) and Officer (numeric ID).
 * - Animated role switcher and form transitions.
 * - Basic validation + navigation stubs.
 */
export default function Login() {
  const [tab, setTab] = useState<Role>("citizen");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const isOfficer = tab === "officer";
  const canContinue = identifier.trim().length > 0 && password.length >= 6;
  const passwordRef = useRef<any>(null);

  // Animations
  const roleAnim = useRef(new Animated.Value(0)).current; // 0 = citizen, 1 = officer
  const formSwitchAnim = useRef(new Animated.Value(1)).current;
  const textSwitchAnim = useRef(new Animated.Value(1)).current;
  const [railW, setRailW] = useState(0);

  useEffect(() => {
    Animated.timing(roleAnim, {
      toValue: isOfficer ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    formSwitchAnim.setValue(0.9);
    Animated.spring(formSwitchAnim, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: true,
    }).start();

    textSwitchAnim.setValue(0);
    Animated.timing(textSwitchAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isOfficer, formSwitchAnim, roleAnim, textSwitchAnim]);

  // Derived animated values
  const tabWidth = railW > 0 ? railW / 2 : 0;
  const indicatorTX = roleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, tabWidth] });
  const formOpacity = formSwitchAnim.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] });
  const formTranslateY = formSwitchAnim.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] });
  const labelOpacity = textSwitchAnim;
  const labelTranslateY = textSwitchAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });

  /**
   * Normalize identifier by role.
   * - Officer: strip non-digits.
   * - Citizen: collapse internal whitespace and trim.
   */
  const sanitizeIdentifier = (value: string): string => {
    return isOfficer ? value.replace(/\D+/g, "") : value.replace(/\s+/g, "");
  };

  /**
   * Handle sign-in flow via backend.
   */
  const onSignIn = async (): Promise<void> => {
    if (loading) return;
    const safeId = sanitizeIdentifier(identifier);
    if (safeId !== identifier) setIdentifier(safeId);
    try {
      setLoading(true);
      const res = await apiService.post("/api/v1/auth/login", {
        identifier: safeId,
        password,
        role: isOfficer ? "officer" : "citizen",
      });
      const { accessToken, refreshToken } = res.data.data;
      await login(accessToken, refreshToken);
      toast.success("Welcome back!");
      router.replace("/home");
    } catch (e: any) {
      const message = e.response?.data?.message ?? "Sign in failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const IdentifierIcon = isOfficer ? IdCard : UserRound;

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
        {/* Header */}
        <View className="flex-1 justify-center pt-10 pb-6">
          <View className="items-center mb-5">
            <Image
              source={Logo}
              style={{ width: 96, height: 96, borderRadius: 20 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-3xl font-bold text-foreground">Guardian</Text>
            <Text className="text-sm text-muted-foreground mt-1 text-center">
              Sign in to continue
            </Text>
          </View>

          {/* Form */}
          <Animated.View
            className="bg-muted rounded-2xl border border-border p-4 gap-4"
            style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
          >
            {/* Role switcher */}
            <View
              onLayout={(e) => setRailW(e.nativeEvent.layout.width)}
              className="bg-background rounded-xl border border-border p-1 overflow-hidden"
            >
              {tabWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    width: tabWidth - 4,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#0F172A",
                    transform: [{ translateX: indicatorTX }],
                  }}
                />
              ) : null}

              <View className="flex-row">
                <SegTab
                  active={!isOfficer}
                  label="Citizen"
                  icon={UserRound}
                  onPress={() => setTab("citizen")}
                />
                <SegTab
                  active={isOfficer}
                  label="Officer"
                  icon={Shield}
                  onPress={() => setTab("officer")}
                />
              </View>
            </View>

            {/* Identifier input */}
            <View className="gap-1">
              <Label nativeID="identifierLabel" className="text-xs">
                <Animated.Text
                  style={{
                    opacity: labelOpacity,
                    transform: [{ translateY: labelTranslateY }],
                  }}
                  className="text-xs text-foreground"
                >
                  {isOfficer ? "Officer ID" : "Username"}
                </Animated.Text>
              </Label>

              <View className="relative">
                <IdentifierIcon size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  aria-labelledby="identifierLabel"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(isOfficer ? text.replace(/\D+/g, "") : text.replace(/\s+/g, ""));
                  }}
                  onBlur={() => setIdentifier((prev) => sanitizeIdentifier(prev))}
                  autoCapitalize="none"
                  autoComplete={isOfficer ? "off" : "username"}
                  keyboardType={isOfficer ? "number-pad" : "default"}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder={isOfficer ? "000000" : "username"}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Password input */}
            <View className="gap-1">
              <View className="flex-row items-center justify-between">
                <Label nativeID="passwordLabel" className="text-xs">
                  <Text className="text-xs text-foreground">Password</Text>
                </Label>
                <Button variant="link" onPress={() => {}} className="h-auto p-0" accessibilityRole="link">
                  <Text className="text-[11px] text-muted-foreground">Forgot your password?</Text>
                </Button>
              </View>

              <View className="relative">
                <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={passwordRef}
                  aria-labelledby="passwordLabel"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={onSignIn}
                  secureTextEntry={!showPw}
                  placeholder="••••••••"
                  className="bg-background h-12 rounded-xl pl-9 pr-12"
                />
                <Pressable
                  onPress={() => setShowPw((v) => !v)}
                  accessibilityLabel={showPw ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: 6,
                    height: 36,
                    width: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 18,
                  }}
                  android_ripple={{ color: "rgba(0,0,0,0.08)", borderless: true }}
                >
                  {showPw ? <EyeOff size={18} color="#0F172A" /> : <Eye size={18} color="#0F172A" />}
                </Pressable>
              </View>
            </View>

            {/* Submit */}
            <Button
              onPress={onSignIn}
              size="lg"
              variant="default"
              className="mt-1 h-12 rounded-xl active:opacity-90 active:scale-95"
              disabled={!canContinue || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Sign in</Text>
              )}
            </Button>
          </Animated.View>

          {/* Footer */}
          <View className="items-center mt-4">
            {!isOfficer ? (
              <Button variant="link" onPress={() => router.push("/register")} className="h-auto p-0">
                <Text className="text-sm text-primary">
                  Don&apos;t have an account? <Text className="underline">Sign up</Text>
                </Text>
              </Button>
            ) : (
              <Text className="text-xs text-muted-foreground text-center">
                Officer access is provisioned by your department. Contact your admin.
              </Text>
            )}
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

/** Segmented control tab. */
function SegTab({
  active,
  label,
  icon: IconCmp,
  onPress,
}: {
  active: boolean;
  label: string;
    icon: ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 h-9 rounded-lg"
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <View className="flex-row items-center justify-center gap-1.5">
        <IconCmp size={16} color={active ? "#FFFFFF" : "#64748B"} />
        <Text className={active ? "font-semibold text-white" : "text-muted-foreground"}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
