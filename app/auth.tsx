import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppStore } from "../src/store";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AuthScreen() {
  const router = useRouter();
  const {
    login,
    setUsername,
    setProfileFullName,
    setProfilePhoneNumber,
    setProfileEmail,
    setProfileTallyTag,
  } = useAppStore();

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

    // 1. Development Bypass (if fields are empty)
    if (!emailTrimmed || !password) {
      if (authMode === "login") {
        await setUsername("Ebuka");
        await setProfileFullName("Ebuka");
        await setProfilePhoneNumber("+234 814 622 4577");
        await setProfileEmail("ebuka@example.com");
        await setProfileTallyTag("@EBUKA");
        login();
        router.replace("/(tabs)" as any);
        setIsLoading(false);
        return;
      } else {
        Alert.alert(
          "Success (Dev Bypass)",
          "Demo account created successfully! Please click Welcome Back to log in.",
          [
            {
              text: "OK",
              onPress: () => {
                setAuthMode("login");
              },
            },
          ]
        );
        setIsLoading(false);
        return;
      }
    }

    if (authMode === "signup") {
      if (!fullNameTrimmed || !phoneTrimmed) {
        Alert.alert("Input Error", "Please fill in your Full Name and Phone Number.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match. Please verify your passwords.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const baseUrl = API_URL || "http://localhost:5000";

      const payload =
        authMode === "login"
          ? {
              email: emailTrimmed,
              password: password,
            }
          : {
              fullName: fullNameTrimmed,
              email: emailTrimmed,
              password: password,
              phoneNumber: phoneTrimmed,
            };

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data: any = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error("Server returned an invalid response format.");
        }
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
          ]
        );
      } else {
        // Login Flow
        const loggedInName = data.user?.fullName || emailTrimmed.split("@")[0];
        const loggedInPhone = data.user?.phoneNumber || "";
        const loggedInEmail = data.user?.email || emailTrimmed;

        await setUsername(loggedInName);
        await setProfileFullName(loggedInName);
        await setProfilePhoneNumber(loggedInPhone);
        await setProfileEmail(loggedInEmail);
        await setProfileTallyTag("@" + loggedInName.replace(/\s+/g, "").toUpperCase());

        login();
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      Alert.alert(
        "Authentication Error",
        error.message || "Something went wrong. Please check your network connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* App Logo & Branding Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="wallet" size={36} color="#20142A" />
            </View>
            <Text style={styles.brandName}>TallySpends</Text>
            <Text style={styles.brandSubtitle}>
              Automate your budgets, track operations.
            </Text>
          </View>

          {/* Auth Mode Switcher Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "login" && styles.activeTabButton,
              ]}
              onPress={() => setAuthMode("login")}
            >
              <Text
                style={[
                  styles.tabText,
                  authMode === "login" && styles.activeTabText,
                ]}
              >
                Log In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === "signup" && styles.activeTabButton,
              ]}
              onPress={() => setAuthMode("signup")}
            >
              <Text
                style={[
                  styles.tabText,
                  authMode === "signup" && styles.activeTabText,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields Container */}
          <View style={styles.formContainer}>
            {/* Full Name & Phone Number (Sign Up Only) */}
            {authMode === "signup" && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+234 800 000 0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </>
            )}

            {/* Email Field Input */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field Input */}
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
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
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {authMode === "signup" && (
              <>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
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
                isLoading && styles.actionButtonDisabled,
              ]}
              onPress={handleAuthAction}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  {authMode === "login" ? "Welcome Back" : "Create Account"}
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
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 18,
    backgroundColor: "#F3F0F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  brandName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#20142A",
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  eyeIcon: {
    padding: 4,
  },
  actionButton: {
    backgroundColor: "#20142A",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#20142A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
