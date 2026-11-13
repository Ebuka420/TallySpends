import type { Participant, Wallet } from "./ledger";

export type Person = Pick<
  Participant,
  "tag" | "displayName" | "avatarUri" | "userId"
>;
export const normalizeTag = (value: string) =>
  value.trim().replace(/^@/, "").toLowerCase();
export function safePhoto(value: unknown): string | undefined {
  return typeof value === "string" &&
    /^(https?:\/\/|file:\/\/|content:\/\/|ph:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(
      value,
    )
    ? value
    : undefined;
}
/** Only public display fields enter the directory. Never copy credentials/contact details. */
export function publicPerson(value: unknown): Person | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const rawTag = record.tag ?? record.tallyTag ?? record.username;
  if (typeof rawTag !== "string") return null;
  const tag = normalizeTag(rawTag);
  if (!/^[a-z0-9][a-z0-9_.-]{2,29}$/.test(tag)) return null;
  const rawName = record.displayName ?? record.fullName ?? record.name;
  const rawId = record.userId ?? record.id;
  return {
    tag,
    ...(typeof rawName === "string" && rawName.trim()
      ? { displayName: rawName.trim().slice(0, 80) }
      : {}),
    ...(typeof rawId === "number" || typeof rawId === "string"
      ? { userId: String(rawId) }
      : {}),
    ...(safePhoto(
      record.avatarUri ?? record.profileImage ?? record.profilePicture,
    )
      ? {
          avatarUri: safePhoto(
            record.avatarUri ?? record.profileImage ?? record.profilePicture,
          ),
        }
      : {}),
  };
}
export function buildPeopleDirectory(
  wallet: Wallet | null,
  localProfiles: unknown[],
  current: Person,
): Person[] {
  const people = new Map<string, Person>();
  const saved = [
    ...(wallet?.savings || []),
    ...(wallet?.circles || []),
  ].flatMap((plan) => plan.participants);
  for (const value of [...saved, ...localProfiles, current]) {
    const person = publicPerson(value);
    if (person)
      people.set(person.tag, { ...people.get(person.tag), ...person });
  }
  // A removed current-user photo must not fall back to an old saved snapshot.
  const self = publicPerson(current);
  if (self) people.set(self.tag, self);
  return [...people.values()].sort((a, b) =>
    (a.displayName || a.tag).localeCompare(b.displayName || b.tag),
  );
}
export function searchPeople(people: Person[], query: string) {
  const term = normalizeTag(query);
  return people.filter(
    (person) =>
      person.tag.includes(term) ||
      person.displayName?.toLowerCase().includes(term),
  );
}
