"use client";

import { useState } from "react";
import { joinRoom, ApiError } from "@/lib/api-client";
import { setIdentity } from "@/lib/identity";

export default function JoinGate({ code }: { code: string }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { playerId } = await joinRoom(code, name);
      setIdentity(code, { playerId, name: name.trim() });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't join the room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={handleJoin}
        className="glass-panel w-full max-w-sm rounded-3xl p-8 shadow-2xl"
      >
        <h1 className="font-display text-2xl font-bold">Join room</h1>
        <p className="mt-1 text-sm text-white/50">
          Room <span className="font-mono font-semibold text-accent">{code}</span> is waiting for you.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="Your name"
          className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg outline-none placeholder:text-white/30 focus:border-accent/60"
        />
        {error && <p className="mt-3 text-sm text-imposter">{error}</p>}
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="mt-5 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-[#0a0b14] transition active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? "Joining…" : "Join Room"}
        </button>
      </form>
    </div>
  );
}
