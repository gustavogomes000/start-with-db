import type { SupportedStorage } from "@supabase/supabase-js";

type SessionData = {
  id: string;
  username: string;
  ts?: number;
};

const SESSION_KEY = "admin_session";
const memoryStorage = new Map<string, string>();

function getBrowserStorage(kind: "localStorage" | "sessionStorage"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window[kind];
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function getItem(key: string): string | null {
  const primary = getBrowserStorage("localStorage");
  const fallback = getBrowserStorage("sessionStorage");
  try {
    return primary?.getItem(key) ?? fallback?.getItem(key) ?? memoryStorage.get(key) ?? null;
  } catch {
    return memoryStorage.get(key) ?? null;
  }
}

function setItem(key: string, value: string) {
  memoryStorage.set(key, value);
  const primary = getBrowserStorage("localStorage");
  const fallback = getBrowserStorage("sessionStorage");
  try {
    primary?.setItem(key, value);
  } catch {
    fallback?.setItem(key, value);
  }
}

function removeItem(key: string) {
  memoryStorage.delete(key);
  try {
    getBrowserStorage("localStorage")?.removeItem(key);
    getBrowserStorage("sessionStorage")?.removeItem(key);
  } catch {
    // Storage may be disabled in private browsing.
  }
}

export function getAdminSession(): SessionData | null {
  const raw = getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as SessionData;
    if (!session?.id || !session?.username) return null;
    return session;
  } catch {
    removeAdminSession();
    return null;
  }
}

export function setAdminSession(session: SessionData) {
  setItem(SESSION_KEY, JSON.stringify({ ...session, ts: session.ts ?? Date.now() }));
}

export function removeAdminSession() {
  removeItem(SESSION_KEY);
}

export const safeSupabaseStorage: SupportedStorage = {
  getItem,
  setItem,
  removeItem,
};