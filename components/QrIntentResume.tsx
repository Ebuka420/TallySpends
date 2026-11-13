import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useRootNavigationState, useRouter, type Href } from "expo-router";
import { clearQrIntent, getQrIntent, subscribeQrIntent, transferRoute } from "../src/qr/intent";
export default function QrIntentResume({ authenticated }: { authenticated: boolean }) {
  const pending = useSyncExternalStore(subscribeQrIntent, getQrIntent, () => null);
  const router = useRouter();
  const pathname = usePathname();
  const latestPath = useRef(pathname);
  latestPath.current = pathname;
  const navigation = useRootNavigationState();
  useEffect(() => {
    if (!authenticated || !navigation?.key || !pending) return;
    // Allow Router's normal native-intent navigation to settle first.
    const timer = setTimeout(() => {
      if (getQrIntent() !== pending) return;
      clearQrIntent();
      if (pending.expires < Date.now() || latestPath.current === "/transfer") return;
      router.push(transferRoute(pending.request) as Href);
    }, 50);
    return () => clearTimeout(timer);
  }, [authenticated, navigation?.key, pathname, pending, router]);
  return null;
}
