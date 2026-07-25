/**
 * Ascend progression math.
 * All values are DERIVED from raw check-ins + quest completions at read-time.
 *
 * Level curve (from Ascend_Product_Brief):
 *   Cumulative XP to reach level N (from level 1) = 100 * N * (N - 1) / 2
 *   -> XP needed for the Nth level = 100 * (N - 1)
 * Rank thresholds (from rank_definition):
 *   E=1, D=10, C=25, B=50, A=100, S=200
 */

export type RankCode = "e" | "d" | "c" | "b" | "a" | "s";

export const RANK_ORDER: RankCode[] = ["e", "d", "c", "b", "a", "s"];

export const RANK_MIN_LEVEL: Record<RankCode, number> = {
  e: 1,
  d: 10,
  c: 25,
  b: 50,
  a: 100,
  s: 200,
};

export const RANK_LABEL: Record<RankCode, string> = {
  e: "E-Rank",
  d: "D-Rank",
  c: "C-Rank",
  b: "B-Rank",
  a: "A-Rank",
  s: "S-Rank",
};

/** Level computed from total XP. Level 1 starts at 0 XP. */
export function levelFromXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  // cumulative XP to reach level N = 100*N*(N-1)/2 = 50*N*(N-1)
  // Solve 50*N*(N-1) <= xp for largest N
  // N = floor( (1 + sqrt(1 + xp/12.5)) / 2 )
  const n = Math.floor((1 + Math.sqrt(1 + totalXp / 12.5)) / 2);
  return Math.max(1, n);
}

export function xpForLevel(level: number): number {
  // cumulative xp needed to reach this level
  return 50 * level * (level - 1);
}

export function levelProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const intoLevel = totalXp - currentFloor;
  const needed = nextFloor - currentFloor;
  return {
    level,
    intoLevel,
    needed,
    percent: needed === 0 ? 0 : Math.min(100, Math.round((intoLevel / needed) * 100)),
    totalXp,
  };
}

export function rankFromLevel(level: number): RankCode {
  let rank: RankCode = "e";
  for (const code of RANK_ORDER) {
    if (level >= RANK_MIN_LEVEL[code]) rank = code;
  }
  return rank;
}

export function nextRank(rank: RankCode): RankCode | null {
  const idx = RANK_ORDER.indexOf(rank);
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
}

export const STAT_META = {
  str: { label: "Strength", short: "STR", icon: "fitness_center", color: "secondary" },
  vit: { label: "Vitality", short: "VIT", icon: "favorite", color: "tertiary" },
  int: { label: "Intelligence", short: "INT", icon: "psychology", color: "primary" },
  disc: { label: "Discipline", short: "DISC", icon: "self_improvement", color: "secondary" },
  will: { label: "Willpower", short: "WILL", icon: "bolt", color: "tertiary" },
} as const;

export type StatCode = keyof typeof STAT_META;
