"use client";

import { useState } from "react";

export default function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/room/${code}` : "";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join my Imposter game", text: `Join my room with code ${code}`, url: link });
        return;
      } catch {
        // fall through to copy
      }
    }
    copy(link, "link");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => copy(code, "code")}
        className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10 active:scale-95"
      >
        <span className="text-xs uppercase tracking-widest text-white/40">Room Code</span>
        <span className="font-display text-xl font-bold tracking-[0.2em] text-accent">
          {code}
        </span>
        <span className="text-xs text-white/40 group-hover:text-white/70">
          {copied === "code" ? "copied!" : "tap to copy"}
        </span>
      </button>
      <button
        onClick={share}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 active:scale-95"
      >
        {copied === "link" ? "Link copied!" : "🔗 Share invite link"}
      </button>
    </div>
  );
}
