import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DynamicLogo from "../components/DynamicLogo";
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const LOCAL_USERS_KEY = "ts_registered_users";

export default function AuthScreen() {
  const router = useRouter();
  const {
    login,
    setUsername,
    setProfileFullName,
    setProfilePhoneNumber,
    setProfileEmail,
    setProfileTallyTag,
    themePreference,
    themeMode,
  } = useAppStore();

  const isDark = themeMode === "dark";
  const theme = getThemePalette(themePreference || "aurora", themeMode);

  const authColors = useMemo(
    () => ({
      background: theme.background,
      surface: theme.surface,
      surfaceSoft: theme.surfaceSoft,
      inputBg: isDark ? theme.surfaceSoft : "#FFFFFF",
      border: theme.border,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary,
      placeholder: isDark ? theme.textSecondary : "#9E8FA6",
      accent: theme.accent,
      accentSoft: theme.accentSoft,
      tabTrack: isDark ? theme.surfaceSoft : theme.mutedBackground,
      tabActive: isDark ? theme.accentSoft : "#FFFFFF",
      buttonBg: isDark ? theme.accent : theme.textPrimary,
      buttonText: "#FFFFFF",
    }),
    [isDark, theme],
  );

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async () => {
    setIsLoading(true);

    const emailTrimmed = email.trim().toLowerCase();
    const fullNameTrimmed = fullName.trim();
    const phoneTrimmed = phoneNumber.trim();

    if (!emailTrimmed || !password) {
      Alert.alert(
        "Input Error",
        authMode === "login"
          ? "Please enter your email and password."
          : "Please enter your email and password.",
      );
      setIsLoading(false);
      return;
    }

    if (authMode === "signup") {
      if (!fullNameTrimmed || !phoneTrimmed) {
        Alert.alert(
          "Input Error",
          "Please fill in your Full Name and Phone Number.",
        );
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        Alert.alert(
          "Password Too Short",
          "Password must be at least 6 characters long.",
        );
        setIsLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          "Password Mismatch",
          "Passwords do not match. Please verify your passwords.",
        );
        setIsLoading(false);
        return;
      }
    }

    let loggedInUser: {
      fullName: string;
      email: string;
      phoneNumber: string;
    } | null = null;

    // 1. Try remote API endpoint if configured
    if (API_URL) {
      try {
        const endpoint =
          authMode === "login" ? "/api/auth/login" : "/api/auth/register";
        const payload =
          authMode === "login"
            ? { email: emailTrimmed, password }
            : {
                fullName: fullNameTrimmed,
                email: emailTrimmed,
                password,
                phoneNumber: phoneTrimmed,
              };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const responseText = await response.text();
        let data: any = {};
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {}
        }

        if (!response.ok) {
          throw new Error(
            data.message || `Authentication failed (Status ${response.status})`,
          );
        }

        loggedInUser = {
          fullName: data.user?.fullName || fullNameTrimmed || emailTrimmed.split("@")[0],
          email: data.user?.email || emailTrimmed,
          phoneNumber: data.user?.phoneNumber || phoneTrimmed,
        };
      } catch (backendError: any) {
        // If backend explicitly rejected with invalid credentials (not a network abort), display it
        if (
          backendError.message &&
          !backendError.message.includes("Network") &&
          !backendError.message.includes("abort") &&
          !backendError.message.includes("Failed to fetch")
        ) {
          Alert.alert("Authentication Error", backendError.message);
          setIsLoading(false);
          return;
        }
        // Otherwise network is offline/unreachable, gracefully fall through to local auth
      }
    }

    // 2. Local / Offline Auth Handler
    try {
      const storedUsersRaw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
      let localUsers: any[] = [];
      if (storedUsersRaw) {
        try {
          localUsers = JSON.parse(storedUsersRaw);
        } catch {
          localUsers = [];
        }
      }

      if (authMode === "signup") {
        const emailTaken = localUsers.some(
          (u) => u.email && u.email.toLowerCase() === emailTrimmed,
        );

        if (emailTaken) {
          Alert.alert(
            "Account Exists",
            `An account with email "${emailTrimmed}" already exists. Please log in instead.`,
          );
          setIsLoading(false);
          return;
        }

        const newUser = {
          fullName: fullNameTrimmed,
          email: emailTrimmed,
          phoneNumber: phoneTrimmed,
          password: password,
          createdAt: new Date().toISOString(),
        };

        localUsers.push(newUser);
        await AsyncStorage.setItem(
          LOCAL_USERS_KEY,
          JSON.stringify(localUsers),
        );

        loggedInUser = {
          fullName: fullNameTrimmed,
          email: emailTrimmed,
          phoneNumber: phoneTrimmed,
        };
      } else {
        // Login mode
        const existingUser = localUsers.find(
          (u) =>
            u.email &&
            u.email.toLowerCase() === emailTrimmed &&
            u.password === password,
        );

        if (existingUser) {
          loggedInUser = {
            fullName: existingUser.fullName || emailTrimmed.split("@")[0],
            email: existingUser.email || emailTrimmed,
            phoneNumber: existingUser.phoneNumber || "",
          };
        } else if (localUsers.length === 0) {
          // First time offline user convenience login
          const defaultUser = {
            fullName: emailTrimmed.split("@")[0] || "TallySpends User",
            email: emailTrimmed,
            phoneNumber: phoneTrimmed || "+234 800 000 0000",
            password: password,
            createdAt: new Date().toISOString(),
          };
          localUsers.push(defaultUser);
          await AsyncStorage.setItem(
            LOCAL_USERS_KEY,
            JSON.stringify(localUsers),
          );
          loggedInUser = defaultUser;
        } else {
          Alert.alert(
            "Login Failed",
            "Invalid email or password. Please check your credentials or create a new account.",
          );
          setIsLoading(false);
          return;
        }
      }

      if (loggedInUser) {
        await setUsername(loggedInUser.fullName);
        await setProfileFullName(loggedInUser.fullName);
        await setProfilePhoneNumber(loggedInUser.phoneNumber);
        await setProfileEmail(loggedInUser.email);
        await setProfileTallyTag(
          "@" + loggedInUser.fullName.replace(/\s+/g, "").toUpperCase(),
        );

        login();

        if (authMode === "signup") {
          router.replace("/onboarding/goals" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      }
    } catch {
      Alert.alert(
        "Authentication Error",
        "Could not complete authentication. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: authColors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Branding */}
          <View style={styles.brandContainer}>
            <View
              style={[
                styles.logoFrame,
                {
                  backgroundColor: authColors.surface,
                  borderColor: authColors.border,
                  shadowColor: authColors.accent,
                },
              ]}
            >
              <DynamicLogo size={46} />
            </View>
            <Text
              style={[styles.brandName, { color: authColors.textPrimary }]}
            >
              TallySpends
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: authColors.textSecondary },
              ]}
            >
              Automate your budgets, track operations.
            </Text>
          </View>

          {/* Login / Sign Up Tabs */}
          <View
            style={[
              styles.tabContainer,
              {
                backgroundColor: authColors.tabTrack,
                borderColor: authColors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "login" && [
                  styles.activeTabButton,
                  {
                    backgroundColor: authColors.tabActive,
                    borderColor: authColors.border,
                  },
                ],
              ]}
              onPress={() => setAuthMode("login")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      authMode === "login"
                        ? authColors.textPrimary
                        : authColors.textSecondary,
                    fontWeight: authMode === "login" ? "700" : "500",
                  },
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "signup" && [
                  styles.activeTabButton,
                  {
                    backgroundColor: authColors.tabActive,
                    borderColor: authColors.border,
                  },
                ],
              ]}
              onPress={() => setAuthMode("signup")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      authMode === "signup"
                        ? authColors.textPrimary
                        : authColors.textSecondary,
                    fontWeight: authMode === "signup" ? "700" : "500",
                  },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Container */}
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: authColors.surface,
                borderColor: authColors.border,
              },
            ]}
          >
            {/* Full Name & Phone Number (Sign Up Only) */}
            {authMode === "signup" && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: authColors.textSecondary },
                  ]}
                >
                  Full Name
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: authColors.inputBg,
                      borderColor: authColors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={authColors.placeholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: authColors.textPrimary }]}
                    placeholder="John Doe"
                    placeholderTextColor={authColors.placeholder}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { color: authColors.textSecondary },
                  ]}
                >
                  Phone Number
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: authColors.inputBg,
                      borderColor: authColors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={authColors.placeholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: authColors.textPrimary }]}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor={authColors.placeholder}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </>
            )}

            {/* Email Field Input */}
            <Text
              style={[styles.inputLabel, { color: authColors.textSecondary }]}
            >
              Email Address
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: authColors.inputBg,
                  borderColor: authColors.border,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={authColors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: authColors.textPrimary }]}
                placeholder="you@example.com"
                placeholderTextColor={authColors.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field Input */}
            <Text
              style={[styles.inputLabel, { color: authColors.textSecondary }]}
            >
              Password
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: authColors.inputBg,
                  borderColor: authColors.border,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={authColors.placeholder}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, { color: authColors.textPrimary }]}
                placeholder="••••••••"
                placeholderTextColor={authColors.placeholder}
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={authColors.placeholder}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {authMode === "signup" && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: authColors.textSecondary },
                  ]}
                >
                  Confirm Password
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: authColors.inputBg,
                      borderColor: authColors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={authColors.placeholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      { color: authColors.textPrimary },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={authColors.placeholder}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: authColors.buttonBg },
                isLoading && styles.actionButtonDisabled,
              ]}
              onPress={handleAuthAction}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={authColors.buttonText} />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: authColors.buttonText },
                  ]}
                >
                  {authMode === "login" ? "Log In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 32,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoFrame: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  brandName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  activeTabButton: {
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
  },
  formContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 6,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  eyeIcon: {
    padding: 6,
  },
  actionButton: {
    height: 50,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
