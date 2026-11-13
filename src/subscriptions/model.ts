export type EntitlementState = { isActive: boolean; verification: string } | null | undefined;

export function subscriptionStatus(entitlement: EntitlementState) {
  if (entitlement?.isActive && entitlement.verification === "FAILED") return "verification-failed" as const;
  return entitlement?.isActive ? "active" as const : "inactive" as const;
}
