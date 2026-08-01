const PALETTES = [
  "from-fuchsia-500 to-purple-600",
  "from-amber-400 to-orange-600",
  "from-teal-400 to-emerald-600",
  "from-sky-400 to-blue-600",
  "from-rose-400 to-red-600",
  "from-violet-400 to-indigo-600",
  "from-lime-400 to-green-600",
  "from-pink-400 to-fuchsia-600",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function avatarGradient(seed: string): string {
  return PALETTES[hash(seed) % PALETTES.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
