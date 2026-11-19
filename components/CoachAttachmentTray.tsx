import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { getInfoAsync } from "expo-file-system/legacy";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { COACH_ATTACHMENT_LIMITS, COACH_ATTACHMENT_NOTICE, MAX_COACH_ATTACHMENTS, validateCoachAttachments, type AttachmentCandidate, type CoachAttachment } from "../src/coach/attachments";
import type { ThemePalette } from "../src/theme";

export default function CoachAttachmentTray({ files, onChange, open, onClose, active, theme }: {
  files: CoachAttachment[]; onChange: (files: CoachAttachment[]) => void;
  open: boolean; onClose: () => void; active: boolean; theme: ThemePalette;
}) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraSettingsNeeded, setCameraSettingsNeeded] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  useEffect(() => { generation.current++; return () => { generation.current++; }; }, [active]);

  async function pick(kind: "camera" | "photos" | "pdf") {
    if (lock.current || !active) return;
    if (files.length >= MAX_COACH_ATTACHMENTS) { setError("Remove a file before adding another. The limit is 3."); return; }
    lock.current = true;
    setPicking(true); setError(null); setCameraSettingsNeeded(false);
    const started = generation.current;
    try {
      let candidates: AttachmentCandidate[];
      if (kind === "camera" || kind === "photos") {
        if (kind === "camera" && Platform.OS !== "web") {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (started !== generation.current) return;
          if (!permission.granted) {
            setCameraSettingsNeeded(!permission.canAskAgain);
            setError(permission.canAskAgain ? "Allow camera access to take a photo. You can also choose an existing photo."
              : "Camera access is off. Enable it in your device settings to take a photo.");
            return;
          }
        }
        const result = kind === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: .8, exif: false, base64: false })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true,
            selectionLimit: MAX_COACH_ATTACHMENTS - files.length, quality: 1, exif: false, base64: false });
        if (result.canceled) return;
        candidates = result.assets.map(asset => ({ uri: asset.uri,
          name: asset.fileName || asset.uri.split("/").pop() || "Photo",
          size: asset.fileSize ?? asset.file?.size, mimeType: asset.mimeType, type: asset.type ?? undefined }));
      } else {
        const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", multiple: true, copyToCacheDirectory: true, base64: false });
        if (result.canceled) return;
        candidates = result.assets.map(asset => ({ uri: asset.uri, name: asset.name,
          size: asset.size ?? asset.file?.size, mimeType: asset.mimeType }));
      }
      if (started !== generation.current) return;
      if (files.length + candidates.length > MAX_COACH_ATTACHMENTS) throw new Error("Attach up to 3 files at a time.");
      // Never read file contents or encode them into the text-only chat API.
      for (const candidate of candidates) {
        if (Platform.OS !== "web") {
          const info = await getInfoAsync(candidate.uri);
          candidate.size = info.exists && !info.isDirectory ? info.size : undefined;
        }
      }
      if (started !== generation.current) return;
      onChange(validateCoachAttachments(files, candidates));
      onClose();
    } catch (cause) {
      if (started === generation.current) setError(cause instanceof Error ? cause.message : "Couldn't open this file. Please try again.");
    } finally {
      lock.current = false;
      if (started === generation.current) setPicking(false);
    }
  }

  useEffect(() => { if (!active) { setPicking(false); setError(null); setCameraSettingsNeeded(false); } }, [active]);
  if (!open && !files.length) return null;
  return <View style={{ gap: 8, paddingBottom: 10 }}>
    {open && <View style={{ backgroundColor: theme.surfaceSoft, borderColor: theme.border, borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ flex: 1, color: theme.textPrimary, fontWeight: "700" }}>Add attachments</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close attachment menu" disabled={picking} onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>You can select and preview files. Sending attachments isn't available yet.</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>{COACH_ATTACHMENT_LIMITS}</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {([['camera', 'Camera', 'camera-outline'], ['photos', 'Photos', 'image-outline'], ['pdf', 'PDF files', 'document-text-outline']] as const).map(([kind, label, icon]) => <Pressable key={kind}
          accessibilityRole="button" accessibilityLabel={kind === "camera" ? "Take a photo" : `Attach ${label}`} disabled={picking} accessibilityState={{ disabled: picking }} onPress={() => void pick(kind)}
          style={{ flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 6, padding: 6, borderRadius: 12, backgroundColor: theme.surface, opacity: picking ? .5 : 1 }}>
          <Ionicons name={icon} size={20} color={theme.accent} /><Text style={{ color: theme.textPrimary, fontSize: 12 }}>{label}</Text>
        </Pressable>)}
      </View>
      {picking && <ActivityIndicator color={theme.accent} />}
      {error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.textPrimary, fontSize: 12 }}>{error}</Text>}
      {cameraSettingsNeeded && <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings().catch(() => setError("Open your device settings and allow camera access for TallySpends."))} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: theme.accent, fontWeight: "700" }}>Open camera settings</Text>
      </Pressable>}
    </View>}
    {!!files.length && <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
        {files.map((file, index) => <View key={`${file.uri}:${index}`} style={{ width: 160, padding: 9, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            {file.mimeType.startsWith("image/") ? <Image source={{ uri: file.uri }} accessibilityLabel={file.name} style={{ width: 40, height: 40, borderRadius: 7 }} />
              : <Ionicons name="document-text-outline" size={32} color={theme.accent} />}
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${file.name}`} disabled={picking} onPress={() => onChange(files.filter((_, position) => position !== index))} style={{ padding: 10 }}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
          <Text numberOfLines={1} style={{ color: theme.textPrimary, fontSize: 12 }}>{file.name}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 10 }}>{(file.size / (1024 * 1024)).toFixed(1)} MB · Not sent</Text>
        </View>)}
      </ScrollView>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.textSecondary, fontSize: 11 }}>{COACH_ATTACHMENT_NOTICE}</Text>
    </>}
  </View>;
}
