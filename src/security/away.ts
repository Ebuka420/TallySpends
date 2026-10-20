export const APP_LOCK_DELAY_MS = 60_000;
type Instant = { wall: number; monotonic: number };
export function createAwayPolicy() {
  let departure: Instant | null = null;
  return {
    get away() { return departure !== null; },
    leave(wall: number, monotonic: number) { if (!departure) departure = { wall, monotonic }; },
    resume(wall: number, monotonic: number, snapshot: { supported: boolean; screenOff: boolean }) {
      const start = departure; departure = null;
      if (snapshot.screenOff) return true;
      if (!start) return false;
      if (!snapshot.supported) return true;
      const elapsed = wall - start.wall;
      const steadyElapsed = monotonic - start.monotonic;
      return !Number.isFinite(elapsed) || !Number.isFinite(steadyElapsed) || elapsed < 0 || steadyElapsed < 0
        || Math.max(elapsed, steadyElapsed) >= APP_LOCK_DELAY_MS;
    },
    clear() { departure = null; },
  };
}
