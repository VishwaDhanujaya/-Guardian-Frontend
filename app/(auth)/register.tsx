// app/(auth)/register.tsx
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Logo from "@/assets/images/icon.png";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

import { Lock, Mail, UserRound } from "lucide-react-native";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false); // single toggle for both fields

  // Focus chain
  const emailRef = useRef<any>(null);
  const passwordRef = useRef<any>(null);
  const confirmRef = useRef<any>(null);

  const canSubmit =
    name.trim().length > 1 &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    confirm === password;

  const onSignUp = () => {
    if (!canSubmit) return;
    toast.success("Account created");
    router.replace("/login");
  };

  // Smooth form fade/slide (consistency with Login)
  const formAnim = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(formAnim, {
      toValue: 1,
      damping: 14,
      stiffness: 160,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [formAnim]);

  const formOpacity = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [0.95, 1] });
  const formTranslateY = formAnim.interpolate({ inputRange: [0.9, 1], outputRange: [6, 0] });

  // Sanitizers on blur (consistency with Login behavior)
  const sanitizeName = (v: string) => v.trim().replace(/\s+/g, " ");
  const sanitizeEmail = (v: string) => v.trim().replace(/\s+/g, " ");

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={80}
      onScrollBeginDrag={Keyboard.dismiss}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}           // keep full-page background WHITE
      contentContainerStyle={{ flexGrow: 1, backgroundColor: "#FFFFFF" }}
    >
      <View className="flex-1 p-5">
        {/* Centered main content (nudged downward to match Login) */}
        <View className="flex-1 justify-center pt-10 pb-6">
          {/* Header: big logo + title + subtitle (consistent with Login) */}
          <View className="items-center mb-5">
            <Image
              source={Logo}
              style={{ width: 96, height: 96, borderRadius: 20 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-3xl font-bold text-foreground">Create account</Text>
            <Text className="text-sm text-muted-foreground mt-1 text-center">Citizen sign up</Text>
          </View>

          {/* Form card */}
          <Animated.View
            className="bg-muted rounded-2xl border border-border p-4 gap-4"
            style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}
          >
            {/* Full name */}
            <View className="gap-1">
              <Label nativeID="nameLabel" className="text-xs">
                <Text className="text-xs text-foreground">Full name</Text>
              </Label>
              <View className="relative">
                <UserRound size={16} color="#94A3B8" style={{ position: "absolute", left: 12, top: 14 }} />
                <Input
                  aria-labelledby="nameLabel"
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setName((v) => sanitizeName(v))}
                  placeholder="Alex Johnson"
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
                  onBlur={() => setEmail((v) => sanitizeEmail(v))}
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

              {/* Single toggle under confirm field (consistent with your preference) */}
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

            {/* Create account */}
            <Button
              onPress={onSignUp}
              size="lg"
              variant="default"
              className="mt-1 h-12 rounded-xl"
              disabled={!canSubmit}
            >
              <Text className="font-semibold text-primary-foreground">Create account</Text>
            </Button>
          </Animated.View>

          {/* Back to login (centered + consistent spacing) */}
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
