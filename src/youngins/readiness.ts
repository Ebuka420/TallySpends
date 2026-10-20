import type { PrivacyNotice } from "./model";

// Approved notice is still unset. Do not enable from user input or an env flag.
// NIN controls were confirmed by the backend developer on October 16, not
// independently audited. Hosting-platform log review remains outstanding.
const younginsReadiness: Readonly<{
  approvedNotice: PrivacyNotice | null;
  ninSecurityConfirmed: boolean;
}> = Object.freeze({ approvedNotice: null, ninSecurityConfirmed: true });

export function requireYounginsReadiness(): PrivacyNotice {
  if (!younginsReadiness.approvedNotice || !younginsReadiness.ninSecurityConfirmed) {
    throw new Error("Youngins registration is awaiting the approved child-data privacy notice and its current version. Please try again once the notice is available.");
  }
  return younginsReadiness.approvedNotice;
}
