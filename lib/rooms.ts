import { customAlphabet, nanoid } from "nanoid";
import { getStore } from "./store";
import { pickWordPair } from "./words";
import { MIN_PLAYERS, maxImposters } from "./gameRules";
import type { Player, PublicRoom, Room, RoundResult } from "./types";

const ROOM_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const MAX_PLAYERS = 16;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const roomCodeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

function roomKey(code: string): string {
  return `imposter:room:${code.toUpperCase()}`;
}

export class RoomError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function newPlayerId(): string {
  return nanoid(16);
}

async function readRoom(code: string): Promise<{ raw: string; room: Room } | null> {
  const raw = await getStore().get(roomKey(code));
  if (!raw) return null;
  return { raw, room: JSON.parse(raw) as Room };
}

async function mutateRoom<T>(
  code: string,
  mutator: (room: Room) => T,
): Promise<{ room: Room; result: T }> {
  const store = getStore();
  for (let attempt = 0; attempt < 8; attempt++) {
    const current = await readRoom(code);
    if (!current) throw new RoomError("Room not found or has expired.", 404);
    const { raw, room } = current;
    const result = mutator(room);
    room.updatedAt = Date.now();
    const newRaw = JSON.stringify(room);
    const ok = await store.cas(roomKey(code), raw, newRaw, ROOM_TTL_SECONDS);
    if (ok) return { room, result };
    await new Promise((r) => setTimeout(r, 25 + Math.random() * 60));
  }
  throw new RoomError("Could not update room, please try again.", 409);
}

export async function createRoom(adminName: string): Promise<{ room: Room; adminId: string }> {
  const name = adminName.trim().slice(0, 24);
  if (!name) throw new RoomError("Please enter a name.");

  const adminId = newPlayerId();
  const store = getStore();

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = roomCodeAlphabet();
    const room: Room = {
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      adminId,
      phase: "lobby",
      category: null,
      players: [
        {
          id: adminId,
          name,
          isAdmin: true,
          joinedAt: Date.now(),
          score: 0,
          playing: true,
        },
      ],
      imposterIds: [],
      imposterCount: 1,
      word: null,
      imposterWord: null,
      votes: {},
      votingStartedAt: null,
      round: 0,
      result: null,
      usedPairs: [],
      adminPlaying: true,
    };
    const created = await store.cas(roomKey(code), null, JSON.stringify(room), ROOM_TTL_SECONDS);
    if (created) return { room, adminId };
  }
  throw new RoomError("Could not create a room right now, please try again.", 500);
}

export async function joinRoom(
  code: string,
  name: string,
): Promise<{ room: Room; playerId: string }> {
  const cleanName = name.trim().slice(0, 24);
  if (!cleanName) throw new RoomError("Please enter a name.");

  const playerId = newPlayerId();
  const { room } = await mutateRoom(code, (room) => {
    if (room.players.length >= MAX_PLAYERS) {
      throw new RoomError("This room is full.", 400);
    }
    const nameTaken = room.players.some(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (nameTaken) {
      throw new RoomError("That name is already taken in this room.", 409);
    }
    const player: Player = {
      id: playerId,
      name: cleanName,
      isAdmin: false,
      joinedAt: Date.now(),
      score: 0,
      playing: true,
    };
    room.players.push(player);
    return player;
  });

  return { room, playerId };
}

export async function getRoom(code: string): Promise<Room> {
  const current = await readRoom(code);
  if (!current) throw new RoomError("Room not found or has expired.", 404);
  return current.room;
}

export function toPublicRoom(room: Room, viewerId: string | null): PublicRoom {
  const you = room.players.find((p) => p.id === viewerId);
  return {
    code: room.code,
    phase: room.phase,
    category: room.category,
    round: room.round,
    imposterCount: room.imposterCount,
    votingStartedAt: room.votingStartedAt,
    result: room.result,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isAdmin: p.isAdmin,
      score: p.score,
      playing: p.playing,
      hasVoted: Object.prototype.hasOwnProperty.call(room.votes, p.id),
    })),
    you: {
      id: viewerId ?? "",
      isAdmin: you?.id === room.adminId,
      inRoom: !!you,
      votes: viewerId ? room.votes[viewerId] ?? [] : [],
    },
  };
}

function assertAdmin(room: Room, playerId: string) {
  if (room.adminId !== playerId) {
    throw new RoomError("Only the host can do that.", 403);
  }
}

export async function startRound(
  code: string,
  adminId: string,
  categoryKey: string,
  adminPlaying: boolean,
  imposterCount: number,
): Promise<Room> {
  const { room } = await mutateRoom(code, (room) => {
    assertAdmin(room, adminId);

    room.players.forEach((p) => {
      if (p.isAdmin) p.playing = adminPlaying;
      else p.playing = true;
    });

    const eligible = room.players.filter((p) => p.playing);
    if (eligible.length < MIN_PLAYERS) {
      throw new RoomError(`Need at least ${MIN_PLAYERS} playing players to start.`, 400);
    }

    const cap = maxImposters(eligible.length);
    const count = Math.min(Math.max(1, Math.floor(imposterCount) || 1), cap);

    const picked = pickWordPair(categoryKey, room.usedPairs);
    if (!picked) throw new RoomError("Unknown category.", 400);

    room.usedPairs.push(picked.pairKey);
    if (room.usedPairs.length > 200) room.usedPairs = room.usedPairs.slice(-100);

    const imposters = shuffle(eligible).slice(0, count);

    room.category = categoryKey;
    room.adminPlaying = adminPlaying;
    room.imposterIds = imposters.map((p) => p.id);
    room.imposterCount = count;
    room.word = picked.word;
    room.imposterWord = picked.imposterWord;
    room.votes = {};
    room.votingStartedAt = null;
    room.result = null;
    room.round += 1;
    room.phase = "reveal";
    return null;
  });
  return room;
}

export async function getMyWord(
  code: string,
  playerId: string,
): Promise<{
  role: "normal" | "imposter" | "spectator";
  word: string | null;
  category: string | null;
  fellowImposters: string[];
}> {
  const room = await getRoom(code);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) throw new RoomError("You're not part of this room.", 403);
  if (room.phase === "lobby" || !room.category) {
    return { role: "spectator", word: null, category: null, fellowImposters: [] };
  }
  if (!player.playing) {
    return { role: "spectator", word: null, category: room.category, fellowImposters: [] };
  }
  if (room.imposterIds.includes(player.id)) {
    const fellowImposters = room.players
      .filter((p) => p.id !== player.id && room.imposterIds.includes(p.id))
      .map((p) => p.name);
    return { role: "imposter", word: room.imposterWord, category: room.category, fellowImposters };
  }
  return { role: "normal", word: room.word, category: room.category, fellowImposters: [] };
}

export async function callVote(code: string, adminId: string): Promise<Room> {
  const { room } = await mutateRoom(code, (room) => {
    assertAdmin(room, adminId);
    if (room.phase !== "reveal") {
      throw new RoomError("Voting can only start from the reveal phase.", 400);
    }
    room.phase = "voting";
    room.votes = {};
    room.votingStartedAt = Date.now();
    return null;
  });
  return room;
}

function finalize(room: Room): RoundResult {
  const eligible = room.players.filter((p) => p.playing);
  const K = Math.max(1, room.imposterIds.length);

  const tally: Record<string, number> = {};
  eligible.forEach((p) => (tally[p.id] = 0));
  for (const [voterId, targets] of Object.entries(room.votes)) {
    if (!eligible.some((p) => p.id === voterId)) continue;
    for (const targetId of targets) {
      if (tally[targetId] === undefined) continue;
      tally[targetId] += 1;
    }
  }

  const maxVotes = Math.max(0, ...Object.values(tally));
  const tie = maxVotes === 0;

  // Take the K most-accused players. If there's a tie for the last spot(s),
  // everyone tied at that count is included rather than picked arbitrarily.
  let accusedIds: string[] = [];
  if (!tie) {
    const ranked = Object.entries(tally)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    const cutoffCount = ranked[Math.min(K, ranked.length) - 1][1];
    accusedIds = ranked.filter(([, count]) => count >= cutoffCount).map(([id]) => id);
  }

  const caughtIds = room.imposterIds.filter((id) => accusedIds.includes(id));
  const escapedIds = room.imposterIds.filter((id) => !accusedIds.includes(id));
  const imposterWon = tie || escapedIds.length > 0;

  const imposterNames = room.players
    .filter((p) => room.imposterIds.includes(p.id))
    .map((p) => p.name);

  // Every imposter who wasn't accused evaded detection and scores for it.
  // Genuine audience members (never imposters themselves) score one point
  // per correct pick in their ballot.
  const scoreDeltas: Record<string, number> = {};
  for (const id of escapedIds) {
    scoreDeltas[id] = (scoreDeltas[id] ?? 0) + 2;
  }
  for (const [voterId, targets] of Object.entries(room.votes)) {
    if (room.imposterIds.includes(voterId)) continue;
    if (!eligible.some((p) => p.id === voterId)) continue;
    const correctPicks = targets.filter((t) => caughtIds.includes(t)).length;
    if (correctPicks > 0) {
      scoreDeltas[voterId] = (scoreDeltas[voterId] ?? 0) + correctPicks;
    }
  }
  for (const [playerId, delta] of Object.entries(scoreDeltas)) {
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.score += delta;
  }

  return {
    accusedIds,
    imposterIds: room.imposterIds,
    imposterNames,
    caughtIds,
    escapedIds,
    imposterWon,
    tie,
    tally,
    word: room.word ?? "",
    imposterWord: room.imposterWord ?? "",
    category: room.category ?? "",
    scoreDeltas,
  };
}

export async function castVote(
  code: string,
  voterId: string,
  targetIds: string[],
): Promise<Room> {
  const { room } = await mutateRoom(code, (room) => {
    if (room.phase !== "voting") {
      throw new RoomError("Voting isn't open right now.", 400);
    }
    const voter = room.players.find((p) => p.id === voterId);
    if (!voter || !voter.playing) {
      throw new RoomError("You're not eligible to vote this round.", 403);
    }

    const requiredPicks = Math.max(1, room.imposterIds.length);
    const uniqueTargets = new Set(targetIds);
    if (uniqueTargets.size !== targetIds.length) {
      throw new RoomError("You can't pick the same suspect twice.", 400);
    }
    if (targetIds.length !== requiredPicks) {
      throw new RoomError(`Pick exactly ${requiredPicks} suspect(s).`, 400);
    }
    if (targetIds.includes(voterId)) {
      throw new RoomError("You can't vote for yourself.", 400);
    }
    for (const targetId of targetIds) {
      const target = room.players.find((p) => p.id === targetId);
      if (!target || !target.playing) {
        throw new RoomError("Invalid vote target.", 400);
      }
    }

    room.votes[voterId] = targetIds;

    const eligible = room.players.filter((p) => p.playing);
    const allVoted = eligible.every((p) =>
      Object.prototype.hasOwnProperty.call(room.votes, p.id),
    );
    if (allVoted) {
      room.result = finalize(room);
      room.phase = "results";
    }
    return null;
  });
  return room;
}

export async function endVote(code: string, adminId: string): Promise<Room> {
  const { room } = await mutateRoom(code, (room) => {
    assertAdmin(room, adminId);
    if (room.phase !== "voting") {
      throw new RoomError("Voting isn't open right now.", 400);
    }
    room.result = finalize(room);
    room.phase = "results";
    return null;
  });
  return room;
}
