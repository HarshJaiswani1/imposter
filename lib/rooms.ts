import { customAlphabet, nanoid } from "nanoid";
import { getStore } from "./store";
import { pickWordPair } from "./words";
import type { Player, PublicRoom, Room, RoundResult } from "./types";

const ROOM_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 16;

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
      imposterId: null,
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
      votedFor: viewerId ? room.votes[viewerId] ?? null : null,
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

    const picked = pickWordPair(categoryKey, room.usedPairs);
    if (!picked) throw new RoomError("Unknown category.", 400);

    room.usedPairs.push(picked.pairKey);
    if (room.usedPairs.length > 200) room.usedPairs = room.usedPairs.slice(-100);

    const imposter = eligible[Math.floor(Math.random() * eligible.length)];

    room.category = categoryKey;
    room.adminPlaying = adminPlaying;
    room.imposterId = imposter.id;
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
): Promise<{ role: "normal" | "imposter" | "spectator"; word: string | null; category: string | null }> {
  const room = await getRoom(code);
  const player = room.players.find((p) => p.id === playerId);
  if (!player) throw new RoomError("You're not part of this room.", 403);
  if (room.phase === "lobby" || !room.category) {
    return { role: "spectator", word: null, category: null };
  }
  if (!player.playing) {
    return { role: "spectator", word: null, category: room.category };
  }
  if (player.id === room.imposterId) {
    return { role: "imposter", word: room.imposterWord, category: room.category };
  }
  return { role: "normal", word: room.word, category: room.category };
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
  const tally: Record<string, number> = {};
  eligible.forEach((p) => (tally[p.id] = 0));
  for (const [voterId, targetId] of Object.entries(room.votes)) {
    if (tally[targetId] === undefined) continue;
    if (!eligible.some((p) => p.id === voterId)) continue;
    tally[targetId] += 1;
  }

  const maxVotes = Math.max(0, ...Object.values(tally));
  const topPlayers = Object.entries(tally)
    .filter(([, count]) => count === maxVotes)
    .map(([id]) => id);

  const tie = maxVotes === 0 || topPlayers.length !== 1;
  const votedImposterId = tie ? null : topPlayers[0];
  const imposterWon = tie || votedImposterId !== room.imposterId;

  const imposter = room.players.find((p) => p.id === room.imposterId);

  const scoreDeltas: Record<string, number> = {};
  if (imposterWon) {
    if (room.imposterId) scoreDeltas[room.imposterId] = 2;
  } else {
    for (const [voterId, targetId] of Object.entries(room.votes)) {
      if (targetId === room.imposterId && eligible.some((p) => p.id === voterId)) {
        scoreDeltas[voterId] = (scoreDeltas[voterId] ?? 0) + 1;
      }
    }
  }
  for (const [playerId, delta] of Object.entries(scoreDeltas)) {
    const player = room.players.find((p) => p.id === playerId);
    if (player) player.score += delta;
  }

  return {
    votedImposterId,
    actualImposterId: room.imposterId ?? "",
    imposterName: imposter?.name ?? "Unknown",
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
  targetId: string,
): Promise<Room> {
  const { room } = await mutateRoom(code, (room) => {
    if (room.phase !== "voting") {
      throw new RoomError("Voting isn't open right now.", 400);
    }
    const voter = room.players.find((p) => p.id === voterId);
    if (!voter || !voter.playing) {
      throw new RoomError("You're not eligible to vote this round.", 403);
    }
    const target = room.players.find((p) => p.id === targetId);
    if (!target || !target.playing) {
      throw new RoomError("Invalid vote target.", 400);
    }
    if (targetId === voterId) {
      throw new RoomError("You can't vote for yourself.", 400);
    }

    room.votes[voterId] = targetId;

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
