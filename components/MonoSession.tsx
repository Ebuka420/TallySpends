// Metro selects MonoSession.native.tsx on iOS/Android. The web bundle must
// not load Mono's native WebView implementation.
export type MonoSessionProps = {
  publicKey: string;
  customer: { name?: string; email?: string };
  onSuccess: (data: unknown) => void;
  onClose: () => void;
  onEvent: (event: string) => void;
};

export default function MonoSession(_props: MonoSessionProps) {
  return null;
}
