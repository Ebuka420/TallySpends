import { money, today, type Wallet } from "./ledger";

export function planningCards(wallet: Wallet, day = today()) {
  return {
    ajo: (wallet.circles || [])
      .filter(
        (circle) =>
          circle.trackingMode === "external" && circle.status === "active",
      )
      .map((circle) => {
        const paid = circle.contributions.filter(
          (record) => record.round === circle.round && !record.voidedAt,
        ).length;
        const pending = circle.participants.some(
          (member) => member.status !== "accepted",
        );
        return {
          id: circle.id,
          title: circle.name,
          tag: circle.participants[circle.round].tag,
          subtitle: pending ? "Awaiting member agreement" : "Next to receive",
          amount: money(circle.contribution * circle.participants.length),
          detail: pending
            ? `${circle.participants.length} members · ${money(circle.contribution)} each`
            : `${paid}/${circle.participants.length} contributions recorded`,
          date: circle.nextDate,
          progress: Math.round((paid / circle.participants.length) * 100),
        };
      }),
    joint: (wallet.savings || [])
      .filter((goal) => goal.kind === "joint" && goal.status === "active")
      .map((goal) => ({
        id: goal.id,
        title: goal.name,
        tag:
          goal.participants.find((member) => member.tag !== goal.ownerTag)
            ?.tag || goal.ownerTag,
        subtitle: goal.participants.some(
          (member) => member.status === "declined",
        )
          ? "Member declined"
          : goal.participants.some((member) => member.status === "invited")
            ? "Awaiting acceptance"
            : "Saving together",
        amount: money(goal.saved),
        detail: `You saved ${money(goal.saved)} of ${money(goal.target)}`,
        date:
          goal.unlockDate <= day ? "Unlocked" : `Unlocks ${goal.unlockDate}`,
        progress: Math.min(100, Math.round((goal.saved / goal.target) * 100)),
      })),
  };
}
