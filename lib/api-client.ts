import type { PublicRoom } from "./types";

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Something went wrong.");
  }
  return data as T;
}

export function createRoom(name: string) {
  return request<{ playerId: string; room: PublicRoom }>("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function joinRoom(code: string, name: string) {
  return request<{ playerId: string; room: PublicRoom }>(
    `/api/rooms/${code}/join`,
    { method: "POST", body: JSON.stringify({ name }) },
  );
}

export function fetchRoom(code: string, playerId: string) {
  return request<PublicRoom>(
    `/api/rooms/${code}?playerId=${encodeURIComponent(playerId)}`,
    { method: "GET", cache: "no-store" },
  );
}

export function fetchMyWord(code: string, playerId: string) {
  return request<{
    role: "normal" | "imposter" | "spectator";
    word: string | null;
    category: string | null;
    fellowImposters: string[];
  }>(`/api/rooms/${code}/word?playerId=${encodeURIComponent(playerId)}`, {
    method: "GET",
    cache: "no-store",
  });
}

export function startRound(
  code: string,
  playerId: string,
  category: string,
  adminPlaying: boolean,
  imposterCount: number,
) {
  return request<{ room: PublicRoom }>(`/api/rooms/${code}/start`, {
    method: "POST",
    body: JSON.stringify({ playerId, category, adminPlaying, imposterCount }),
  });
}

export function callVote(code: string, playerId: string) {
  return request<{ room: PublicRoom }>(`/api/rooms/${code}/vote-call`, {
    method: "POST",
    body: JSON.stringify({ playerId }),
  });
}

export function castVote(code: string, playerId: string, targetIds: string[]) {
  return request<{ room: PublicRoom }>(`/api/rooms/${code}/vote`, {
    method: "POST",
    body: JSON.stringify({ playerId, targetIds }),
  });
}

export function endVote(code: string, playerId: string) {
  return request<{ room: PublicRoom }>(`/api/rooms/${code}/end-vote`, {
    method: "POST",
    body: JSON.stringify({ playerId }),
  });
}
