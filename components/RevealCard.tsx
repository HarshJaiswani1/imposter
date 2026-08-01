"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function RevealCard({
  role,
  word,
  categoryLabel,
  categoryEmoji,
}: {
  role: "normal" | "imposter";
  word: string;
  categoryLabel: string;
  categoryEmoji: string;
}) {
  const [holding, setHolding] = useState(false);
  const [everRevealed, setEverRevealed] = useState(false);
  const pointerIdRef = useRef<number | null>(null);

  const startHold = useCallback((id: number, target: Element) => {
    pointerIdRef.current = id;
    try {
      (target as HTMLElement).setPointerCapture?.(id);
    } catch {
      // ignore
    }
    setHolding(true);
    setEverRevealed(true);
  }, []);

  const endHold = useCallback(() => {
    setHolding(false);
    pointerIdRef.current = null;
  }, []);

  useEffect(() => {
    if (!holding) return;
    const onBlur = () => endHold();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [holding, endHold]);

  const isImposter = role === "imposter";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onPointerDown={(e) => startHold(e.pointerId, e.currentTarget)}
        onPointerUp={endHold}
        onPointerCancel={endHold}
        onContextMenu={(e) => e.preventDefault()}
        className="no-select relative aspect-[3/4] w-64 cursor-pointer select-none sm:w-72"
      >
        <motion.div
          animate={{ scale: holding ? 0.96 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="card-back-pattern relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1d33] to-[#0f101c] shadow-2xl"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="text-4xl opacity-70">🕵️</span>
            <p className="font-display text-lg font-semibold text-white/80">
              {everRevealed ? "Hold again to peek" : "Press & hold to reveal"}
            </p>
            <p className="text-xs text-white/40">Your secret word is hidden here</p>
          </div>
          <div className="absolute inset-0 animate-pulse-glow bg-gradient-to-t from-accent/10 via-transparent to-transparent" />
          <span className="absolute right-4 top-4 text-xl">{categoryEmoji}</span>
        </motion.div>
      </div>

      <p className="max-w-xs text-center text-xs text-white/40">
        Hold the card down to see your word — it hides the instant you let go, so keep it away from
        wandering eyes 👀
      </p>

      <AnimatePresence>
        {holding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onPointerUp={endHold}
            onPointerCancel={endHold}
            className="no-select fixed inset-0 z-50 flex select-none items-center justify-center bg-black/92 p-4 backdrop-blur-md sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border p-6 text-center shadow-2xl sm:p-10 ${
                isImposter
                  ? "border-imposter/40 bg-gradient-to-b from-imposter/15 to-transparent"
                  : "border-accent/40 bg-gradient-to-b from-accent/15 to-transparent"
              }`}
            >
              <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                {categoryEmoji} {categoryLabel}
              </span>

              {isImposter ? (
                <>
                  <span className="mt-2 text-4xl">🎭</span>
                  <p className="font-display text-2xl font-bold text-imposter">
                    You are the IMPOSTER
                  </p>
                  <p className="text-sm text-white/60">
                    Everyone else shares a word. Yours is close, but not quite it — blend in.
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{word}</p>
                </>
              ) : (
                <>
                  <span className="mt-2 text-xs text-white/40">Your word is</span>
                  <p className="font-display text-3xl font-bold text-white sm:text-4xl">{word}</p>
                  <p className="mt-2 text-sm text-white/50">
                    One player has a different word. Find them before they blend in.
                  </p>
                </>
              )}

              <span className="mt-4 text-xs text-white/30">Let go to hide</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
