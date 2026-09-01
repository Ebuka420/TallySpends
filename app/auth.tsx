import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
const PENDING_SIGNUP_KEY = "ts_pending_signup";

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
  const [signupUsername, setSignupUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async () => {
    if (isLoading) return;

    setIsLoading(true);

    const identifierTrimmed = email.trim().toLowerCase().replace(/^@+/, "");

    const fullNameTrimmed = fullName.trim();
    const phoneTrimmed = phoneNumber.trim();

    const usernameTrimmed = signupUsername
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

    /*
     * ============================================================
     * BASIC VALIDATION
     * ============================================================
     */

    if (!identifierTrimmed || !password) {
      Alert.alert(
        "Input Error",
        authMode === "login"
          ? "Please enter your email or TallyTag and password."
          : "Please enter your email and password.",
      );

      setIsLoading(false);
      return;
    }

    /*
     * ============================================================
     * SIGNUP VALIDATION
     * ============================================================
     */

    if (authMode === "signup") {
      if (!fullNameTrimmed || !phoneTrimmed || !usernameTrimmed) {
        Alert.alert(
          "Input Error",
          "Please fill in your Full Name, TallyTag, and Phone Number.",
        );

        setIsLoading(false);
        return;
      }

      if (usernameTrimmed.length < 6) {
        Alert.alert(
          "Invalid TallyTag",
          "Your TallyTag must be at least 6 characters long.",
        );

        setIsLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9_.]+$/.test(usernameTrimmed)) {
        Alert.alert(
          "Invalid TallyTag",
          "TallyTag can only contain letters, numbers, underscores, and periods.",
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

      if (!identifierTrimmed.includes("@")) {
        Alert.alert("Invalid Email", "Please enter a valid email address.");

        setIsLoading(false);
        return;
      }
    }

    /*
     * ============================================================
     * SIGNUP
     *
     * IMPORTANT:
     * Do NOT call /api/auth/register here.
     *
     * The account should only be registered after onboarding is
     * completed.
     *
     * We temporarily save the signup information locally so that
     * the onboarding pages can use it later.
     * ============================================================
     */

    if (authMode === "signup") {
      try {
        const pendingSignup = {
          fullName: fullNameTrimmed,
          tallyTag: usernameTrimmed,
          email: identifierTrimmed,
          password,
          phoneNumber: phoneTrimmed,
        };

        await AsyncStorage.setItem(
          PENDING_SIGNUP_KEY,
          JSON.stringify(pendingSignup),
        );

        /*
         * Clear the auth form because the data is now safely stored
         * as pending signup information.
         */
        setFullName("");
        setSignupUsername("");
        setPhoneNumber("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        setIsLoading(false);

        /*
         * Start the onboarding flow.
         */
        router.replace("/onboarding/goals");
        return;
      } catch (error: any) {
        console.error("PENDING SIGNUP ERROR:", error);

        Alert.alert(
          "Signup Error",
          "Unable to start your account setup. Please try again.",
        );

        setIsLoading(false);
        return;
      }
    }

    /*
     * ============================================================
     * LOGIN
     * ============================================================
     */

    let loggedInUser: {
      userId?: number;
      fullName: string;
      tallyTag?: string;
      email: string;
      phoneNumber: string;
    } | null = null;

    /*
     * ============================================================
     * REMOTE BACKEND LOGIN
     * ============================================================
     */

    if (API_URL) {
      try {
        const endpoint = "/api/auth/login";

        /*
         * IMPORTANT:
         *
         * Your Swagger backend expects:
         *
         * {
         *   "emailOrTallyTag": "ebuka_99",
         *   "password": "Vanbasten09!"
         * }
         *
         * The previous code incorrectly sent:
         *
         * {
         *   "email": "ebuka_99",
         *   "password": "..."
         * }
         *
         * That is why the backend returned:
         *
         * "Email or TallyTag is required."
         */

        const payload = {
          emailOrTallyTag: identifierTrimmed,
          password,
        };

        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 7000);

        console.log("=================================");
        console.log("AUTH REQUEST URL:", `${API_URL}${endpoint}`);
        console.log("AUTH REQUEST PAYLOAD:", JSON.stringify(payload));
        console.log("=================================");

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();

        let data: any = {};

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            console.log("AUTH RESPONSE WAS NOT JSON:", responseText);
          }
        }

        if (!response.ok) {
          console.log("=================================");
          console.log("AUTH API ERROR");
          console.log("Status:", response.status);
          console.log("Response:", responseText);
          console.log("Parsed data:", data);
          console.log("=================================");

          const backendValidationError =
            data?.errors?.EmailOrTallyTag?.[0] ||
            data?.errors?.emailOrTallyTag?.[0];

          throw new Error(
            backendValidationError ||
              data?.message ||
              data?.title ||
              `Authentication failed (Status ${response.status})`,
          );
        }

        /*
         * Swagger response is directly shaped like:
         *
         * {
         *   userId,
         *   fullName,
         *   email,
         *   tallyTag,
         *   accessToken,
         *   refreshToken
         * }
         *
         * It is NOT nested under data.user.
         */

        const userId =
          typeof data.userId === "number" ? data.userId : undefined;

        const returnedFullName =
          data.fullName || identifierTrimmed.split("@")[0] || "User";

        const returnedTallyTag =
          data.tallyTag ||
          (identifierTrimmed.includes("@") ? "" : identifierTrimmed);

        const returnedEmail =
          data.email ||
          (identifierTrimmed.includes("@") ? identifierTrimmed : "");

        const returnedPhoneNumber = data.phoneNumber || "";

        loggedInUser = {
          userId,
          fullName: returnedFullName,
          tallyTag: returnedTallyTag,
          email: returnedEmail,
          phoneNumber: returnedPhoneNumber,
        };

        /*
         * Save authentication tokens.
         */

        if (data.accessToken) {
          await AsyncStorage.setItem("ts_access_token", data.accessToken);
        }

        if (data.refreshToken) {
          await AsyncStorage.setItem("ts_refresh_token", data.refreshToken);
        }

        /*
         * Save complete backend user response.
         */

        await AsyncStorage.setItem("ts_user", JSON.stringify(data));

        /*
         * Update profile information.
         */

        await setProfileFullName(returnedFullName);

        await setProfilePhoneNumber(returnedPhoneNumber);

        await setProfileEmail(returnedEmail);

        if (returnedTallyTag) {
          await setProfileTallyTag(`@${returnedTallyTag.replace(/^@+/, "")}`);

          await setUsername(returnedTallyTag.replace(/^@+/, ""));
        }

        /*
         * IMPORTANT:
         *
         * login() only accepts:
         * userId, fullName, email
         *
         * So DO NOT pass tallyTag here.
         *
         * This fixes your TypeScript errors:
         * TS2353 at lines 482 and 659.
         */

        await login(data.accessToken, data.refreshToken, {
          userId,
          fullName: returnedFullName,
          email: returnedEmail,
        });

        /*
         * Login succeeded.
         */

        console.log("AUTH LOGIN SUCCESS");
        console.log("USER:", loggedInUser);

        setIsLoading(false);

        router.replace("/(tabs)" as any);

        return;
      } catch (backendError: any) {
        const errorMessage = backendError?.message || "";

        /*
         * If the server actually responded with 400/401/etc.,
         * DO NOT silently fall back to fake/local login.
         */

        if (
          errorMessage &&
          !errorMessage.includes("Network") &&
          !errorMessage.includes("abort") &&
          !errorMessage.includes("Failed to fetch") &&
          !errorMessage.includes("Network request failed")
        ) {
          Alert.alert("Authentication Error", errorMessage);

          setIsLoading(false);
          return;
        }

        /*
         * Only network/offline errors reach local authentication.
         */

        console.log("Backend unavailable. Attempting local authentication.");
      }
    }

    /*
     * ============================================================
     * LOCAL / OFFLINE LOGIN
     * ============================================================
     */

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

      /*
       * ============================================================
       * FIND LOCAL USER
       * ============================================================
       */

      const normalizedIdentifier = identifierTrimmed
        .replace(/^@+/, "")
        .toLowerCase();

      const foundUser = localUsers.find(
        (u) =>
          (u.email && u.email.toLowerCase() === normalizedIdentifier) ||
          (u.tallyTag && u.tallyTag.toLowerCase() === normalizedIdentifier) ||
          (u.username && u.username.toLowerCase() === normalizedIdentifier),
      );

      if (!foundUser) {
        Alert.alert(
          "Account Not Found",
          "We couldn't find an account with that email or TallyTag. Please check your details or create an account.",
        );

        setIsLoading(false);
        return;
      }

      /*
       * Check local password.
       */

      if (foundUser.password && foundUser.password !== password) {
        Alert.alert(
          "Authentication Error",
          "Incorrect password. Please try again.",
        );

        setIsLoading(false);
        return;
      }

      const assignedTallyTag = foundUser.tallyTag || foundUser.username || "";

      const displayName = foundUser.fullName || assignedTallyTag || "User";

      const userEmail = foundUser.email || "";

      const userPhone = foundUser.phoneNumber || "";

      loggedInUser = {
        fullName: displayName,
        tallyTag: assignedTallyTag,
        email: userEmail,
        phoneNumber: userPhone,
      };

      /*
       * Update store.
       */

      if (assignedTallyTag) {
        await setUsername(assignedTallyTag.replace(/^@+/, ""));

        await setProfileTallyTag(`@${assignedTallyTag.replace(/^@+/, "")}`);
      }

      await setProfileFullName(displayName);

      await setProfilePhoneNumber(userPhone);

      await setProfileEmail(userEmail);

      /*
       * IMPORTANT:
       * Keep tallyTag OUT of login().
       *
       * This fixes TS2353.
       */

      await login(undefined, undefined, {
        fullName: displayName,
        email: userEmail,
      });

      await AsyncStorage.setItem(
        "ts_user",
        JSON.stringify({
          fullName: displayName,
          tallyTag: assignedTallyTag,
          email: userEmail,
          phoneNumber: userPhone,
        }),
      );

      setIsLoading(false);

      router.replace("/(tabs)" as any);
    } catch (localError: any) {
      console.error("LOCAL AUTH ERROR:", localError);

      Alert.alert(
        "Authentication Error",
        localError?.message || "Failed to log in. Please try again.",
      );

      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: authColors.background,
        },
      ]}
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
            <DynamicLogo size={76} style={{ marginBottom: 14 }} />

            <Text
              style={[
                styles.brandName,
                {
                  color: authColors.textPrimary,
                },
              ]}
            >
              TallySpends
            </Text>

            <Text
              style={[
                styles.brandSubtitle,
                {
                  color: authColors.textSecondary,
                },
              ]}
            >
              Automate your budgets, track operations.
            </Text>
          </View>

          {/* Auth Mode Switcher */}
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

          {/* Form */}
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: authColors.surface,
                borderColor: authColors.border,
              },
            ]}
          >
            {/* SIGNUP FIELDS */}
            {authMode === "signup" && (
              <>
                {/* Full Name */}
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: authColors.textSecondary,
                    },
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
                    style={[
                      styles.textInput,
                      {
                        color: authColors.textPrimary,
                      },
                    ]}
                    placeholder="John Doe"
                    placeholderTextColor={authColors.placeholder}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* TallyTag */}
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: authColors.textSecondary,
                    },
                  ]}
                >
                  TallyTag
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
                  <Text
                    style={[
                      styles.atSymbol,
                      {
                        color: authColors.accent,
                      },
                    ]}
                  >
                    @
                  </Text>

                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: authColors.textPrimary,
                      },
                    ]}
                    placeholder="ebuka_99"
                    placeholderTextColor={authColors.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                    value={signupUsername}
                    onChangeText={(text) =>
                      setSignupUsername(
                        text
                          .replace(/^@+/, "")
                          .replace(/[^a-zA-Z0-9_.]/g, "")
                          .toLowerCase(),
                      )
                    }
                  />
                </View>

                <View style={styles.helperRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color={authColors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: authColors.textSecondary,
                      },
                    ]}
                  >
                    Your TallyTag must be at least 6 characters.
                  </Text>
                </View>

                {/* Phone Number */}
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: authColors.textSecondary,
                    },
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
                    style={[
                      styles.textInput,
                      {
                        color: authColors.textPrimary,
                      },
                    ]}
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

            {/* EMAIL / TALLYTAG */}
            <Text
              style={[
                styles.inputLabel,
                {
                  color: authColors.textSecondary,
                },
              ]}
            >
              {authMode === "login" ? "Email or TallyTag" : "Email Address"}
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
                name={
                  authMode === "login"
                    ? "person-circle-outline"
                    : "mail-outline"
                }
                size={18}
                color={authColors.placeholder}
                style={styles.inputIcon}
              />

              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: authColors.textPrimary,
                  },
                ]}
                placeholder={
                  authMode === "login"
                    ? "you@example.com or @tallytag"
                    : "you@example.com"
                }
                placeholderTextColor={authColors.placeholder}
                keyboardType={
                  authMode === "login" ? "default" : "email-address"
                }
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <Text
              style={[
                styles.inputLabel,
                {
                  color: authColors.textSecondary,
                },
              ]}
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
                style={[
                  styles.textInput,
                  {
                    color: authColors.textPrimary,
                  },
                ]}
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

            {/* Confirm Password */}
            {authMode === "signup" && (
              <>
                <Text
                  style={[
                    styles.inputLabel,
                    {
                      color: authColors.textSecondary,
                    },
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
                      {
                        color: authColors.textPrimary,
                      },
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
                {
                  backgroundColor: authColors.buttonBg,
                },
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
                    {
                      color: authColors.buttonText,
                    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  atSymbol: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
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

  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
    paddingLeft: 2,
  },

  helperText: {
    fontSize: 10.5,
    marginLeft: 5,
    lineHeight: 15,
  },

  actionButton: {
    height: 50,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 6,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
