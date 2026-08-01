"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/words";
import { maxImposters } from "@/lib/gameRules";
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
  const [imposterCount, setImposterCount] = useState(room.imposterCount || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = room.players.find((p) => p.id === playerId);
  const projectedPlaying = room.players.filter((p) => (p.isAdmin ? adminPlaying : true)).length;
  const canStart = projectedPlaying >= room.minPlayers;
  const imposterCap = maxImposters(projectedPlaying);
  const clampedImposterCount = Math.min(Math.max(1, imposterCount), imposterCap);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      await startRound(code, playerId, category, adminPlaying, clampedImposterCount);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the round.");
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
      <h2 className="font-display text-xl font-bold">{heading ?? "Pick a category"}</h2>
      <p className="mt-1 text-sm text-white/50">
        Everyone gets the same word — the imposter(s) get something close, but different.
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

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium">Imposters</p>
          <p className="text-xs text-white/40">
            {imposterCap <= 1
              ? "Add more players to allow multiple imposters"
              : `Up to ${imposterCap} for this many players`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setImposterCount((c) => Math.max(1, Math.min(imposterCap, c) - 1))}
            disabled={clampedImposterCount <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-lg font-bold transition hover:bg-white/10 active:scale-90 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-4 text-center font-display text-lg font-bold text-accent">
            {clampedImposterCount}
          </span>
          <button
            type="button"
            onClick={() => setImposterCount((c) => Math.min(imposterCap, c + 1))}
            disabled={clampedImposterCount >= imposterCap}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-lg font-bold transition hover:bg-white/10 active:scale-90 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

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
