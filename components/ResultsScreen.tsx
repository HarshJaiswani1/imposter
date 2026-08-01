"use client";

import { motion } from "framer-motion";
import type { PublicRoom } from "@/lib/types";
import { getCategory } from "@/lib/words";
import PlayerAvatar from "./PlayerAvatar";
import RoundSetup from "./RoundSetup";

export default function ResultsScreen({
  code,
  playerId,
  room,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
}) {
  const result = room.result;
  if (!result) return null;

  const category = getCategory(result.category);
  const imposter = room.players.find((p) => p.id === result.actualImposterId);
  const votedFor = room.players.find((p) => p.id === result.votedImposterId);
  const eligible = room.players.filter((p) => p.playing);
  const maxTally = Math.max(1, ...Object.values(result.tally));
  const sortedByTally = [...eligible].sort(
    (a, b) => (result.tally[b.id] ?? 0) - (result.tally[a.id] ?? 0),
  );
  const scoreboard = [...room.players].sort((a, b) => b.score - a.score);
  const audienceWon = !result.imposterWon;
  const me = room.players.find((p) => p.id === playerId);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`rounded-3xl border p-8 text-center shadow-2xl ${
          audienceWon
            ? "border-success/40 bg-gradient-to-b from-success/15 to-transparent"
            : "border-imposter/40 bg-gradient-to-b from-imposter/15 to-transparent"
        }`}
      >
        <span className="text-5xl">{audienceWon ? "🕵️" : "🎭"}</span>
        <h1 className="mt-3 font-display text-3xl font-bold">
          {audienceWon ? "Audience Wins!" : "Imposter Wins!"}
        </h1>
        <p className="mt-2 text-sm text-white/60">
          {result.tie
            ? "The vote ended in a tie — the imposter slips away."
            : audienceWon
              ? `The room correctly voted out ${imposter?.name ?? "the imposter"}.`
              : votedFor
                ? `The room voted for ${votedFor.name}, but that wasn't the imposter.`
                : "Nobody was voted out."}
        </p>
      </motion.div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="font-display text-lg font-bold">The reveal</h2>
        <div className="mt-4 flex items-center gap-4">
          <PlayerAvatar name={imposter?.name ?? "?"} seed={result.actualImposterId} size="lg" />
          <div>
            <p className="text-sm text-white/50">The imposter was</p>
            <p className="font-display text-2xl font-bold text-imposter">
              {imposter?.name ?? "Unknown"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-white/40">
              {category?.emoji} Everyone&apos;s word
            </p>
            <p className="mt-2 font-display text-xl font-bold">{result.word}</p>
          </div>
          <div className="rounded-2xl border border-imposter/20 bg-imposter/10 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-imposter/70">Imposter&apos;s word</p>
            <p className="mt-2 font-display text-xl font-bold text-imposter">
              {result.imposterWord}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="font-display text-lg font-bold">Vote breakdown</h2>
        <div className="mt-4 flex flex-col gap-3">
          {sortedByTally.map((p) => {
            const count = result.tally[p.id] ?? 0;
            const isImposter = p.id === result.actualImposterId;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <PlayerAvatar name={p.name} seed={p.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`truncate font-medium ${isImposter ? "text-imposter" : ""}`}>
                      {p.name} {isImposter && "🎭"}
                    </span>
                    <span className="text-white/50">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${isImposter ? "bg-imposter" : "bg-accent"}`}
                      style={{ width: `${(count / maxTally) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="font-display text-lg font-bold">Scoreboard</h2>
        <div className="mt-4 flex flex-col divide-y divide-white/5">
          {scoreboard.map((p, i) => {
            const delta = result.scoreDeltas[p.id];
            return (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 text-center text-sm text-white/40">{i + 1}</span>
                <PlayerAvatar name={p.name} seed={p.id} size="sm" />
                <span className="flex-1 truncate font-medium">
                  {p.name}
                  {p.id === playerId && <span className="ml-1 text-xs text-white/40">(you)</span>}
                </span>
                {delta ? (
                  <span className="text-xs font-semibold text-success">+{delta}</span>
                ) : null}
                <span className="font-display text-lg font-bold text-accent">{p.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {me?.isAdmin ? (
        <RoundSetup code={code} playerId={playerId} room={room} heading="Set up the next round" />
      ) : (
        <div className="glass-panel rounded-3xl p-6 text-center text-sm text-white/50 shadow-2xl">
          Waiting for the host to start the next round…
        </div>
      )}
    </div>
  );
}
