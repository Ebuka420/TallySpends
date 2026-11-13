export const RELATIONSHIPS = ["Mother", "Father", "Legal Guardian"] as const;
export type Relationship = typeof RELATIONSHIPS[number];
export type YounginsDraft = { firstName: string; lastName: string; dateOfBirth: string; guardianRelationship: string; nin: string };
export type FieldErrors = Partial<Record<keyof YounginsDraft, string>>;
export type YounginsProfile = {
  id: string; firstName: string; lastName: string; dateOfBirth: string;
  guardianRelationship: Relationship;
};
export type PrivacyNotice = { version: string; notice: string; guardianDeclaration: string; ninCollectionEnabled: true };
export function dateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return Number.isFinite(d.getTime()) && dateOnly(d) === value;
}
export function ageOn(dateOfBirth: string, today = dateOnly(new Date())) {
  if (!isDateOnly(dateOfBirth) || !isDateOnly(today)) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const [nowYear, nowMonth, nowDay] = today.split("-").map(Number);
  return nowYear - year - (nowMonth < month || (nowMonth === month && nowDay < day) ? 1 : 0);
}
export function validateDraft(draft: YounginsDraft, today = dateOnly(new Date()), requireNin = true): FieldErrors {
  const errors: FieldErrors = {};
  if (!draft.firstName.trim()) errors.firstName = "Enter the child's first name.";
  if (!draft.lastName.trim()) errors.lastName = "Enter the child's last name.";
  if (!isDateOnly(draft.dateOfBirth)) errors.dateOfBirth = "Select a valid date of birth.";
  else if (draft.dateOfBirth > today) errors.dateOfBirth = "Date of birth cannot be in the future.";
  else if ((ageOn(draft.dateOfBirth, today) ?? 18) >= 18) errors.dateOfBirth = "Youngins accounts are for children under 18.";
  if (!RELATIONSHIPS.includes(draft.guardianRelationship as Relationship)) errors.guardianRelationship = "Select your relationship to the child.";
  if (requireNin && !/^\d{11}$/.test(draft.nin)) errors.nin = "NIN must contain exactly 11 numeric digits.";
  return errors;
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("We couldn't confirm the Youngins profile. Please refresh your profiles.");
  return value as Record<string, unknown>;
}
function text(value: unknown): value is string { return typeof value === "string" && !!value.trim(); }
export function parseProfile(value: unknown): YounginsProfile {
  const p = record(value);
  if (typeof p.id !== "number" || !Number.isSafeInteger(p.id) || p.id <= 0 || !text(p.firstName) || !text(p.lastName) || typeof p.dateOfBirth !== "string"
    || !isDateOnly(p.dateOfBirth) || p.dateOfBirth > dateOnly(new Date()) || !RELATIONSHIPS.includes(p.guardianRelationship as Relationship)) {
    throw new Error("We couldn't confirm the Youngins profile. Please refresh your profiles.");
  }
  // Explicitly whitelist safe response fields. Never retain NIN or financial data.
  // Normalize the confirmed numeric backend ID for existing router parameters.
  // Discard ninMasked, ninVerified, consent and timestamps: the UI needs none of
  // these fields, and a declared relationship is not verified guardian authority.
  return { id: String(p.id), firstName: p.firstName, lastName: p.lastName, dateOfBirth: p.dateOfBirth,
    guardianRelationship: p.guardianRelationship as Relationship };
}
export function parseReceipt(value: unknown): YounginsProfile {
  // POST 201 and duplicate replay 200 both return the child object directly.
  return parseProfile(value);
}
export function parseList(value: unknown): YounginsProfile[] {
  // Ownership is enforced by the authenticated backend query, not an echoed ID.
  if (!Array.isArray(value)) throw new Error("We couldn't load your Youngins profiles. Please try again.");
  return value.map(p => parseProfile(p));
}
export function parseNotice(value: unknown): PrivacyNotice {
  const n = record(value);
  if (n.ninCollectionEnabled !== true || !text(n.version) || n.version.length > 20 || !text(n.notice) || !text(n.guardianDeclaration)) {
    throw new Error("Youngins registration is not ready yet. Please try again later.");
  }
  return { version: n.version, notice: n.notice, guardianDeclaration: n.guardianDeclaration, ninCollectionEnabled: true };
}
