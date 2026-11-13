import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useAppStore } from "../store";
import { createYounginsRequest, type YounginsRequest } from "./api";

export function useYounginsClient() {
  const store = useAppStore();
  const session = useRef(store);
  session.current = store;
  const controllers = useRef(new Set<AbortController>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controllers.current.forEach(c => c.abort()); controllers.current.clear(); };
  }, []);
  const cancel = useCallback(() => { controllers.current.forEach(c => c.abort()); }, []);
  const run = useCallback(async <T,>(action: (request: YounginsRequest) => Promise<T>): Promise<T> => {
    if (!mounted.current || !session.current.isAuthenticated) throw new Error("Sign in to your guardian account to continue.");
    const controller = new AbortController();
    controllers.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const s = session.current;
      return await action(createYounginsRequest({ token: s.token, refreshToken: s.refreshToken,
        saveTokens: async (token, refresh) => { await s.login(token, refresh); } }, controller.signal));
    } finally { clearTimeout(timer); controllers.current.delete(controller); }
  }, []);
  return { run, cancel, ready: !store.loading && store.isAuthenticated, theme: store.theme, themeMode: store.themeMode };
}
export function useYounginsResource<T>(load: (request: YounginsRequest) => Promise<T>, resourceKey?: string) {
  const client = useYounginsClient();
  const loadRef = useRef(load);
  loadRef.current = load;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useFocusEffect(useCallback(() => {
    let active = true;
    setData(null);
    setError(null);
    setLoading(true);
    if (client.ready) void client.run(request => loadRef.current(request)).then(result => {
      if (active) setData(result);
    }).catch(error => {
      if (active) setError(error instanceof Error ? error.message : "Couldn't load Youngins. Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; client.cancel(); };
  }, [client.ready, client.run, client.cancel, revision, resourceKey]));
  return { ...client, data, error, loading, retry };
}
