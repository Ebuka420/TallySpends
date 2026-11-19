import { createApiRequest, type ApiRequest } from "./network";
import { getProfileSnapshot, publishProfileTokens } from "./profile/repository";
import { latestSessionTokens } from "./session";

/** Repository requests share the same single-flight refresh as screen requests. */
export async function authenticated<T>(action: (request: ApiRequest) => Promise<T>, expectedOwner = getProfileSnapshot().scope): Promise<T> {
  const session = getProfileSnapshot();
  if (!expectedOwner || session.scope !== expectedOwner || !session.token && !session.refreshToken) throw new Error("Sign in to continue.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const check = () => { if (getProfileSnapshot().scope !== expectedOwner) throw new Error("Your account changed. Please try again."); };
  try {
    const request = createApiRequest({ token: session.token, refreshToken: session.refreshToken, saveTokens: async (token, refreshToken) => {
      check();
      const latest = latestSessionTokens({ token, refreshToken });
      publishProfileTokens(latest.token, latest.refreshToken);
    } }, controller.signal);
    const result = await action(async (path, init) => { check(); const result = await request(path, init); check(); return result; });
    check();
    return result;
  } finally { clearTimeout(timeout); }
}
