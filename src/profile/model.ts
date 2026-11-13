export type Profile = {
  fullName: string; phoneNumber: string; email: string; tallyTag: string;
  avatarUrl: string | null; gender: string; dob: string; address: string;
};
export const emptyProfile: Profile = { fullName: "", phoneNumber: "", email: "", tallyTag: "", avatarUrl: null, gender: "", dob: "", address: "" };
export type ProfileUser = { userId?: number | string; fullName?: string; email?: string; tallyTag?: string; phoneNumber?: string; avatarUrl?: string | null };
export function profileScope(user: ProfileUser | null): string | null {
  if (user?.userId !== undefined && String(user.userId).trim()) return "id:" + String(user.userId);
  return typeof user?.email === "string" && user.email.trim() ? "email:" + user.email.trim().toLowerCase() : null;
}
export function parseProfile(value: unknown): Partial<Profile> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Couldn't read your profile. Please try again.");
  const input = value as Record<string, unknown>;
  if (!["fullName", "email", "tallyTag", "phoneNumber", "avatarUrl"].some(key => key in input)) throw new Error("The backend profile response needs to be confirmed. Please try again later.");
  const result: Partial<Profile> = {};
  for (const key of ["fullName", "email", "phoneNumber"] as const) if (typeof input[key] === "string") result[key] = input[key];
  if (typeof input.tallyTag === "string") result.tallyTag = input.tallyTag.replace(/^@+/, "").trim();
  if (input.avatarUrl === null || input.avatarUrl === "") result.avatarUrl = null;
  else if (typeof input.avatarUrl === "string") {
    try { const url = new URL(input.avatarUrl); if (url.protocol !== "https:" || url.username || url.password) throw new Error(); result.avatarUrl = url.href; }
    catch { throw new Error("The backend returned an invalid profile photo URL."); }
  }
  return result;
}
export function cachedProfile(value: unknown): Profile {
  const result = { ...emptyProfile };
  if (!value || typeof value !== "object") return result;
  // Earlier caches also contained device-only preferences. Never present those
  // as synchronized profile data; only hydrate fields handled by the API adapter.
  for (const key of ["fullName", "phoneNumber", "email", "tallyTag", "avatarUrl"] as const) {
    const field = (value as Record<string, unknown>)[key];
    if (key === "avatarUrl") {
      if (typeof field === "string" && field.startsWith("https://")) result.avatarUrl = field;
    } else if (typeof field === "string") result[key] = field;
  }
  return result;
}
