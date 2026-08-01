import type { PublicPlayer } from "@/lib/types";
import PlayerAvatar from "./PlayerAvatar";

export default function PlayerRow({
  player,
  isYou,
  right,
  dimmed,
}: {
  player: PublicPlayer;
  isYou?: boolean;
  right?: React.ReactNode;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity ${
        dimmed ? "opacity-40" : ""
      }`}
    >
      <PlayerAvatar name={player.name} seed={player.id} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate font-medium text-foreground">{player.name}</span>
          {isYou && <span className="shrink-0 text-xs text-white/40">(you)</span>}
          {player.isAdmin && <span title="Host" className="shrink-0">👑</span>}
          {!player.playing && (
            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">
              spectating
            </span>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}
