export const addressFields = ["line1", "line2", "city", "state", "postalCode", "country"] as const;
export type ProfileAddress = Record<typeof addressFields[number], string>;
export const emptyAddress: ProfileAddress = { line1: "", line2: "", city: "", state: "", postalCode: "", country: "" };

// Preserve field boundaries: street names can contain commas.
export function parseAddress(value: unknown): ProfileAddress | null {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)
    || !addressFields.some(field => field in value)) throw new Error("Couldn't read the address returned by the profile service.");
  const input = value as Record<string, unknown>;
  const address = { ...emptyAddress };
  for (const field of addressFields) {
    const part = input[field];
    if (part !== undefined && part !== null && typeof part !== "string") throw new Error("Couldn't read the address returned by the profile service.");
    address[field] = typeof part === "string" ? part.trim() : "";
  }
  return address;
}

export function addressRequest(value: ProfileAddress): ProfileAddress {
  const address = parseAddress(value);
  if (!address || !address.line1 || !address.city || !address.state || !address.country) {
    throw new Error("Enter your street address, city, state, and country.");
  }
  return address;
}

export function formatAddress(address: ProfileAddress): string {
  return addressFields.map(field => address[field]).filter(Boolean).join(", ");
}

export function addressMatches(actual: ProfileAddress, expected: ProfileAddress): boolean {
  return addressFields.every(field => actual[field] === expected[field]);
}
