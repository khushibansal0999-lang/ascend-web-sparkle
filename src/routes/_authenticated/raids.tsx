import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { getHunterOverview } from "@/lib/ascend.functions";
import { AppShell } from "@/components/ascend/AppShell";
import { LevelUpModal } from "@/components/ascend/LevelUpModal";

export const Route = createFileRoute("/_authenticated/raids")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Weekly Raids — Ascend" },
      { name: "description", content: "Multi-day boss raids for legendary XP and titles." },
      { property: "og:title", content: "Weekly Raids — Ascend" },
      { property: "og:description", content: "Long-form quests. Massive rewards." },
    ],
  }),
  component: RaidsPage,
});

// v1: raids are quests with scope='weekly'. Display and allow completion via the quest tab in v2.
function RaidsPage() {
  const fn = useServerFn(getHunterOverview);
  const q = useQuery(queryOptions({ queryKey: ["hunter-overview"], queryFn: () => fn() }));

  if (q.isLoading || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.4em] text-primary hologram-flicker">
          [ RAID.LOAD ]
        </p>
      </div>
    );
  }

  const raids = q.data.quests.filter((qq) => qq.scope === "weekly");

  return (
    <AppShell level={q.data.level} rank={q.data.rank}>
      {q.data.pendingLevelUp && <LevelUpModal event={q.data.pendingLevelUp} />}

      <section className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.4em] text-primary">[ ACTIVE_INSTANCES ]</p>
        <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
          Weekly Boss Raids
        </h1>
        <p className="mt-3 max-w-xl text-on-surface-variant/70">
          Long-term endurance quests. Defeat high-level objectives to unlock legendary titles and
          massive XP rewards.
        </p>
      </section>

      {raids.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-primary/40">skull</span>
          <p className="mt-4 font-display text-xl uppercase tracking-widest text-on-surface">
            No Boss Instances Active
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-[0.3em] text-on-surface-variant">
            RAIDS UNLOCK AT B-RANK. KEEP LEVELING.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {raids.map((r) => (
            <div key={r.id} className="glass-panel min-h-[300px] p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <span className="inline-block border border-tertiary/40 bg-tertiary/5 px-2 py-1 font-mono text-[10px] tracking-[0.3em] text-tertiary">
                    RANK-S RAIDER
                  </span>
                  <h2 className="mt-3 font-display text-xl uppercase tracking-widest text-on-surface">
                    {r.title}
                  </h2>
                  {r.boss_name && (
                    <p className="mt-1 font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                      BOSS: {r.boss_name.toUpperCase()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-semibold text-primary">
                    +{r.xp_reward} XP
                  </p>
                </div>
              </div>
              <p className="mt-6 font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                CONQUEST PROGRESS
              </p>
              <div className="mt-2 grid grid-cols-10 gap-1">
                {Array.from({ length: r.target_count ?? 7 }).map((_, i) => (
                  <div key={i} className="h-3 border border-white/10 bg-white/5" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
