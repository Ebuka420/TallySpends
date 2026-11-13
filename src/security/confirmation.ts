// A late biometric callback must never authorize a newer transaction prompt.
export function createConfirmation() {
  let serial = 0;
  let pending: { challenge: number; resolve: (allowed: boolean) => void } | null = null;
  return {
    get active() { return pending !== null; },
    get challenge() { return pending?.challenge ?? null; },
    begin() {
      if (pending) throw new Error("Finish the current confirmation first.");
      const challenge = ++serial;
      const promise = new Promise<boolean>(resolve => { pending = { challenge, resolve }; });
      return promise;
    },
    complete(challenge: number | null) {
      if (challenge === null || pending?.challenge !== challenge) return false;
      const request = pending; pending = null; request.resolve(true); return true;
    },
    cancel() { const request = pending; pending = null; request?.resolve(false); },
  };
}
