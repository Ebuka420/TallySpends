/** Keep one submission in flight across React renders; never navigate on failure. */
export function createCompletionAction() {
  let busy = false;
  return async (complete: () => Promise<void>, navigate: () => void, onBusy: (busy: boolean) => void, onError: (message: string) => void) => {
    if (busy) return;
    busy = true; onBusy(true);
    try {
      await complete();
      navigate();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Unable to finish setup. Please try again.");
    } finally { busy = false; onBusy(false); }
  };
}
