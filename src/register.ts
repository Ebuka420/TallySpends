import { API_URL } from "./api";

export async function recoverLocalSession(identifier: string, password: string, users: unknown, send: typeof fetch = fetch) {
  const user = Array.isArray(users) ? users.find((entry: any) =>
    entry.password === password &&
    (entry.email?.toLowerCase() === identifier ||
      (entry.tallyTag || entry.username || "").replace(/^@+/, "").toLowerCase() === identifier)
  ) : undefined;
  if (!user?.email || !user?.fullName || !(user.tallyTag || user.username)) return null;
  const signup = {
    fullName: user.fullName,
    email: user.email,
    tallyTag: (user.tallyTag || user.username).replace(/^@+/, ""),
    phoneNumber: user.phoneNumber || "",
    password,
  };
  const session = await registerSession(signup, send);
  const { password: _, ...profile } = signup;
  return { ...profile, ...session };
}

export async function registerSession(
  signup: { fullName: string; email: string; password: string; tallyTag: string; phoneNumber: string },
  send: typeof fetch = fetch,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const post = async (path: string, body: object) => {
    const response = await send(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    // Recover if registration succeeded before an earlier login lost connection.
    if (path === "/api/auth/register" && response.status === 409) return {};
    if (!response.ok) throw new Error(data?.message || data?.title || "Unable to finish account setup. Please try again.");
    return data;
  };
  try {
    const registered = await post("/api/auth/register", signup);
    // Some registration responses only confirm creation; obtain a session separately.
    const session = registered?.accessToken || registered?.token
      ? registered
      : await post("/api/auth/login", { emailOrTallyTag: signup.email, password: signup.password });
    const accessToken = session?.accessToken || session?.token;
    if (typeof accessToken !== "string" || !accessToken.trim()) {
      throw new Error("Account setup did not return a session. Please sign in to continue.");
    }
    return { accessToken, refreshToken: session.refreshToken as string | undefined, userId: session.userId as number | undefined };
  } finally {
    clearTimeout(timeout);
  }
}
