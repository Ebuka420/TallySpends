import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import React, { forwardRef, useRef, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import { reportMoney, reportText, type AnalyticsReport } from "../src/analytics/report";
import type { ThemePalette } from "../src/theme";
type ReportLook = "signature" | "paper";
const ink = "#352333",
  muted = "#857680",
  paper = "#FCFAF6",
  line = "#E9E1DF";
const categoryColors = ["#6C4863", "#A7BAA2", "#DBA877", "#DCD4DF"];
export function AnalyticsReportSheet({
  visible,
  onClose,
  report,
  theme,
  dark,
  ready
}: {
  visible: boolean;
  onClose: () => void;
  report: AnalyticsReport;
  theme: ThemePalette;
  dark: boolean;
  ready: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [look, setLook] = useState<ReportLook>("signature");
  const [busy, setBusy] = useState(false);
  const [measured, setMeasured] = useState(false);
  const locked = useRef(false);
  const card = useRef<View>(null);
  const close = () => {
    if (!locked.current) onClose();
  };
  const share = async (asText = false) => {
    if (locked.current || !ready || !measured) return;
    locked.current = true;
    setBusy(true);
    let uri: string | undefined;
    try {
      const title = `TallySpends · ${report.range.label}`;
      if (asText) {
        await Share.share({
          title,
          message: reportText(report)
        });
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Image sharing unavailable", "You can still share the text version of this report.", [{
          text: "OK"
        }]);
        return;
      }
      if (!card.current) throw new Error("Report not ready");
      uri = await captureRef(card.current, {
        format: "png",
        quality: 1,
        width: 1200,
        result: "tmpfile"
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: title,
        mimeType: "image/png",
        UTI: "public.png"
      });
    } catch {
      Alert.alert("Couldn't share your report", "Please try again, or choose Share as text.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
    <View style={[s.overlay, {
      paddingTop: insets.top + 10
    }]}>
      <Pressable onPress={close} accessibilityLabel="Close report preview" style={StyleSheet.absoluteFill} />
      <View accessibilityViewIsModal style={[s.sheet, {
        backgroundColor: theme.background,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <View style={[s.handle, {
          backgroundColor: theme.border
        }]} />
        <View style={s.header}><View style={{
            flex: 1
          }}><Text style={[s.sheetTitle, {
              color: theme.textPrimary
            }]}>A report worth sharing.</Text><Text style={[s.sheetSubtitle, {
              color: theme.textSecondary
            }]}>{report.range.label}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close report" disabled={busy} onPress={close} style={[s.close, {
            backgroundColor: theme.surfaceSoft
          }]}><Ionicons name="close" size={21} color={theme.textPrimary} /></Pressable></View>
        <View style={s.looks}><Text style={{
            color: theme.textSecondary,
            fontSize: 11,
            marginRight: 4
          }}>Make it yours</Text>{(["signature", "paper"] as const).map(value => <Pressable key={value} disabled={busy} accessibilityRole="radio" accessibilityState={{
            checked: look === value
          }} onPress={() => setLook(value)} style={[s.look, {
            borderColor: look === value ? theme.accent : theme.border,
            backgroundColor: theme.surface
          }]}><View style={[s.swatch, {
              backgroundColor: value === "signature" ? ink : "#E5D9CB"
            }]} /><Text style={{
              color: theme.textPrimary,
              fontSize: 11,
              fontWeight: "600"
            }}>{value === "signature" ? "Signature" : "Paper"}</Text>{look === value && <Ionicons name="checkmark" size={12} color={theme.accent} />}</Pressable>)}</View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.preview}>
          <ReportCard ref={card} report={report} look={look} onLayout={() => setMeasured(true)} />
        </ScrollView>
        <View style={[s.actions, {
          borderColor: theme.border
        }]}>
          {!ready && <Text style={{
            color: theme.textSecondary,
            fontSize: 11,
            textAlign: "center",
            marginBottom: 8
          }}>Your transactions need to finish loading before sharing.</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel="Share report image" onPress={() => share()} disabled={busy || !ready || !measured} style={[s.shareButton, {
            backgroundColor: theme.accent,
            opacity: busy || !ready || !measured ? .5 : 1
          }]}>{busy ? <ActivityIndicator color={dark ? theme.background : "#FFFFFF"} /> : <Ionicons name="share-outline" size={18} color={dark ? theme.background : "#FFFFFF"} />}<Text style={{
              color: dark ? theme.background : "#FFFFFF",
              fontSize: 14,
              fontWeight: "700"
            }}>{busy ? "Preparing report…" : "Share report"}</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy || !ready || !measured} onPress={() => share(true)} style={s.textShare}><Text style={{
              color: theme.accent,
              fontSize: 12,
              fontWeight: "600"
            }}>Share as text</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}
const ReportCard = forwardRef<View, {
  report: AnalyticsReport;
  look: ReportLook;
  onLayout: () => void;
}>(function ReportCard({
  report,
  look,
  onLayout
}, ref) {
  const signature = look === "signature";
  const heroInk = signature ? "#FFF9F4" : ink;
  const heroMuted = signature ? "#D9C9D3" : muted;
  const max = Math.max(1, ...report.chart.map(point => point.amount));
  return <View ref={ref} collapsable={false} onLayout={onLayout} style={s.report}>
    <View style={[s.hero, {
      backgroundColor: signature ? ink : "#F0E9E1"
    }]}>
      <Svg pointerEvents="none" width={220} height={220} style={s.orbit}><Circle cx={145} cy={95} r={58} fill="none" stroke={signature ? "#82607A" : "#D7C8BA"} strokeWidth={1} /><Circle cx={145} cy={95} r={88} fill="none" stroke={signature ? "#82607A" : "#D7C8BA"} strokeWidth={1} /><Circle cx={145} cy={95} r={118} fill="none" stroke={signature ? "#82607A" : "#D7C8BA"} strokeWidth={1} /></Svg>
      <View style={s.brandRow}><View style={s.brand}><Ionicons name="wallet-outline" color={heroInk} size={14} /><Text style={[s.brandText, {
            color: heroInk
          }]}>TALLYSPENDS</Text></View><Text style={[s.edition, {
          color: heroMuted
        }]}>{report.range.edition}</Text></View>
      <Text style={[s.reportTitle, {
        color: heroInk
      }]}>{report.range.heading},{"\n"}in focus.</Text>
      <Text style={[s.range, {
        color: heroMuted
      }]}>{report.range.label}</Text>
      <View style={[s.heroRule, {
        backgroundColor: signature ? "#685064" : "#D9CCBF"
      }]} />
      <Text style={[s.caption, {
        color: heroMuted
      }]}>TOTAL MONEY OUT</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={[s.heroAmount, {
        color: heroInk
      }]}>{reportMoney(report.spent)}</Text>
      <View style={s.heroBottom}><Text style={[s.heroNote, {
          color: heroMuted
        }]}>{report.expenseCount} {report.expenseCount === 1 ? "expense" : "expenses"} recorded</Text><Ionicons name="arrow-up-outline" size={19} color={heroMuted} style={{
          transform: [{
            rotate: "45deg"
          }]
        }} /></View>
    </View>
    <View style={s.reportBody}>
      <View style={s.metrics}><View style={s.metric}><Text style={s.metricLabel}>MONEY IN</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.metricValue}>{reportMoney(report.income)}</Text><Text style={s.metricNote}>Recorded income</Text></View><View style={s.metricDivider} /><View style={s.metric}><Text style={s.metricLabel}>NET FLOW</Text><Text numberOfLines={1} adjustsFontSizeToFit style={s.metricValue}>{reportMoney(report.net)}</Text><Text style={s.metricNote}>Income minus spending</Text></View></View>
      <View style={s.sectionHeading}><Text style={s.sectionTitle}>The spending rhythm</Text><Text style={s.sectionMeta}>{report.range.timeframe === "weekly" ? "BY DAY" : report.range.timeframe === "yearly" ? "BY MONTH" : "BY WEEK"}</Text></View>
      <View style={s.chart}>{report.chart.map((point, index) => <View key={index} style={s.chartColumn}><View style={s.barTrack}><View style={{
              height: point.amount ? `${Math.max(3, point.amount / max * 100)}%` : 2,
              width: "100%",
              maxWidth: 37,
              borderTopLeftRadius: 5,
              borderTopRightRadius: 5,
              backgroundColor: point.amount === max ? "#6C4863" : point.amount ? "#C5B5C5" : line
            }} /></View><Text style={s.barLabel}>{report.chart.length > 10 ? point.label.charAt(0) : point.label}</Text></View>)}</View>
      <View style={s.sectionHeading}><Text style={s.sectionTitle}>Where it went</Text><Text style={s.sectionMeta}>SHARE OF SPENDING</Text></View>
      {report.breakdown.length ? <><View style={s.categoryBand}>{report.breakdown.map((category, index) => <View key={index} style={{
            flex: category.share,
            backgroundColor: categoryColors[index]
          }} />)}</View>{report.breakdown.map((category, index) => <View key={index} style={s.categoryRow}><View style={[s.categoryDot, {
            backgroundColor: categoryColors[index]
          }]} /><Text numberOfLines={1} style={s.categoryName}>{category.name}</Text><Text style={s.categoryAmount}>{reportMoney(category.amount)}</Text><Text style={s.categoryPercent}>{Math.round(category.share * 100)}%</Text></View>)}</> : <Text style={s.noSpending}>No spending recorded for this period.</Text>}
      <View style={s.takeaway}><Ionicons name="sparkles-outline" size={18} color="#6C4863" /><View style={{
          flex: 1
        }}><Text style={s.takeawayLabel}>THE TAKEAWAY</Text><Text style={s.takeawayText}>{report.takeaway}</Text></View></View>
      <View style={s.reportFooter}><Text style={s.footerTag}>Your money. Your story.</Text><Text style={s.footerCount}>{report.count} {report.count === 1 ? "transaction" : "transactions"}</Text></View>
    </View>
  </View>;
});
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,9,18,.5)"
  },
  sheet: {
    maxHeight: "96%",
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 18
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -.6
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 5
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  looks: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    paddingHorizontal: 22,
    paddingVertical: 17
  },
  look: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 11
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  preview: {
    paddingHorizontal: 20,
    paddingBottom: 22
  },
  actions: {
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: 1
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 15,
    borderRadius: 24
  },
  textShare: {
    paddingTop: 14,
    paddingBottom: 2,
    alignItems: "center"
  },
  report: {
    backgroundColor: paper,
    borderRadius: 23,
    overflow: "hidden",
    width: "100%"
  },
  hero: {
    padding: 22,
    overflow: "hidden"
  },
  orbit: {
    position: "absolute",
    right: -57,
    top: 31,
    opacity: .55
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  brandText: {
    fontSize: 8.5,
    fontWeight: "800",
    letterSpacing: 1.4
  },
  edition: {
    fontSize: 7,
    letterSpacing: 1
  },
  reportTitle: {
    fontSize: 33,
    lineHeight: 38,
    letterSpacing: -1.3,
    fontWeight: "700",
    marginTop: 28
  },
  range: {
    fontSize: 10,
    marginTop: 10
  },
  heroRule: {
    height: 1,
    marginVertical: 20
  },
  caption: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: "600"
  },
  heroAmount: {
    fontSize: 37,
    fontWeight: "600",
    letterSpacing: -1.4,
    marginTop: 7
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 9
  },
  heroNote: {
    fontSize: 10
  },
  reportBody: {
    padding: 20
  },
  metrics: {
    flexDirection: "row",
    gap: 16,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderColor: line
  },
  metric: {
    flex: 1
  },
  metricDivider: {
    width: 1,
    backgroundColor: line
  },
  metricLabel: {
    color: muted,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: "600"
  },
  metricValue: {
    color: ink,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -.5,
    marginTop: 8
  },
  metricNote: {
    color: muted,
    fontSize: 8,
    marginTop: 5
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 22,
    marginBottom: 13
  },
  sectionTitle: {
    fontSize: 12,
    color: ink,
    fontWeight: "700",
    letterSpacing: -.2
  },
  sectionMeta: {
    fontSize: 6.5,
    letterSpacing: .8,
    color: muted
  },
  chart: {
    flexDirection: "row",
    gap: 7,
    paddingTop: 2
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    gap: 7
  },
  barTrack: {
    height: 58,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderColor: line
  },
  barLabel: {
    color: muted,
    fontSize: 8
  },
  categoryBand: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
    marginBottom: 13
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7
  },
  categoryDot: {
    height: 6,
    width: 6,
    borderRadius: 3
  },
  categoryName: {
    flex: 1,
    color: ink,
    fontSize: 10
  },
  categoryAmount: {
    color: ink,
    fontSize: 10,
    fontWeight: "600"
  },
  categoryPercent: {
    color: muted,
    width: 29,
    fontSize: 9,
    textAlign: "right"
  },
  noSpending: {
    fontSize: 11,
    color: muted,
    paddingVertical: 8
  },
  takeaway: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 15,
    padding: 14,
    backgroundColor: "#F0EBEE",
    marginTop: 19
  },
  takeawayLabel: {
    color: "#6C4863",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1
  },
  takeawayText: {
    color: ink,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6
  },
  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 19,
    alignItems: "center"
  },
  footerTag: {
    color: "#6C4863",
    fontSize: 9,
    fontWeight: "600"
  },
  footerCount: {
    color: muted,
    fontSize: 8
  }
});
