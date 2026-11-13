import { buildQrLink, parseQrLink, type PaymentRequest } from "./model";
let pending: { request: PaymentRequest; expires: number } | null = null;
const listeners = new Set<() => void>();
export const subscribeQrIntent = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getQrIntent = () => pending;
export function clearQrIntent() { pending = null; listeners.forEach(fn => fn()); }
export function transferRoute(request: PaymentRequest) { return "/transfer?" + buildQrLink(request).split("?")[1]; }
export function redirectQrIntent(path: string) {
  if (/^exps?:\/\//.test(path)) {
    try {
      const url = new URL(path);
      if ((url.pathname === "/--/transfer" || url.pathname === "/transfer") && url.search) path = "/transfer" + url.search;
    } catch { return path; }
  }
  const isQrPath = /^tallyspends:\/\/(?:transfer(?:\/)?|\/transfer)\?/.test(path) || /^\/transfer\?/.test(path);
  if (!isQrPath) return path;
  try {
    const request = parseQrLink(path.startsWith("/") ? "tallyspends://" + path : path);
    pending = { request, expires: Date.now() + 10 * 60 * 1000 };
    listeners.forEach(fn => fn());
    return transferRoute(request);
  } catch { clearQrIntent(); return "/transfer?qrError=invalid"; }
}
