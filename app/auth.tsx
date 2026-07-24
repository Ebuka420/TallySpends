import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAppStore(); // Pull the login function from the global store

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

    // ==========================================
    // TEMPORARY DEVELOPMENT BYPASS
    // ==========================================
    setTimeout(() => {
      setIsLoading(false);
      if (authMode === "signup") {
        login(); // Mark user as authenticated globally
        router.replace("/setup-profile" as any);
      } else {
        login(); // Mark user as authenticated globally
        router.replace("/(tabs)" as any);
      }
    }, 500);

    /*
    // REAL AUTHENTICATION LOGIC (DISABLED FOR DEV)
    if (!email || !password) {
      alert("Please fill out all required fields.");
      setIsLoading(false);
      return;
    }

    if (authMode === "signup") {
      if (!fullName || !phoneNumber) {
        alert("Please fill out your full name and phone number.");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const endpoint =
        authMode === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        authMode === "login"
          ? {
              email: email.trim().toLowerCase(),
              password: password,
            }
          : {
              fullName: fullName.trim(),
              email: email.trim().toLowerCase(),
              password: password,
              phoneNumber: phoneNumber.trim(),
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setIsLoading(false);

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

      // Flow Routing Logic
      login(); // Mark user as authenticated globally on real success too
      if (authMode === "signup") {
        router.replace("/setup-profile" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    } catch (error: any) {
      setIsLoading(false);
      alert(
        error.message || "Something went wrong. Please check your network.",
      );
    }
    */
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
