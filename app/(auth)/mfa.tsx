// app/(auth)/mfa.tsx
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Logo from "@/assets/images/icon.png";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import useMountAnimation from "@/hooks/useMountAnimation";

/**
 * MFA verification screen.
 * - Accepts a 6-digit OTP and verifies user session.
 * - Mirrors the motion/visual language used in Login/Register.
 * - Supports officer vs. citizen copy via `role` query param.
 */
export default function Mfa() {
  const { role } = useLocalSearchParams<{ role?: string }>(); // "officer" | undefined
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const isValid = code.length === 6;

  /**
   * Verify the provided code via backend.
   */
  const onVerify = async (): Promise<void> => {
    if (!isValid || loading) return;
    try {
      setLoading(true);
      const res = await apiService.post("/api/v1/auth/mfa", {
        code,
        role: role === "officer" ? "officer" : "citizen",
      });
      const { accessToken, refreshToken } = res.data.data;
      await login(accessToken, refreshToken);
      toast.success("Verified");
      router.replace("/home");
    } catch (e: any) {
      const message = e.response?.data?.message ?? "Invalid code";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Accept numeric input only; clamp to 6 chars.
   * @param v - Raw input value from the text field.
   */
  const onChangeCode = (v: string): void => {
    const next = v.replace(/\D/g, "").slice(0, 6);
    setCode(next);
  };

  /**
   * Trigger a resend and start cooldown timer.
   * No-op when cooldown is active.
   */
  const onResend = (): void => {
    if (cooldown > 0) return;
    setCooldown(30);
    setCode("");
    toast.info("New code sent (demo: 123456)");
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Motion: form entrance + subtitle cross-fade
  const { value: formAnim } = useMountAnimation({
    damping: 14,
    stiffness: 160,
    mass: 0.6,
  });
  const subtitleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    subtitleAnim.setValue(0);
    Animated.timing(subtitleAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [role, subtitleAnim]);

  // Derived animated values
  const formOpacity = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] });
  const formTranslateY = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] });
  const subtitleOpacity = subtitleAnim;
  const subtitleTranslateY = subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });

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
        <View className="flex-1 justify-center pt-10 pb-6">
          {/* Header */}
          <View className="items-center mb-5">
            <Image
              source={Logo}
              style={{ width: 96, height: 96, borderRadius: 20 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-3xl font-bold text-foreground">Verify it’s you</Text>
            <Animated.Text
              style={{
                opacity: subtitleOpacity,
                transform: [{ translateY: subtitleTranslateY }],
              }}
              className="text-sm text-muted-foreground mt-1 text-center"
            >
              Enter the 6-digit code we sent{" "}
              {role === "officer" ? "to your officer contact" : "to your device"}.
            </Animated.Text>
          </View>

          {/* Form */}
          <Animated.View
            className="bg-muted rounded-2xl border border-border p-4 gap-4"
            style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
          >
            {/* Code input */}
            <View className="gap-1">
              <Label nativeID="codeLabel" className="text-xs">
                <Text className="text-xs text-foreground">6-digit code</Text>
              </Label>

              <Input
                aria-labelledby="codeLabel"
                value={code}
                onChangeText={onChangeCode}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={onVerify}
                placeholder={isFocused ? "" : "123456"}
                placeholderTextColor="#94A3B8"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                className="bg-background h-12 rounded-xl text-center"
                style={{
                  textAlign: "center",
                  letterSpacing: Platform.OS === "ios" ? 8 : 6,
                  textAlignVertical: "center",
                  fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: undefined }),
                }}
              />
            </View>

            {/* Verify */}
            <Button
              onPress={onVerify}
              size="lg"
              variant="default"
              className="mt-1 h-12 rounded-xl"
              disabled={!isValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Verify</Text>
              )}
            </Button>

            {/* Resend */}
            <View className="flex-row items-center justify-center mt-1">
              <Text className="text-xs text-muted-foreground">Didn&apos;t receive a code?</Text>
              <Button
                variant="link"
                onPress={onResend}
                disabled={cooldown > 0}
                className="h-auto p-0 ml-1"
              >
                <Text className={cooldown > 0 ? "text-xs text-muted-foreground" : "text-xs text-primary"}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                </Text>
              </Button>
            </View>
          </Animated.View>

          {/* Back to login */}
          <View className="items-center mt-4">
            <Button variant="link" onPress={() => router.replace("/login")} className="h-auto p-0">
              <Text className="text-sm text-primary">Back to login</Text>
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
