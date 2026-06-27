import { StyleSheet, Text, View } from "react-native";

export default function InsightsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Financial Insights Analysis</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});
