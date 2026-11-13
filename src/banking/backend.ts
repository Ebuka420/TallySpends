import { API_URL } from "../api";

export type LinkedBankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  maskedAccountNumber?: string;
  availableBalance?: number;
  currency?: string;
  bankSlug?: string;
  bankCode?: string;
  providerId?: string;
  transactions?: { id: string; title: string; amount: number; type: string; date: string; category?: string }[];
};
export type BankSession = {
  token: string | null;
  refreshToken: string | null;
  saveTokens: (token: string, refreshToken: string) => Promise<void>;
};
export type AuthenticatedBankRequest = (path: string, init?: RequestInit) => Promise<unknown>;
export class BankRequestError extends Error {
  constructor(message: string, public readonly uncertain = false) { super(message); this.name = "BankRequestError"; }
}

export type BankBackend = {
  confirmConnection: (code: string, request: AuthenticatedBankRequest) => Promise<void>;
  listAccounts: (request: AuthenticatedBankRequest) => Promise<LinkedBankAccount[]>;
};
// No successful BankAccounts DTO was provided or documented. This is deliberately
// unset; install a decoder only after the backend owner confirms the real schema.
const bankAccountContract: Readonly<{ decode: ((result: unknown) => LinkedBankAccount[]) | null }> = Object.freeze({ decode: null });
export const bankBackend: BankBackend = {
  async confirmConnection(code, request) {
    if (!code.trim()) throw new Error("Mono did not return an authorization code.");
    const result = await request("/api/bank-accounts/link", {
      method: "POST",
      body: JSON.stringify({ monoCode: code }),
    });
    const data = result as { success?: boolean; status?: unknown } | null;
    if (data?.success === false || typeof data?.status === "string" && ["pending", "processing", "failed", "error"].includes(data.status.toLowerCase())) {
      throw new BankRequestError("Your bank connection has not been confirmed. Check your accounts before trying again.",
        typeof data?.status === "string" && ["pending", "processing"].includes(data.status.toLowerCase()));
    }
  },
  async listAccounts(request) {
    const result = await request("/api/bank-accounts");
    // An empty collection is safe to represent without knowing the non-empty DTO.
    if (Array.isArray(result) && result.length === 0) return [];
    if (!bankAccountContract.decode) throw new Error("Linked-account display is pending the backend's confirmed GET /api/bank-accounts response schema. No account details or balances have been guessed.");
    return bankAccountContract.decode(result);
  },
};
export const monoPublicKey = process.env.EXPO_PUBLIC_MONO_PUBLIC_KEY?.trim() || "";

export function getBankSetupIssue() {
  if (!monoPublicKey.startsWith("test_pk_")) return "Sandbox bank linking is temporarily unavailable. Please try again later.";
  return null;
}

export function parseLinkedAccounts(result: unknown): LinkedBankAccount[] {
  // Legacy adapter kept for reference/tests only. Production does not use this
  // proposed shape until the backend owner supplies the actual response schema.
  const records = Array.isArray(result) ? result : (result as { accounts?: unknown } | null)?.accounts;
  if (!Array.isArray(records)) throw new Error("The backend's linked-account response format needs confirmation. Please try refreshing later.");
  return records.map(record => {
    if (!record || typeof record.id !== "string" || !record.id.trim() || typeof record.bankName !== "string" || !record.bankName.trim() || typeof record.accountName !== "string" || !record.accountName.trim()) {
      throw new Error("Couldn't read your linked accounts. Please try refreshing later.");
    }
    const number = (typeof record.maskedAccountNumber === "string" ? record.maskedAccountNumber
      : typeof record.accountNumber === "string" ? record.accountNumber : "").replace(/\D/g, "").slice(-4);
    return {
      id: record.id, bankName: record.bankName, accountName: record.accountName,
      maskedAccountNumber: number ? "•••• " + number : undefined,
      // Optional, explicit fields only. Missing balances are not zero balances.
      availableBalance: typeof record.availableBalance === "number" && Number.isFinite(record.availableBalance) ? record.availableBalance : undefined,
      currency: typeof record.currency === "string" && /^[A-Z]{3}$/.test(record.currency) ? record.currency : undefined,
      bankSlug: typeof record.bankSlug === "string" ? record.bankSlug : undefined,
      bankCode: typeof record.bankCode === "string" ? record.bankCode : undefined,
      providerId: typeof record.providerId === "string" ? record.providerId : undefined,
      transactions: Array.isArray(record.transactions) && record.transactions.every((tx: any) =>
        tx && typeof tx.id === "string" && typeof tx.title === "string" && typeof tx.amount === "number" && Number.isFinite(tx.amount)
        && tx.amount >= 0 && ["income", "expense"].includes(tx.type) && typeof tx.date === "string" && Number.isFinite(Date.parse(tx.date)))
        ? record.transactions.map((tx: any) => ({ id: tx.id, title: tx.title, amount: tx.amount, type: tx.type, date: tx.date,
          ...(typeof tx.category === "string" ? { category: tx.category } : {}) })) : undefined,
    };
  });
}

export function getMonoAuthCode(data: unknown): string {
  const payload = data as { getAuthCode?: () => unknown; code?: unknown } | null;
  let code: unknown;
  try { code = typeof payload?.getAuthCode === "function" ? payload.getAuthCode() : payload?.code; }
  catch { throw new Error("Mono did not return an authorization code. Please try linking again."); }
  if (typeof code !== "string" || !code.trim()) {
    throw new Error("Mono did not return an authorization code. Please try linking again.");
  }
  return code;
}

export function createBankRequest(session: BankSession, signal: AbortSignal, send: typeof fetch = fetch): AuthenticatedBankRequest {
  let token = session.token;
  let refreshAttempted = false;
  async function refresh() {
    if (refreshAttempted || !session.refreshToken) return false;
    refreshAttempted = true;
    const response = await send(API_URL + "/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
      signal,
      redirect: "error",
    });
    if (!response.ok) return false;
    const data = await response.json();
    const nextToken = data?.accessToken || data?.token;
    if (typeof nextToken !== "string" || !nextToken.trim()) return false;
    token = nextToken;
    await session.saveTokens(nextToken, data.refreshToken || session.refreshToken);
    return true;
  }
  return async (path, init = {}) => {
    // Authorization codes and bearer tokens may only go to our own API.
    const method = (init.method || "GET").toUpperCase();
    const allowed = method === "GET" && ["/api/bank-accounts", "/api/accounts/me", "/api/transactions"].includes(path)
      || method === "POST" && ["/api/bank-accounts/link", "/api/sms/import"].includes(path);
    if (!API_URL.startsWith("https://") || !allowed) {
      throw new Error("Invalid bank backend path.");
    }
    if (!token) {
      let refreshed = false;
      try { refreshed = await refresh(); } catch { /* Never surface auth responses. */ }
      if (!refreshed) throw new BankRequestError("Sign in again to link your bank account.");
    }
    const request = () => {
      const headers = new Headers(init.headers);
      headers.set("Authorization", "Bearer " + token);
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      return send(API_URL + path, { ...init, headers, signal, cache: "no-store", redirect: "error" });
    };
    let response;
    try { response = await request(); if (response.status === 401 && await refresh()) response = await request(); }
    catch { throw new BankRequestError(signal.aborted
      ? "The bank request timed out or was cancelled. Check your accounts before linking again."
      : "Couldn't connect to the bank service. Check your connection and try again.", method === "POST"); }
    if (!response.ok) {
      throw new BankRequestError(response.status === 401
        ? "Your session has expired. Sign in again to continue."
        : response.status === 404 && path === "/api/sms/import"
          ? "SMS import is temporarily unavailable. Eligible alerts remain queued for retry."
        : response.status === 404
          ? "Bank linking is temporarily unavailable. Please try again later."
        : (response.status === 400 || response.status === 422) && path === "/api/sms/import" ? "The backend rejected the SMS batch. Eligible alerts remain queued for retry."
        : response.status === 400 || response.status === 422 ? "Mono authorization was rejected. The code may have expired; complete bank authorization again."
        : response.status === 409 && path === "/api/sms/import" ? "The backend could not process this SMS batch. Eligible alerts remain queued for retry."
        : response.status === 409 ? "This bank connection may already exist. Refresh your linked accounts before linking again."
        : response.status === 429 ? "Too many bank requests. Please wait before trying again."
        : "The bank service could not complete the request. Please try again.", method === "POST" && (response.status >= 500 || response.status === 409));
    }
    if (response.status === 202) throw new BankRequestError("Your bank connection is still being processed. Check your accounts before linking again.", method === "POST");
    if (response.status !== 200) throw new BankRequestError("The backend hasn't confirmed this bank request. Refresh your accounts before trying again.", method === "POST");
    let text: string;
    try { text = await response.text(); }
    catch { throw new BankRequestError("Couldn't read the bank service response. Check your accounts before linking again.", method === "POST"); }
    if (!text.trim()) return null;
    try { return JSON.parse(text); }
    catch { throw new BankRequestError("The bank service returned an unexpected response. Please check your accounts.", method === "POST"); }
  };
}
