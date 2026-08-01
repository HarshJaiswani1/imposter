"use client";

export interface Identity {
  playerId: string;
  name: string;
}

type Listener = () => void;

const cache = new Map<string, Identity | null>();
const listeners = new Map<string, Set<Listener>>();

function storageKey(code: string): string {
  return `imposter:identity:${code}`;
}

function readFromStorage(code: string): Identity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(code));
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

function notify(code: string) {
  listeners.get(code)?.forEach((l) => l());
}

/** Synchronous snapshot getter — safe to call from useSyncExternalStore. */
export function getIdentity(code: string): Identity | null {
  const key = code.toUpperCase();
  if (!cache.has(key)) {
    cache.set(key, readFromStorage(key));
  }
  return cache.get(key) ?? null;
}

export function setIdentity(code: string, identity: Identity): void {
  const key = code.toUpperCase();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey(key), JSON.stringify(identity));
  }
  cache.set(key, identity);
  notify(key);
}

export function clearIdentity(code: string): void {
  const key = code.toUpperCase();
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey(key));
  }
  cache.set(key, null);
  notify(key);
}

export function subscribeIdentity(code: string, listener: Listener): () => void {
  const key = code.toUpperCase();
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(listener);
  return () => listeners.get(key)?.delete(listener);
}
