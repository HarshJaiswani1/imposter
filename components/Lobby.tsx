"use client";

import type { PublicRoom } from "@/lib/types";
import PlayerRow from "./PlayerRow";
import RoundSetup from "./RoundSetup";
import RoomCodeBadge from "./RoomCodeBadge";

export default function Lobby({
  code,
  playerId,
  room,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl p-6 text-center shadow-2xl sm:p-8">
        <h1 className="font-display text-2xl font-bold">
          Waiting in the lobby <span className="animate-pulse-glow">🕰️</span>
        </h1>
        <p className="text-sm text-white/50">Share this code so friends can join before you start.</p>
        <RoomCodeBadge code={code} />
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Players</h2>
          <span className="text-sm text-white/50">{room.players.length} joined</span>
        </div>
        <div className="mt-3 flex flex-col divide-y divide-white/5">
          {room.players.map((p) => (
            <PlayerRow key={p.id} player={p} isYou={p.id === playerId} />
          ))}
        </div>
      </div>

      {room.you.isAdmin ? (
        <RoundSetup code={code} playerId={playerId} room={room} />
      ) : (
        <div className="glass-panel rounded-3xl p-6 text-center text-sm text-white/50 shadow-2xl">
          Waiting for the host to pick a category and start the round…
        </div>
      )}
    </div>
  );
}
