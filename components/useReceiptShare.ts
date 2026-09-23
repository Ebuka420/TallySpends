import * as Sharing from "expo-sharing";
import { useRef, useState } from "react";
import { Alert, View } from "react-native";
import { captureRef } from "react-native-view-shot";

export function useReceiptShare() {
  const receiptRef = useRef<View>(null);
  const sharingLock = useRef(false);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (!receiptRef.current || sharingLock.current) return;
    sharingLock.current = true;
    setSharing(true);
    try {
      if (!(await Sharing.isAvailableAsync())) { Alert.alert("Sharing unavailable", "Receipt sharing is not supported on this device."); return; }
      const uri = await captureRef(receiptRef.current, { format: "png", quality: 1, result: "tmpfile", width: 1080 });
      await Sharing.shareAsync(uri, { dialogTitle: "Share TallySpends receipt", mimeType: "image/png", UTI: "public.png" });
    } catch { Alert.alert("Could not share receipt", "Please try again."); }
    finally { sharingLock.current = false; setSharing(false); }
  };
  return { receiptRef, sharing, share };
}
