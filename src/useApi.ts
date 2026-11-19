import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { getProfileSnapshot, publishProfileTokens, subscribeProfile } from "./profile/repository";
import { createApiRequest, type ApiRequest } from "./network";
import { latestSessionTokens } from "./session";
export function useApi() {
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const controllers = useRef(new Set<AbortController>());
  const cancel = useCallback(() => { controllers.current.forEach(controller => controller.abort()); controllers.current.clear(); }, []);
  useEffect(() => cancel, [profile.scope, cancel]);
  const run = useCallback(async <T,>(action: (request: ApiRequest) => Promise<T>) => {
    const session = getProfileSnapshot();
    const owner = session.scope;
    if (!owner || !session.token && !session.refreshToken) throw new Error("Sign in to continue.");
    const controller = new AbortController(); controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const result = await action(createApiRequest({ token: session.token, refreshToken: session.refreshToken, saveTokens: async (token, refresh) => {
        if (controller.signal.aborted || getProfileSnapshot().scope !== owner) throw new Error("Your account changed.");
        const latest = latestSessionTokens({ token, refreshToken: refresh });
        publishProfileTokens(latest.token, latest.refreshToken);
      } }, controller.signal));
      if (getProfileSnapshot().scope !== owner) throw new Error("Your account changed.");
      return result;
    } finally { clearTimeout(timer); controllers.current.delete(controller); }
  }, []);
  return { owner: profile.scope, run, cancel };
}
