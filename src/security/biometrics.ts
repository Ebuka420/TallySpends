import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export function biometricBuildIssue(platform: string, inExpoGo: boolean): string | null {
  if (platform !== "ios" && platform !== "android") return "Biometric access is available in the iPhone and Android apps. Use your app PIN here.";
  if (platform === "ios" && inExpoGo) return "Face ID is unavailable in Expo Go on iPhone. Install a TallySpends development or TestFlight build to enable it. Your app PIN still works.";
  return null;
}

export const BIOMETRIC_BUILD_ISSUE = biometricBuildIssue(Platform.OS, Constants.executionEnvironment === ExecutionEnvironment.StoreClient);
