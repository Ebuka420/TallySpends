export type PaymentRequest = { paymentId: string; amount?: string; memo?: string };
export type PaymentIdentity = { publicPaymentId: string; fullName: string; tallyTag: string };
export const validPaymentId = (value: unknown): value is string => typeof value === "string" && (/^[A-Za-z0-9_-]{16,128}$/.test(value) || /^user_[1-9]\d{0,15}$/.test(value));
// Only consume the existing authenticated profile owner scope. Never derive an
// identity from email, a username, an account number, or decoded token claims.
export function accountQrIdentity(scope: string | null, fullName: string, tallyTag: string): PaymentIdentity | null {
  if (!scope?.startsWith("id:")) return null;
  const id = scope.slice(3);
  const publicPaymentId = /^[1-9]\d{0,15}$/.test(id) ? "user_" + id : id;
  if (!validPaymentId(publicPaymentId)) return null;
  return { publicPaymentId, fullName, tallyTag: tallyTag.replace(/^@+/, "") };
}
export function validAmount(value: string) {
  return /^\d{1,10}(\.\d{1,2})?$/.test(value) && Number(value) > 0 && Number.isFinite(Number(value));
}
export function validateRequest(request: PaymentRequest): PaymentRequest {
  if (!validPaymentId(request.paymentId)) throw new Error("This QR code does not contain a valid TallySpends payment ID.");
  if (request.amount !== undefined && !validAmount(request.amount)) throw new Error("The requested amount must be positive with no more than two decimal places.");
  if (request.memo !== undefined && (request.memo.length > 40 || /[\u0000-\u001f\u007f]/.test(request.memo))) throw new Error("The request note must be at most 40 characters and contain no control characters.");
  return { paymentId: request.paymentId, ...(request.amount ? { amount: request.amount } : {}), ...(request.memo ? { memo: request.memo } : {}) };
}
export function buildQrLink(request: PaymentRequest) {
  const value = validateRequest(request);
  return `tallyspends://transfer?v=1&paymentId=${encodeURIComponent(value.paymentId)}`
    + (value.amount ? `&amount=${encodeURIComponent(value.amount)}` : "")
    + (value.memo ? `&memo=${encodeURIComponent(value.memo)}` : "");
}
export function parseQrLink(data: string): PaymentRequest {
  if (typeof data !== "string" || data.length > 1024) throw new Error("This is not a supported TallySpends payment QR code.");
  let url: URL;
  try { url = new URL(data); } catch { throw new Error("This is not a supported TallySpends payment QR code."); }
  const route = url.hostname === "transfer" && (url.pathname === "" || url.pathname === "/")
    || url.hostname === "" && url.pathname === "/transfer";
  if (url.protocol !== "tallyspends:" || !route || url.username || url.password || url.port || url.hash) throw new Error("Scan a TallySpends payment QR code.");
  const params = url.searchParams;
  const names = ["v", "paymentId", "amount", "memo"];
  params.forEach((_, key) => { if (!names.includes(key) || params.getAll(key).length !== 1) throw new Error("This payment QR code contains invalid fields."); });
  if (params.get("v") !== "1") throw new Error("This payment QR version is not supported. Ask for a new QR code.");
  return validateRequest({ paymentId: params.get("paymentId") || "", ...(params.has("amount") ? { amount: params.get("amount")! } : {}), ...(params.has("memo") ? { memo: params.get("memo")! } : {}) });
}
export function parseIdentity(data: unknown): PaymentIdentity {
  const value = data as Partial<PaymentIdentity> | null;
  if (!value || !validPaymentId(value.publicPaymentId)) {
    throw new Error("Your account's QR identity is missing or invalid. Sign in again to reload your account ID. If it is still unavailable, the backend must provide a stable user ID or publicPaymentId and confirm its profile response.");
  }
  return { publicPaymentId: value.publicPaymentId,
    fullName: typeof value.fullName === "string" ? value.fullName.trim() : "",
    tallyTag: typeof value.tallyTag === "string" && /^@?[A-Za-z0-9_.-]{1,64}$/.test(value.tallyTag) ? value.tallyTag.replace(/^@/, "") : "" };
}
export function parseRecipient(data: unknown, requestedId: string): PaymentIdentity {
  const value = parseIdentity(data);
  if (!value.fullName || !value.tallyTag) throw new Error("The backend did not return a verified recipient name and TallyTag. Recipient lookup must be configured before this request can be used.");
  if (value.publicPaymentId !== requestedId) throw new Error("We couldn't verify this recipient. Please scan again.");
  return value;
}
