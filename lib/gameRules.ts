export const MIN_PLAYERS = 3;

/**
 * Imposters must stay a strict minority and at least 2 non-imposters must
 * remain, otherwise there's no "common word" for the audience to compare
 * against.
 */
export function maxImposters(playingCount: number): number {
  if (playingCount < MIN_PLAYERS) return 1;
  return Math.max(1, Math.min(Math.floor(playingCount / 2), playingCount - 2));
}
