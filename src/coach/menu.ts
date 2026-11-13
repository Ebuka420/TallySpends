export type CoachAction = "coach" | "calc" | "add" | "scan";
export const COACH_ACTIONS = [
  { id: "calc", label: "Calculator", icon: "calculator-outline" },
  { id: "add", label: "Add expense", icon: "add-outline" },
  { id: "coach", label: "Smart Coach", icon: "sparkles-outline" },
  { id: "scan", label: "Scan receipt", icon: "scan-outline" },
] as const;
export const COACH_BUTTON = 58;
export const COACH_RADIUS = 108;

/** The same coordinates drive drawing and selection, including mirrored edges. */
export function actionOffset(index: number, right: boolean, down: boolean) {
  "worklet";
  const angle = (170 + index * 34) * Math.PI / 180;
  return { x: Math.cos(angle) * COACH_RADIUS * (right ? 1 : -1), y: Math.sin(angle) * COACH_RADIUS * (down ? -1 : 1) };
}
export function hoveredAction(dx: number, dy: number, right: boolean, down: boolean) {
  "worklet";
  if (Math.hypot(dx, dy) < 38) return -1;
  let result = -1;
  let nearest = 46;
  for (let index = 0; index < 4; index++) {
    const target = actionOffset(index, right, down);
    const distance = Math.hypot(dx - target.x, dy - target.y);
    if (distance < nearest) { nearest = distance; result = index; }
  }
  return result;
}
