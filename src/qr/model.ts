export type PaymentRequest = { paymentId: string; amount?: string; memo?: string };
export type PaymentIdentity = { publicPaymentId: string; fullName: string; tallyTag: string };
export const validPaymentId = (value: unknown): value is string => typeof value === "string" && /^TSP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value);
export function normalizePaymentId(value: string): string {
  const clean = value.replace(/[\s-]/g, "").toUpperCase();
  if (!/^TSP[A-Z0-9]{8}$/.test(clean)) throw new Error("Enter a payment ID in the form TSP-XXXX-XXXX.");
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7)}`;
}
// Use only the backend-issued paymentId; user IDs and TallyTags are not payment IDs.
export function accountQrIdentity(paymentId: string | null | undefined, fullName: string, tallyTag: string): PaymentIdentity | null {
  return validPaymentId(paymentId) ? { publicPaymentId: paymentId, fullName, tallyTag: tallyTag.replace(/^@+/, "") } : null;
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
  const value = data as { paymentId?: unknown; fullName?: unknown; tallyTag?: unknown } | null;
  if (!value || !validPaymentId(value.paymentId)) {
    throw new Error("Your account's QR identity is missing or invalid. Refresh your profile to check whether a payment ID is available.");
  }
  return { publicPaymentId: value.paymentId,
    fullName: typeof value.fullName === "string" ? value.fullName.trim() : "",
    tallyTag: typeof value.tallyTag === "string" && /^@?[A-Za-z0-9_.-]{1,64}$/.test(value.tallyTag) ? value.tallyTag.replace(/^@/, "") : "" };
}
export function parseRecipient(data: unknown, requestedId?: string): PaymentIdentity {
  const input = data as { paymentId?: unknown; displayName?: unknown; tallyTag?: unknown; isSelf?: unknown } | null;
  if (input?.isSelf === true) throw new Error("You cannot send money to yourself.");
  if (input?.isSelf !== false) throw new Error("The backend did not return a verified recipient.");
  const value = parseIdentity({ ...input, fullName: input.displayName });
  if (!value.fullName) throw new Error("The backend did not return a verified recipient name.");
  if (requestedId && value.publicPaymentId !== requestedId) throw new Error("We couldn't verify this recipient. Please scan again.");
  return value;
}
