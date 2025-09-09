// app/(auth)/register.tsx
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Logo from "@/assets/images/icon.png";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Lock, Mail, UserRound } from "lucide-react-native";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { apiService } from "@/services/apiService";
import useMountAnimation from "@/hooks/useMountAnimation";

/**
 * Citizen account registration screen.
 * - Collects first/last name, username, email, and password.
 * - Basic client-side validation (length, match).
 * - Navigates to Login after successful submission (stub).
 */
export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  // Focus chain
  const lastNameRef = useRef<any>(null);
  const usernameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmRef = useRef<any>(null);

  const canSubmit =
    firstName.trim().length > 1 &&
    lastName.trim().length > 1 &&
    username.trim().length > 2 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    confirm === password;

  /**
   * Submit registration via backend.
   */
  const onSignUp = async (): Promise<void> => {
    if (!canSubmit || loading) return;
    try {
      setLoading(true);
      const res = await apiService.post("/api/v1/auth/register", {
        firstName: sanitize(firstName),
        lastName: sanitize(lastName),
        username: sanitize(username),
        email: sanitize(email),
        password,
      });
      const { accessToken, refreshToken } = res.data.data;
      await login(accessToken, refreshToken);
      toast.success("Welcome!");
      router.replace("/home");
    } catch (e: any) {
      const message = e.response?.data?.message ?? "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Entrance motion for form
  const { value: formAnim } = useMountAnimation({
    damping: 14,
    stiffness: 160,
    mass: 0.6,
  });

  const formOpacity = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] });
  const formTranslateY = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] });

  /**
   * Normalize input (trim + collapse whitespace).
   */
  const sanitize = (v: string): string => v.trim().replace(/\s+/g, " ");

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
            <Text className="mt-3 text-3xl font-bold text-foreground">Create account</Text>
            <Text className="text-sm text-muted-foreground mt-1 text-center">
              Citizen sign up
            </Text>
          </View>

          {/* Form */}
          <Animated.View
            className="bg-muted rounded-2xl border border-border p-4 gap-4"
            style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
          >
            {/* First name */}
            <View className="gap-1">
              <Label nativeID="firstNameLabel" className="text-xs">
                <Text className="text-xs text-foreground">First name</Text>
              </Label>
              <View className="relative">
                <UserRound size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  aria-labelledby="firstNameLabel"
                  value={firstName}
                  onChangeText={setFirstName}
                  onBlur={() => setFirstName((v) => sanitize(v))}
                  placeholder="Alex"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Last name */}
            <View className="gap-1">
              <Label nativeID="lastNameLabel" className="text-xs">
                <Text className="text-xs text-foreground">Last name</Text>
              </Label>
              <View className="relative">
                <UserRound size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={lastNameRef}
                  aria-labelledby="lastNameLabel"
                  value={lastName}
                  onChangeText={setLastName}
                  onBlur={() => setLastName((v) => sanitize(v))}
                  placeholder="Johnson"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => usernameRef.current?.focus()}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Username */}
            <View className="gap-1">
              <Label nativeID="usernameLabel" className="text-xs">
                <Text className="text-xs text-foreground">Username</Text>
              </Label>
              <View className="relative">
                <UserRound size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={usernameRef}
                  aria-labelledby="usernameLabel"
                  value={username}
                  onChangeText={setUsername}
                  onBlur={() => setUsername((v) => sanitize(v))}
                  autoCapitalize="none"
                  placeholder="alexj"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Email */}
            <View className="gap-1">
              <Label nativeID="emailLabel" className="text-xs">
                <Text className="text-xs text-foreground">Email</Text>
              </Label>
              <View className="relative">
                <Mail size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={emailRef}
                  aria-labelledby="emailLabel"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setEmail((v) => sanitize(v))}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="m@example.com"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Password */}
            <View className="gap-1">
              <Label nativeID="passwordLabel" className="text-xs">
                <Text className="text-xs text-foreground">Password</Text>
              </Label>
              <View className="relative">
                <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={passwordRef}
                  aria-labelledby="passwordLabel"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete="password-new"
                  secureTextEntry={!showPw}
                  placeholder="••••••••"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>
            </View>

            {/* Confirm password */}
            <View className="gap-1">
              <Label nativeID="confirmLabel" className="text-xs">
                <Text className="text-xs text-foreground">Confirm password</Text>
              </Label>
              <View className="relative">
                <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  ref={confirmRef}
                  aria-labelledby="confirmLabel"
                  value={confirm}
                  onChangeText={setConfirm}
                  autoComplete="password-new"
                  secureTextEntry={!showPw}
                  placeholder="••••••••"
                  returnKeyType="done"
                  onSubmitEditing={onSignUp}
                  className="bg-background h-12 rounded-xl pl-9"
                />
              </View>

              {/* Password visibility toggle */}
              <View className="items-end mt-1">
                <Button
                  variant="link"
                  onPress={() => setShowPw((v) => !v)}
                  className="h-auto p-0"
                  accessibilityLabel={showPw ? "Hide password" : "Show password"}
                >
                  <Text className="text-xs text-primary">
                    {showPw ? "Hide password" : "Show password"}
                  </Text>
                </Button>
              </View>
            </View>

            {/* Submit */}
            <Button
              onPress={onSignUp}
              size="lg"
              variant="default"
              className="mt-1 h-12 rounded-xl"
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-primary-foreground">Create account</Text>
              )}
            </Button>
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
