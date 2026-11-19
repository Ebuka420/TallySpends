import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import type { ThemePalette } from "../src/theme";

export function useTransferAction() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (work: () => Promise<boolean>, success: () => void) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      if (await work()) {
        success();
      } else {
        setError("This transaction was not saved. Please check the details and try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this transaction. Please try again.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return {
    busy,
    error,
    run,
  };
}

export function TransferSteps({
  theme,
  current = 1,
}: {
  theme: ThemePalette;
  current?: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingBottom: 24,
        paddingTop: 4,
      }}
    >
      {["Details", "Review", "Done"].map((label, index) => (
        <View
          key={label}
          style={{
            flex: 1,
            gap: 7,
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 4,
              backgroundColor: index < current ? theme.accent : theme.border,
            }}
          />
          <Text
            style={{
              color: index < current ? theme.accent : theme.textSecondary,
              fontSize: 10.5,
              fontWeight: "700",
            }}
          >
            {index + 1}. {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
