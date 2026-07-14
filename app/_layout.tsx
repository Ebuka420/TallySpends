import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This automatically turns off the native header for ALL pages: index, budget, expenses, analytics, etc. */}
      <Stack.Screen name="index" />
      <Stack.Screen name="budget" />
      <Stack.Screen name="expenses" />
    </Stack>
  );
}
