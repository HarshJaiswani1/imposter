"use client";

import type { PublicRoom } from "@/lib/types";
import PhaseHeader from "./PhaseHeader";
import VotingPanel from "./VotingPanel";

export default function VotingPhase({
  code,
  playerId,
  room,
}: {
  code: string;
  playerId: string;
  room: PublicRoom;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <PhaseHeader round={room.round} category={room.category} />
      <div className="w-full max-w-lg">
        <VotingPanel code={code} playerId={playerId} room={room} />
      </div>
    </div>
  );
}
