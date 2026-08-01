"use client";

import useSWR from "swr";
import { useState } from "react";
import { fetchMyWord, callVote, ApiError } from "@/lib/api-client";
import { getCategory } from "@/lib/words";
import type { PublicRoom } from "@/lib/types";
import PlayerRow from "./PlayerRow";
import RevealCard from "./RevealCard";
import PhaseHeader from "./PhaseHeader";

export default function RevealPhase({
  code,
  playerId,
  room,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
}) {
  const { data } = useSWR(
    ["word", code, playerId, room.round],
    () => fetchMyWord(code, playerId),
    { revalidateOnFocus: false },
  );
  const [error, setError] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);

  const category = getCategory(room.category ?? "");

  async function handleCallVote() {
    setCalling(true);
    setError(null);
    try {
      await callVote(code, playerId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the vote.");
      setCalling(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <PhaseHeader round={room.round} category={room.category} />

      {data?.role === "spectator" ? (
        <div className="glass-panel w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
          <span className="text-3xl">👀</span>
          <p className="mt-3 text-white/60">You&apos;re sitting this round out as a spectator.</p>
        </div>
      ) : data ? (
        <RevealCard
          role={data.role as "normal" | "imposter"}
          word={data.word ?? ""}
          categoryLabel={category?.label ?? ""}
          categoryEmoji={category?.emoji ?? ""}
        />
      ) : (
        <div className="h-72 w-64 animate-pulse rounded-3xl bg-white/5 sm:w-72" />
      )}

      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <h2 className="font-display text-sm font-semibold text-white/60">Players</h2>
        <div className="mt-2 flex flex-col divide-y divide-white/5">
          {room.players.map((p) => (
            <PlayerRow key={p.id} player={p} isYou={p.id === playerId} dimmed={!p.playing} />
          ))}
        </div>
      </div>

      {room.you.isAdmin && (
        <div className="w-full max-w-sm">
          {error && <p className="mb-3 text-center text-sm text-imposter">{error}</p>}
          <button
            onClick={handleCallVote}
            disabled={calling}
            className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-[#0a0b14] shadow-lg transition active:scale-[0.98] disabled:opacity-40"
          >
            {calling ? "Starting vote…" : "🗳️ Call for Vote"}
          </button>
          <p className="mt-2 text-center text-xs text-white/40">
            Once everyone has discussed and seen their word, call the vote.
          </p>
        </div>
      )}
      {!room.you.isAdmin && (
        <p className="text-center text-sm text-white/40">
          Discuss with the group — the host will call for a vote when ready.
        </p>
      )}
    </div>
  );
}
