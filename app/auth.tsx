import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useAppStore } from "../src/store";
import { getThemePalette } from "../src/theme";
import DynamicLogo from "../components/DynamicLogo";

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

  // If user has a preferred theme already, the auth screen adopts it; otherwise defaults to 'aurora'
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

  // Tab handling state: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Form input fields
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
      Alert.alert("Input Error", "Please enter your email and password.");
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

    // 1. Try remote backend if API_URL is configured
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
          } catch (e) {}
        }

        if (!response.ok) {
          throw new Error(
            data.message || `Authentication failed (Status ${response.status})`,
          );
        }

        if (authMode === "signup") {
          Alert.alert(
            "Success",
            "Your account has been created successfully! Please log in with your credentials.",
            [
              {
                text: "OK",
                onPress: () => {
                  setFullName("");
                  setPhoneNumber("");
                  setPassword("");
                  setConfirmPassword("");
                  setAuthMode("login");
                },
              },
            ],
          );
          setIsLoading(false);
          return;
        }

        loggedInUser = {
          fullName: data.user?.fullName || emailTrimmed.split("@")[0],
          email: data.user?.email || emailTrimmed,
          phoneNumber: data.user?.phoneNumber || "",
        };
      } catch (backendError: any) {
        // If the backend gave a specific rejection (e.g. 401 Unauthorized, invalid password), display it
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
        // Otherwise (network unreachable/offline), fall through to local storage auth
      }
    }

    // 2. Local / Offline Auth Handler
    try {
      const storedUsersRaw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
      let localUsers: any[] = [];
      if (storedUsersRaw) {
        try {
          localUsers = JSON.parse(storedUsersRaw);
        } catch (e) {
          localUsers = [];
        }
      }

      if (authMode === "signup") {
        // Check if user already exists
        const existingIdx = localUsers.findIndex(
          (u) => u.email === emailTrimmed,
        );
        const newUserObj = {
          fullName: fullNameTrimmed,
          email: emailTrimmed,
          phoneNumber: phoneTrimmed,
          password,
        };

        if (existingIdx >= 0) {
          localUsers[existingIdx] = newUserObj;
        } else {
          localUsers.push(newUserObj);
        }

        await AsyncStorage.setItem(
          LOCAL_USERS_KEY,
          JSON.stringify(localUsers),
        );

        Alert.alert(
          "Success",
          "Your account has been created successfully! Please log in with your credentials.",
          [
            {
              text: "OK",
              onPress: () => {
                setFullName("");
                setPhoneNumber("");
                setPassword("");
                setConfirmPassword("");
                setAuthMode("login");
              },
            },
          ],
        );
        setIsLoading(false);
        return;
      }

      // Login Flow
      if (!loggedInUser) {
        const foundUser = localUsers.find((u) => u.email === emailTrimmed);
        if (foundUser) {
          if (foundUser.password && foundUser.password !== password) {
            Alert.alert(
              "Authentication Error",
              "Incorrect password. Please try again.",
            );
            setIsLoading(false);
            return;
          }
          loggedInUser = {
            fullName: foundUser.fullName || emailTrimmed.split("@")[0],
            email: foundUser.email,
            phoneNumber: foundUser.phoneNumber || "",
          };
        } else {
          // Allow first-time login for testing / offline demo
          const defaultName = emailTrimmed.split("@")[0];
          const formattedName =
            defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
          loggedInUser = {
            fullName: formattedName,
            email: emailTrimmed,
            phoneNumber: "+234 814 622 4577",
          };
        }
      }

      const displayName = loggedInUser.fullName || "User";
      await setUsername(displayName);
      await setProfileFullName(displayName);
      await setProfilePhoneNumber(loggedInUser.phoneNumber || "");
      await setProfileEmail(loggedInUser.email || emailTrimmed);
      await setProfileTallyTag(
        "@" + displayName.replace(/\s+/g, "").toUpperCase(),
      );

      await login(undefined, undefined, {
        fullName: displayName,
        email: loggedInUser.email,
      });

      router.replace("/(tabs)" as any);
    } catch (localError: any) {
      Alert.alert(
        "Authentication Error",
        localError.message || "Failed to log in. Please try again.",
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
          {/* App Logo & Branding Header */}
          <View style={styles.brandContainer}>
            <DynamicLogo size={76} style={{ marginBottom: 14 }} />
            <Text style={[styles.brandName, { color: authColors.textPrimary }]}>
              TallySpends
            </Text>
            <Text
              style={[styles.brandSubtitle, { color: authColors.textSecondary }]}
            >
              Automate your budgets, track operations.
            </Text>
          </View>

          {/* Auth Mode Switcher Tabs */}
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
                    borderColor: isDark ? authColors.border : "transparent",
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
                    borderColor: isDark ? authColors.border : "transparent",
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

          {/* Form Fields Container */}
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
                  style={[styles.inputLabel, { color: authColors.textSecondary }]}
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
                  style={[styles.inputLabel, { color: authColors.textSecondary }]}
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
  logoImage: {
    width: "100%",
    height: "100%",
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
