import { redirectQrIntent } from "../src/qr/intent";
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return redirectQrIntent(path);
}
