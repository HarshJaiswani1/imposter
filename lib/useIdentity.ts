"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getIdentity, subscribeIdentity, type Identity } from "./identity";

function getServerSnapshot(): Identity | null {
  return null;
}

export function useIdentity(code: string): Identity | null {
  const subscribe = useCallback((cb: () => void) => subscribeIdentity(code, cb), [code]);
  const getSnapshot = useCallback(() => getIdentity(code), [code]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
