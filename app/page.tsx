"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createRoom, joinRoom, ApiError } from "@/lib/api-client";
import { setIdentity } from "@/lib/identity";
import BackgroundFX from "@/components/BackgroundFX";

type Tab = "create" | "join";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { playerId, room } = await createRoom(name);
      setIdentity(room.code, { playerId, name: name.trim() });
      router.push(`/room/${room.code}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create a room.");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!name.trim() || !cleanCode) return;
    setLoading(true);
    setError(null);
    try {
      const { playerId } = await joinRoom(cleanCode, name);
      setIdentity(cleanCode, { playerId, name: name.trim() });
      router.push(`/room/${cleanCode}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't join that room.");
      setLoading(false);
    }
  }

  return (
    <>
      <BackgroundFX />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="text-5xl">🎭</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Imposter</h1>
          <p className="mt-2 text-sm text-white/50">
            Everyone gets a word. One of you gets a different one. Find them out.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel w-full rounded-3xl p-6 shadow-2xl sm:p-8"
        >
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              onClick={() => {
                setTab("create");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "create" ? "bg-accent text-[#0a0b14]" : "text-white/50"
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => {
                setTab("join");
                setError(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "join" ? "bg-accent text-[#0a0b14]" : "text-white/50"
              }`}
            >
              Join Room
            </button>
          </div>

          {tab === "create" ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-white/40">
                  Your name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="e.g. Riya"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg outline-none placeholder:text-white/30 focus:border-accent/60"
                />
              </div>
              {error && <p className="text-sm text-imposter">{error}</p>}
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="rounded-xl bg-accent px-4 py-3 font-semibold text-[#0a0b14] transition active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? "Creating…" : "Create a Room →"}
              </button>
              <p className="text-center text-xs text-white/30">
                You&apos;ll become the host and get a room code to share.
              </p>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-white/40">
                  Room code
                </label>
                <input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABCDE"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] outline-none placeholder:text-white/20 focus:border-accent/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-white/40">
                  Your name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  placeholder="e.g. Aarav"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg outline-none placeholder:text-white/30 focus:border-accent/60"
                />
              </div>
              {error && <p className="text-sm text-imposter">{error}</p>}
              <button
                type="submit"
                disabled={loading || !name.trim() || !code.trim()}
                className="rounded-xl bg-accent px-4 py-3 font-semibold text-[#0a0b14] transition active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? "Joining…" : "Join Room →"}
              </button>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 grid w-full grid-cols-3 gap-3 text-center text-xs text-white/40"
        >
          <div className="glass-panel rounded-2xl p-3">
            <p className="text-xl">🤫</p>
            <p className="mt-1">Hold to reveal your word</p>
          </div>
          <div className="glass-panel rounded-2xl p-3">
            <p className="text-xl">🎭</p>
            <p className="mt-1">One imposter hides among you</p>
          </div>
          <div className="glass-panel rounded-2xl p-3">
            <p className="text-xl">🗳️</p>
            <p className="mt-1">Vote them out to win</p>
          </div>
        </motion.div>
      </main>
    </>
  );
}
