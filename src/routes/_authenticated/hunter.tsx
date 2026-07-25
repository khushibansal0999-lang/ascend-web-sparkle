import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { getHunterOverview, seedStarterQuests } from "@/lib/ascend.functions";
import { AppShell } from "@/components/ascend/AppShell";
import { LevelUpModal } from "@/components/ascend/LevelUpModal";
import { levelProgress, RANK_LABEL, RANK_MIN_LEVEL, nextRank, STAT_META, type StatCode } from "@/lib/progression";

export const Route = createFileRoute("/_authenticated/hunter")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hunter Profile — Ascend" },
      { name: "description", content: "Your Hunter status, stats, rank and level progression." },
      { property: "og:title", content: "Hunter Profile — Ascend" },
      { property: "og:description", content: "Track your Hunter's ascent through the ranks." },
    ],
  }),
  component: HunterProfile,
});

function useOverview() {
  const fn = useServerFn(getHunterOverview);
  return useQuery(
    queryOptions({
      queryKey: ["hunter-overview"],
      queryFn: () => fn(),
    }),
  );
}

function HunterProfile() {
  const q = useOverview();
  const qc = useQueryClient();
  const seed = useServerFn(seedStarterQuests);
  const seedM = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hunter-overview"] }),
  });

  useEffect(() => {
    if (q.data && q.data.quests.length === 0 && !seedM.isPending && !seedM.isSuccess) {
      seedM.mutate();
    }
  }, [q.data, seedM]);

  if (q.isLoading || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.4em] text-primary hologram-flicker">
          [ SYSTEM.LOADING ]
        </p>
      </div>
    );
  }

  const { profile, stats, statTotals, totalXp, level, rank, habits, pendingLevelUp } = q.data;
  const lp = levelProgress(totalXp);
  const nr = nextRank(rank);
  const untilNextRank = nr ? RANK_MIN_LEVEL[nr] - level : 0;

  return (
    <AppShell level={level} rank={rank}>
      {pendingLevelUp && <LevelUpModal event={pendingLevelUp} />}

      <section className="mb-10">
        <p className="font-mono text-[11px] tracking-[0.4em] text-secondary">[ HUNTER_ID ]</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-on-surface md:text-6xl">
              {profile?.hunter_name ?? "Unnamed Hunter"}
            </h1>
            <p className="mt-2 font-mono text-xs tracking-[0.3em] text-on-surface-variant">
              {profile?.epithet ?? "The Awakened"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">RANK</p>
            <p className="font-display text-5xl font-bold text-primary rank-glow">
              {rank.toUpperCase()}
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel mb-10 p-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
              CURRENT LEVEL
            </p>
            <p className="font-display text-7xl font-bold text-primary drop-shadow-[0_0_20px_rgba(221,183,255,0.4)]">
              {level}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">TOTAL XP</p>
            <p className="font-mono text-2xl font-semibold text-on-surface">
              {totalXp.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
            <span>LVL {level}</span>
            <span>
              {lp.intoLevel.toLocaleString()} / {lp.needed.toLocaleString()} XP
            </span>
            <span>LVL {level + 1}</span>
          </div>
          <div className="h-3 w-full overflow-hidden border border-white/10 bg-white/5">
            <div
              className="h-full bg-primary shadow-[0_0_15px_rgba(221,183,255,0.6)] transition-all duration-700"
              style={{ width: `${lp.percent}%` }}
            />
          </div>
        </div>
        {nr && (
          <p className="mt-4 font-mono text-[11px] tracking-[0.3em] text-tertiary">
            {untilNextRank} LEVELS UNTIL PROMOTION TO {RANK_LABEL[nr].toUpperCase()}
          </p>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-3 border-l-2 border-primary pl-4">
          <span className="material-symbols-outlined text-primary">insights</span>
          <h2 className="font-display text-xl uppercase tracking-widest text-on-surface">
            Stat Array
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => {
            const code = s.code as StatCode;
            const meta = STAT_META[code];
            const value = Math.round(statTotals[s.id] ?? 0);
            return (
              <div key={s.id} className="glass-panel p-5">
                <div className="flex items-start justify-between">
                  <span className={`material-symbols-outlined text-${meta.color}`}>
                    {meta.icon}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                    {meta.short}
                  </span>
                </div>
                <p className="mt-3 font-display text-4xl font-bold text-on-surface">{value}</p>
                <p className="mt-1 font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                  {s.display_name.toUpperCase()}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3 border-l-2 border-secondary pl-4">
          <span className="material-symbols-outlined text-secondary">local_fire_department</span>
          <h2 className="font-display text-xl uppercase tracking-widest text-on-surface">
            Active Habits
          </h2>
        </div>
        {habits.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="font-mono text-[11px] tracking-[0.3em] text-on-surface-variant">
              NO HABITS FORGED YET. HEAD TO THE HABITS TAB TO BEGIN.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {habits.map((h) => {
              const streak = q.data!.habitStreaks[h.id] ?? 0;
              return (
                <div key={h.id} className="glass-panel flex items-center justify-between p-5">
                  <div>
                    <p className="font-display text-lg text-on-surface">{h.name}</p>
                    <p className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                      {h.class_name.toUpperCase()} · RANK {h.difficulty_rank.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-tertiary">{streak}</p>
                    <p className="font-mono text-[9px] tracking-[0.3em] text-on-surface-variant">
                      DAY STREAK
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
