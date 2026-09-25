import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { money } from "../src/budget/ledger";
import type { ThemePalette } from "../src/theme";
import { BudgetButton, BudgetCopy, ui } from "./BudgetUI";
import { PlanningSheet } from "./PlanningUI";
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
      if (await work()) success();else setError("This transaction was not saved. Please check the details and try again.");
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
    run
  };
}
export function TransferSteps({
  theme,
  current = 1
}: {
  theme: ThemePalette;
  current?: number;
}) {
  return <View style={{
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 24,
    paddingTop: 4
  }}>
    {["Details", "Review", "Done"].map((label, index) => <View key={label} style={{
      flex: 1,
      gap: 7
    }}>
      <View style={{
        height: 3,
        borderRadius: 4,
        backgroundColor: index < current ? theme.accent : theme.border
      }} />
      <Text style={{
        color: index < current ? theme.accent : theme.textSecondary,
        fontSize: 10.5,
        fontWeight: "700"
      }}>{index + 1}. {label}</Text>
    </View>)}
  </View>;
}
export function TransferReview({
  visible,
  kind,
  amount,
  detail,
  onEdit,
  onConfirm,
  theme,
  busy,
  error
}: {
  visible: boolean;
  kind: "deposit" | "withdrawal";
  amount: number;
  detail: string;
  onEdit: () => void;
  onConfirm: () => void;
  theme: ThemePalette;
  busy: boolean;
  error: string;
}) {
  return <PlanningSheet visible={visible} title={`Review ${kind}`} theme={theme} onClose={() => {
    if (!busy) onEdit();
  }}>
    <TransferSteps theme={theme} current={2} />
    <View style={{
      alignItems: "center",
      gap: 8,
      paddingBottom: 16
    }}>
      <View style={[ui.back, {
        backgroundColor: theme.accentSoft,
        borderRadius: 22
      }]}><Ionicons name={kind === "deposit" ? "arrow-down-outline" : "arrow-up-outline"} size={23} color={theme.accent} /></View>
      <Text style={{
        color: theme.textSecondary,
        fontSize: 12
      }}>{kind === "deposit" ? "Adding to your wallet" : "Withdrawing from your wallet"}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{
        color: theme.textPrimary,
        fontSize: 36,
        fontWeight: "800",
        letterSpacing: -1
      }}>{money(Math.round(amount * 100))}</Text>
    </View>
    <View style={{
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      paddingHorizontal: 16
    }}>
      {[[kind === "deposit" ? "From" : "To", detail], ["Fee", "Free"], ["Total", money(Math.round(amount * 100))]].map(([label, value], index) => <View key={label} style={{
        flexDirection: "row",
        gap: 16,
        paddingVertical: 15,
        borderTopWidth: index ? 1 : 0,
        borderColor: theme.border
      }}>
        <Text style={{
          color: theme.textSecondary,
          fontSize: 12
        }}>{label}</Text><Text style={{
          flex: 1,
          textAlign: "right",
          color: theme.textPrimary,
          fontSize: 13,
          fontWeight: "700"
        }}>{value}</Text>
      </View>)}
    </View>
    <BudgetCopy theme={theme}>Demo wallet · this records a transaction without moving money through a bank.</BudgetCopy>
    {!!error && <BudgetCopy theme={theme} error>{error}</BudgetCopy>}
    <BudgetButton theme={theme} title={busy ? "Saving…" : `Confirm ${kind}`} disabled={busy} onPress={onConfirm} />
    <Pressable accessibilityRole="button" disabled={busy} onPress={onEdit} style={{
      alignItems: "center",
      padding: 12
    }}><Text style={{
        color: theme.accent,
        fontWeight: "700"
      }}>Edit details</Text></Pressable>
  </PlanningSheet>;
}
export function TransferSuccess({
  theme,
  amount,
  recipient,
  reference,
  onReceipt,
  onDone
}: {
  theme: ThemePalette;
  amount: number;
  recipient: string;
  reference: string;
  onReceipt: () => void;
  onDone: () => void;
}) {
  return <View style={{
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 18
  }}>
    <TransferSteps theme={theme} current={3} />
    <View style={{
      alignSelf: "center",
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6
    }}><View style={{
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: theme.accent,
        alignItems: "center",
        justifyContent: "center"
      }}><Ionicons name="checkmark" size={35} color={theme.background} /></View></View>
    <Text accessibilityLiveRegion="polite" style={{
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      textAlign: "center"
    }}>Transfer recorded</Text>
    <Text style={{
      color: theme.textSecondary,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 20
    }}>Your demo wallet has been updated.</Text>
    <View style={{
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 22,
      padding: 22,
      gap: 12,
      alignItems: "center"
    }}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{
        color: theme.textPrimary,
        fontSize: 36,
        fontWeight: "800"
      }}>{money(Math.round(amount * 100))}</Text>
      <Text style={{
        color: theme.textSecondary,
        fontSize: 13
      }}>To {recipient}</Text>
      <View style={{
        borderTopWidth: 1,
        borderColor: theme.border,
        paddingTop: 14,
        alignSelf: "stretch",
        gap: 5
      }}><Text style={{
          color: theme.textSecondary,
          fontSize: 10,
          letterSpacing: 1
        }}>REFERENCE</Text><Text selectable style={{
          color: theme.textPrimary,
          fontSize: 12
        }}>{reference}</Text></View>
    </View>
    <BudgetButton theme={theme} title="View receipt" secondary onPress={onReceipt} />
    <BudgetButton theme={theme} title="Done" onPress={onDone} />
  </View>;
}
