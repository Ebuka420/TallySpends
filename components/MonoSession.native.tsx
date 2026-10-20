import { MonoProvider, useMonoConnect } from "@mono.co/connect-react-native";
import { useEffect, useRef } from "react";
import type { MonoSessionProps } from "./MonoSession";

function OpenConnect({ onError }: { onError: () => void }) {
  const { init } = useMonoConnect();
  const open = useRef(init);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try { open.current(); }
    catch { onError(); }
  }, []);
  return null;
}

export default function MonoSession({ publicKey, customer, onSuccess, onClose, onEvent }: MonoSessionProps) {
  return (
    <MonoProvider publicKey={publicKey} scope="auth" data={{ customer }}
      onSuccess={onSuccess} onClose={onClose} onEvent={onEvent}>
      <OpenConnect onError={() => onEvent("ERROR")} />
    </MonoProvider>
  );
}
