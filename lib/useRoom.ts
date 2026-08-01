"use client";

import useSWR from "swr";
import { fetchRoom } from "./api-client";
import type { PublicRoom } from "./types";

export function useRoom(code: string, playerId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PublicRoom>(
    playerId ? ["room", code, playerId] : null,
    () => fetchRoom(code, playerId as string),
    {
      refreshInterval: 1500,
      revalidateOnFocus: true,
      dedupingInterval: 500,
      keepPreviousData: true,
    },
  );

  return { room: data, error, isLoading, mutate };
}
