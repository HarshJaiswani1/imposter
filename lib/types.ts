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
  votedImposterId: string | null;
  actualImposterId: string;
  imposterName: string;
  imposterWon: boolean;
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
  imposterId: string | null;
  word: string | null;
  imposterWord: string | null;
  votes: Record<string, string>;
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
  votingStartedAt: number | null;
  result: RoundResult | null;
  you: {
    id: string;
    isAdmin: boolean;
    inRoom: boolean;
    votedFor: string | null;
  };
  minPlayers: number;
  maxPlayers: number;
}
