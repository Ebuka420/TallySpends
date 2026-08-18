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

function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const words: number[] = [];
  const asciiLength = ascii.length;
  const charSize = 8;
  
  for (let i = 0; i < asciiLength * charSize; i += charSize) {
    words[i >> 5] |= (ascii.charCodeAt(i / charSize) & 0xff) << (24 - i % 32);
  }
  
  const totalLen = asciiLength * 8;
  words[totalLen >> 5] |= 0x80 << (24 - totalLen % 32);
  words[(((totalLen + 64) >> 9) << 4) + 15] = totalLen;
  
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  
  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    while (w.length < 64) {
      const s0 = rightRotate(w[w.length - 15], 7) ^ rightRotate(w[w.length - 15], 18) ^ (w[w.length - 15] >>> 3);
      const s1 = rightRotate(w[w.length - 2], 17) ^ rightRotate(w[w.length - 2], 19) ^ (w[w.length - 2] >>> 10);
      w.push((w[w.length - 16] + s0 + w[w.length - 7] + s1) | 0);
    }
    
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    
    for (let j = 0; j < 64; j++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }
  
  const hash = [h0, h1, h2, h3, h4, h5, h6, h7].map((num) => {
    const hex = (num >>> 0).toString(16);
    return "00000000".slice(hex.length) + hex;
  }).join("");
  
  return hash;
}

export default function AuthScreen() {
  const router = useRouter();
  const { login, setUsername } = useAppStore(); // Pull the login and setUsername functions

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

    // 1. Validation
    if (!emailTrimmed || !password) {
      Alert.alert("Input Error", "Please fill in all required fields (Email and Password).");
      setIsLoading(false);
      return;
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
      // Fetch users from AsyncStorage
      const storedUsersRaw = await AsyncStorage.getItem("ts_registered_users");
      let users = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      // Seed default user if database is empty
      if (users.length === 0) {
        const demoHash = sha256("password");
        users.push({
          fullName: "Ebuka",
          phoneNumber: "+234 800 000 0000",
          email: "ebuka@example.com",
          passwordHash: demoHash,
        });
        await AsyncStorage.setItem("ts_registered_users", JSON.stringify(users));
      }

      if (authMode === "signup") {
        // Check if user already exists
        const userExists = users.some((u: any) => u.email === emailTrimmed);
        if (userExists) {
          Alert.alert("Sign Up Error", "A user with this email address already exists.");
          setIsLoading(false);
          return;
        }

        // Hash the password
        const passwordHash = sha256(password);

        // Save new user
        const newUser = {
          fullName: fullNameTrimmed,
          phoneNumber: phoneTrimmed,
          email: emailTrimmed,
          passwordHash,
        };

        users.push(newUser);
        await AsyncStorage.setItem("ts_registered_users", JSON.stringify(users));

        Alert.alert(
          "Success",
          "Your account has been created successfully! Please log in with your credentials.",
          [
            {
              text: "OK",
              onPress: () => {
                // Clear fields
                setFullName("");
                setPhoneNumber("");
                setPassword("");
                setConfirmPassword("");
                // Switch back to login page
                setAuthMode("login");
              },
            },
          ]
        );
      } else {
        // Login Flow
        const user = users.find((u: any) => u.email === emailTrimmed);
        if (!user) {
          Alert.alert("Login Error", "Invalid email address or password.");
          setIsLoading(false);
          return;
        }

        const inputHash = sha256(password);
        if (user.passwordHash !== inputHash) {
          Alert.alert("Login Error", "Invalid email address or password.");
          setIsLoading(false);
          return;
        }

        // Login success!
        await setUsername(user.fullName);
        login();
        router.replace("/(tabs)" as any);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "An unexpected error occurred. Please try again.");
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
