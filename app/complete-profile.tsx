import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../src/store";
import { getProfileSnapshot, loadAccountProfile } from "../src/profile/repository";
import { addressRequest, emptyAddress, type ProfileAddress } from "../src/profile/address";

export default function CompleteProfileScreen() {
  const { theme, profileAddressDetails, setProfileAddress, profileLoading, profileSaving, profileError } = useAppStore();
  const router = useRouter();
  const owner = getProfileSnapshot().scope;
  const previousOwner = useRef(owner);
  const dirty = useRef(false);
  const saving = useRef(false);
  const [address, setAddress] = useState<ProfileAddress>({ ...(profileAddressDetails || emptyAddress) });
  const [error, setError] = useState("");
  useEffect(() => {
    if (previousOwner.current !== owner) { previousOwner.current = owner; dirty.current = false; setError(""); }
    if (!dirty.current) setAddress({ ...(profileAddressDetails || emptyAddress) });
  }, [owner, profileAddressDetails]);
  useFocusEffect(useCallback(() => { void loadAccountProfile(true); }, []));
  async function saveAddress() {
    if (saving.current || profileSaving || profileLoading || !owner) return;
    saving.current = true; setError("");
    try {
      const next = addressRequest(address);
      await setProfileAddress(next);
      if (getProfileSnapshot().scope !== owner) return;
      dirty.current = false;
      setAddress({ ...(getProfileSnapshot().profile.addressDetails || next) });
      Alert.alert("Address saved", "Your address was confirmed by the profile service.");
    } catch (cause) {
      if (getProfileSnapshot().scope === owner) setError(cause instanceof Error ? cause.message : "Couldn't save your address. Please try again.");
    } finally { saving.current = false; }
  }
  const panel = { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, backgroundColor: theme.surface }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/profile")} style={{ width: 40, height: 44, justifyContent: "center" }}>
        <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
      </Pressable>
      <Text accessibilityRole="header" style={{ flex: 1, color: theme.textPrimary, fontSize: 19, fontWeight: "700" }}>Complete your profile</Text>
    </View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 36 }}>
        {profileError && <View style={panel}><Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary }}>{profileError}</Text>
          <Pressable accessibilityRole="button" disabled={profileLoading} onPress={() => void loadAccountProfile(true)}><Text style={{ color: theme.accent, fontWeight: "700" }}>Retry profile</Text></Pressable></View>}
        {([['National Identification Number (NIN)', 'Identity verification is coming soon. NIN entry is not available yet.'],
          ['Bank Verification Number (BVN)', 'BVN verification is coming soon. You do not need to enter your BVN yet.']] as const).map(([title, detail]) => <View key={title} style={panel}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Ionicons name="shield-checkmark-outline" size={22} color={theme.accent} />
            <Text style={{ color: theme.textPrimary, flex: 1, fontSize: 15, fontWeight: "700" }}>{title}</Text></View>
          <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19 }}>{detail}</Text>
          <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>Coming soon</Text>
        </View>)}
        <View style={panel}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Ionicons name="home-outline" size={22} color={theme.accent} />
            <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "700" }}>Residential address</Text></View>
          {([["line1", "Street / house address"], ["line2", "Apartment / address line 2 (optional)"], ["city", "City"], ["state", "State"], ["postalCode", "Postal code (optional)"], ["country", "Country"]] as const).map(([field, label]) => <View key={field} style={{ gap: 6 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{label}</Text>
            <TextInput accessibilityLabel={label} value={address[field]} onChangeText={value => { dirty.current = true; setAddress(previous => ({ ...previous, [field]: value })); }}
              editable={!profileSaving && !profileLoading && !!owner} autoCapitalize="words" style={{ backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 }} />
          </View>)}
          {!!error && <Text accessibilityLiveRegion="polite" style={{ color: theme.danger, fontSize: 12 }}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={profileSaving || profileLoading || !owner} onPress={() => void saveAddress()}
            style={{ alignItems: "center", backgroundColor: theme.accent, borderRadius: 12, padding: 14, opacity: profileSaving || profileLoading || !owner ? .6 : 1 }}>
            {profileSaving ? <ActivityIndicator color={theme.onAccent} /> : <Text style={{ color: theme.onAccent, fontWeight: "700" }}>Save address</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
