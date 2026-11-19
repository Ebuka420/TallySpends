import type { AjoCircle } from "./ledger";
import type { Person } from "./people";

export function tallyTag(value: string) {
  const tag = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9][a-z0-9_.-]{2,29}$/.test(tag))
    throw new Error(
      "Use a TallyTag of 3–30 letters, numbers, dots, hyphens or underscores.",
    );
  return tag;
}
export type PlanCommand =
  | {
      type: "create-savings";
      name: string;
      kind: "personal" | "joint";
      target: number;
      initial: number;
      unlockDate: string;
      owner: string;
      tags: string[];
      profiles?: Person[];
    }
  | { type: "save"; id: string; amount: number }
  | { type: "release-savings"; id: string }
  | { type: "archive-savings"; id: string }
  | {
      type: "create-ajo";
      name: string;
      amount: number;
      frequency: AjoCircle["frequency"];
      firstDate: string;
      owner: string;
      tags: string[];
      profiles?: Person[];
    }
  | {
      type: "record-ajo-contribution";
      id: string;
      tag: string;
      paidOn: string;
      reference?: string;
    }
  | { type: "undo-ajo-contribution"; id: string; tag: string }
  | {
      type: "record-ajo-payout";
      id: string;
      paidOn: string;
      reference?: string;
    }
  | {
      type: "record-membership";
      id: string;
      tag: string;
      response: "accepted" | "declined";
    }
  | { type: "archive-ajo"; id: string };
