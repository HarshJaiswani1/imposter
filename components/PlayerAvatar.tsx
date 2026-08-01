import { avatarGradient, initials } from "@/lib/colors";

export default function PlayerAvatar({
  name,
  seed,
  size = "md",
}: {
  name: string;
  seed: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";
  return (
    <div
      className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(seed)} font-display font-bold text-white shadow-lg ring-2 ring-white/10`}
    >
      {initials(name)}
    </div>
  );
}
