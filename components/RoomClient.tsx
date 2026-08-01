"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useIdentity } from "@/lib/useIdentity";
import { useRoom } from "@/lib/useRoom";
import JoinGate from "./JoinGate";
import Lobby from "./Lobby";
import RevealPhase from "./RevealPhase";
import VotingPhase from "./VotingPhase";
import ResultsScreen from "./ResultsScreen";
import BackgroundFX from "./BackgroundFX";

export default function RoomClient({ code }: { code: string }) {
  const identity = useIdentity(code);
  const { room, error, isLoading } = useRoom(code, identity?.playerId ?? null);

  if (!identity || (room && !room.you.inRoom)) {
    return (
      <>
        <BackgroundFX />
        <JoinGate code={code} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <BackgroundFX />
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="text-4xl">🕳️</span>
          <h1 className="font-display text-xl font-bold">Room not found</h1>
          <p className="max-w-xs text-sm text-white/50">
            {error instanceof Error ? error.message : "This room may have expired."}
          </p>
          <Link
            href="/"
            className="mt-2 rounded-xl bg-accent px-5 py-2.5 font-semibold text-[#0a0b14] transition active:scale-[0.98]"
          >
            Back home
          </Link>
        </div>
      </>
    );
  }

  if (!room && isLoading) {
    return (
      <>
        <BackgroundFX />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
        </div>
      </>
    );
  }

  if (!room) return <BackgroundFX />;

  return (
    <>
      <BackgroundFX />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-12">
        <header className="mb-8 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold tracking-tight">
            🎭 Imposter
          </Link>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono tracking-widest text-white/50">
            {code}
          </span>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${room.phase}-${room.round}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {room.phase === "lobby" && (
              <Lobby code={code} playerId={identity.playerId} room={room} />
            )}
            {room.phase === "reveal" && (
              <RevealPhase code={code} playerId={identity.playerId} room={room} />
            )}
            {room.phase === "voting" && (
              <VotingPhase code={code} playerId={identity.playerId} room={room} />
            )}
            {room.phase === "results" && (
              <ResultsScreen code={code} playerId={identity.playerId} room={room} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
