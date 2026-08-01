"use client";

import { motion } from "framer-motion";
import type { PublicRoom } from "@/lib/types";
import { getCategory } from "@/lib/words";
import PlayerAvatar from "./PlayerAvatar";
import RoundSetup from "./RoundSetup";

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

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
  const imposters = room.players.filter((p) => result.imposterIds.includes(p.id));
  const caughtNames = room.players.filter((p) => result.caughtIds.includes(p.id)).map((p) => p.name);
  const escapedNames = room.players.filter((p) => result.escapedIds.includes(p.id)).map((p) => p.name);
  const accusedNames = room.players.filter((p) => result.accusedIds.includes(p.id)).map((p) => p.name);
  const eligible = room.players.filter((p) => p.playing);
  const maxTally = Math.max(1, ...Object.values(result.tally));
  const sortedByTally = [...eligible].sort(
    (a, b) => (result.tally[b.id] ?? 0) - (result.tally[a.id] ?? 0),
  );
  const scoreboard = [...room.players].sort((a, b) => b.score - a.score);
  const audienceWon = !result.imposterWon;
  const me = room.players.find((p) => p.id === playerId);
  const isMulti = imposters.length > 1;

  let subtitle: string;
  if (result.tie) {
    subtitle = isMulti
      ? "Nobody got enough votes to be accused — every imposter slips away."
      : "Nobody got enough votes to be accused — the imposter slips away.";
  } else if (audienceWon) {
    subtitle = isMulti
      ? `The room caught every imposter — ${joinNames(caughtNames)}!`
      : `The room correctly voted out ${joinNames(caughtNames)}.`;
  } else if (caughtNames.length > 0) {
    subtitle = `The room caught ${joinNames(caughtNames)} — but ${joinNames(escapedNames)} slipped away unnoticed.`;
  } else {
    subtitle = accusedNames.length
      ? `The room accused ${joinNames(accusedNames)}, but ${isMulti ? "none of them were imposters" : "that wasn't the imposter"}.`
      : "Nobody was accused.";
  }

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
          {audienceWon ? "Audience Wins!" : isMulti ? "Imposters Win!" : "Imposter Wins!"}
        </h1>
        <p className="mt-2 text-sm text-white/60">{subtitle}</p>
      </motion.div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="font-display text-lg font-bold">The reveal</h2>
        <div className="mt-4 flex flex-col gap-3">
          {imposters.map((p) => {
            const wasCaught = result.caughtIds.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-4">
                <PlayerAvatar name={p.name} seed={p.id} size="lg" />
                <div>
                  <p className="text-sm text-white/50">
                    {wasCaught ? "Caught!" : isMulti ? "Got away with it" : "The imposter was"}
                  </p>
                  <p className="font-display text-2xl font-bold text-imposter">{p.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-white/40">
              {category?.emoji} Everyone&apos;s word
            </p>
            <p className="mt-2 font-display text-lg font-bold sm:text-xl">{result.word}</p>
          </div>
          <div className="rounded-2xl border border-imposter/20 bg-imposter/10 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-imposter/70">Imposter&apos;s word</p>
            <p className="mt-2 font-display text-lg font-bold text-imposter sm:text-xl">
              {result.imposterWord}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <h2 className="font-display text-lg font-bold">Vote breakdown</h2>
        <p className="mt-1 text-xs text-white/40">
          {result.accusedIds.length > 0
            ? `Accused this round: ${joinNames(accusedNames)}`
            : "Nobody got enough votes to be accused."}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {sortedByTally.map((p) => {
            const count = result.tally[p.id] ?? 0;
            const isImposter = result.imposterIds.includes(p.id);
            const wasAccused = result.accusedIds.includes(p.id);
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className={`rounded-full ${wasAccused ? "ring-2 ring-white/40" : ""}`}
                >
                  <PlayerAvatar name={p.name} seed={p.id} size="sm" />
                </div>
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
