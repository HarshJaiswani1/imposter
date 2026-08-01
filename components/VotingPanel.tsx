"use client";

import { useState } from "react";
import { castVote, endVote, ApiError } from "@/lib/api-client";
import type { PublicRoom } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";

export default function VotingPanel({
  code,
  playerId,
  room,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
}) {
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eligible = room.players.filter((p) => p.playing);
  const votedCount = eligible.filter((p) => p.hasVoted).length;
  const me = room.players.find((p) => p.id === playerId);
  const iCanVote = !!me?.playing;

  async function handleVote(targetId: string) {
    if (targetId === playerId || voting) return;
    setVoting(targetId);
    setError(null);
    try {
      await castVote(code, playerId, targetId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cast vote.");
    } finally {
      setVoting(null);
    }
  }

  async function handleEndVote() {
    try {
      await endVote(code, playerId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't end voting.");
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Who&apos;s the imposter?</h2>
        <span className="text-sm text-white/50">
          {votedCount}/{eligible.length} voted
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${eligible.length ? (votedCount / eligible.length) * 100 : 0}%` }}
        />
      </div>

      {!iCanVote && (
        <p className="mt-4 text-sm text-white/50">You&apos;re spectating this round.</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {eligible.map((p) => {
          const isSelf = p.id === playerId;
          const isMyVote = room.you.votedFor === p.id;
          return (
            <button
              key={p.id}
              disabled={isSelf || !iCanVote || voting !== null}
              onClick={() => handleVote(p.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition active:scale-[0.96] disabled:cursor-not-allowed ${
                isMyVote
                  ? "border-accent bg-accent/15 shadow-[0_0_0_1px_var(--color-accent)]"
                  : isSelf
                    ? "border-white/5 bg-white/[0.02] opacity-40"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <PlayerAvatar name={p.name} seed={p.id} />
              <span className="max-w-full truncate text-sm font-medium">
                {p.name}
                {isSelf && " (you)"}
              </span>
              {isMyVote && <span className="text-xs text-accent">your vote</span>}
              {p.hasVoted && !isMyVote && <span className="text-xs text-white/30">✓ voted</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-imposter">{error}</p>}

      {room.you.isAdmin && (
        <button
          onClick={handleEndVote}
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 active:scale-[0.98]"
        >
          End voting now & reveal results
        </button>
      )}
    </div>
  );
}
