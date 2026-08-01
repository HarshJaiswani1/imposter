export type Phase = "lobby" | "reveal" | "voting" | "results";

export interface Player {
  id: string;
  name: string;
  isAdmin: boolean;
  joinedAt: number;
  score: number;
  /** Whether this player is part of the current/next round (admin can sit out). */
  playing: boolean;
}

export interface RoundResult {
  /** The top-voted suspects — one pick's worth of ambiguity is widened to include ties. */
  accusedIds: string[];
  imposterIds: string[];
  imposterNames: string[];
  /** Imposters who were among the accused. */
  caughtIds: string[];
  /** Imposters who were not accused — they evaded detection. */
  escapedIds: string[];
  /** True only when every imposter was caught. */
  imposterWon: boolean;
  /** No votes were cast at all — a fully inconclusive round. */
  tie: boolean;
  tally: Record<string, number>;
  word: string;
  imposterWord: string;
  category: string;
  scoreDeltas: Record<string, number>;
}

export interface Room {
  code: string;
  createdAt: number;
  updatedAt: number;
  adminId: string;
  phase: Phase;
  category: string | null;
  players: Player[];
  imposterIds: string[];
  imposterCount: number;
  word: string | null;
  imposterWord: string | null;
  /** Each voter picks exactly `imposterCount` distinct suspects. */
  votes: Record<string, string[]>;
  votingStartedAt: number | null;
  round: number;
  result: RoundResult | null;
  usedPairs: string[];
  adminPlaying: boolean;
}

export interface PublicPlayer {
  id: string;
  name: string;
  isAdmin: boolean;
  score: number;
  playing: boolean;
  hasVoted: boolean;
}

export interface PublicRoom {
  code: string;
  phase: Phase;
  category: string | null;
  players: PublicPlayer[];
  round: number;
  imposterCount: number;
  votingStartedAt: number | null;
  result: RoundResult | null;
  you: {
    id: string;
    isAdmin: boolean;
    inRoom: boolean;
    votes: string[];
  };
  minPlayers: number;
  maxPlayers: number;
}
