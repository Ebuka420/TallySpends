import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
export function useReducedMotion() {
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    }).catch(() => { if (mounted) setReduced(true); });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  return reduced;
}
