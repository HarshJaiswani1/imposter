"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/words";
import { startRound, ApiError } from "@/lib/api-client";
import type { PublicRoom } from "@/lib/types";

export default function RoundSetup({
  code,
  playerId,
  room,
  heading,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
  heading?: string;
}) {
  const [category, setCategory] = useState(room.category ?? CATEGORIES[0].key);
  const [adminPlaying, setAdminPlaying] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = room.players.find((p) => p.id === playerId);
  const projectedPlaying = room.players.filter((p) => (p.isAdmin ? adminPlaying : true)).length;
  const canStart = projectedPlaying >= room.minPlayers;

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      await startRound(code, playerId, category, adminPlaying);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the round.");
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
      <h2 className="font-display text-xl font-bold">{heading ?? "Pick a category"}</h2>
      <p className="mt-1 text-sm text-white/50">
        Everyone gets the same word — one unlucky imposter gets something close, but different.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition active:scale-[0.97] ${
                active
                  ? "border-accent bg-accent/15 shadow-[0_0_0_1px_var(--color-accent)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="font-medium">{c.label}</span>
            </button>
          );
        })}
      </div>

      {me?.isAdmin && (
        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-white/60">
          <input
            type="checkbox"
            checked={adminPlaying}
            onChange={(e) => setAdminPlaying(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          I&apos;m playing too (uncheck to just host &amp; moderate)
        </label>
      )}

      <p className="mt-3 text-xs text-white/40">
        {projectedPlaying} player{projectedPlaying === 1 ? "" : "s"} in this round · need at least{" "}
        {room.minPlayers}
      </p>

      {error && <p className="mt-3 text-sm text-imposter">{error}</p>}

      <button
        onClick={handleStart}
        disabled={!canStart || loading}
        className="mt-5 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-[#0a0b14] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
      >
        {loading ? "Starting…" : room.round === 0 ? "Start Round" : "Start Next Round"}
      </button>
    </div>
  );
}
