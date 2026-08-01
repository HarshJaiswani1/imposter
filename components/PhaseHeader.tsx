import { getCategory } from "@/lib/words";

export default function PhaseHeader({
  round,
  category,
  imposterCount,
}: {
  round: number;
  category: string | null;
  imposterCount?: number;
}) {
  const cat = getCategory(category ?? "");
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        {cat ? `${cat.emoji} ${cat.label}` : ""}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold">Round {round}</h1>
      {!!imposterCount && imposterCount > 1 && (
        <p className="mt-1 text-xs font-medium text-imposter/80">
          🎭 {imposterCount} imposters are hiding this round
        </p>
      )}
    </div>
  );
}
