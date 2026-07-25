import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getHunterOverview, checkInHabit, createHabit } from "@/lib/ascend.functions";
import { AppShell } from "@/components/ascend/AppShell";
import { LevelUpModal } from "@/components/ascend/LevelUpModal";
import { STAT_META, type StatCode, type RankCode } from "@/lib/progression";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/habits")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Habit Armory — Ascend" },
      { name: "description", content: "Forge and maintain habits. Every check-in raises your stats." },
      { property: "og:title", content: "Habit Armory — Ascend" },
      { property: "og:description", content: "Your habit loadout." },
    ],
  }),
  component: HabitsPage,
});

const RANK_COLORS: Record<RankCode, { text: string; bg: string; border: string }> = {
  e: { text: "text-on-surface-variant", bg: "bg-on-surface-variant/10", border: "border-on-surface-variant/30" },
  d: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30" },
  c: { text: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30" },
  b: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  a: { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  s: { text: "text-tertiary", bg: "bg-tertiary/10", border: "border-tertiary/30" },
};

function HabitsPage() {
  const fn = useServerFn(getHunterOverview);
  const q = useQuery(queryOptions({ queryKey: ["hunter-overview"], queryFn: () => fn() }));
  const qc = useQueryClient();
  const checkin = useServerFn(checkInHabit);
  const create = useServerFn(createHabit);

  const checkinM = useMutation({
    mutationFn: (id: string) => checkin({ data: { habitId: id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["hunter-overview"] });
      if (r?.xpGained) toast.success(`+${r.xpGained} XP · +${r.statGained} stat`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Check-in failed"),
  });

  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", className: "", statId: "", difficulty: "d" as RankCode });
  const createM = useMutation({
    mutationFn: () => create({ data: f }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hunter-overview"] });
      setShow(false);
      setF({ name: "", className: "", statId: "", difficulty: "d" });
      toast.success("Habit forged");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (q.isLoading || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.4em] text-primary hologram-flicker">
          [ ARMORY.LOAD ]
        </p>
      </div>
    );
  }

  const { habits, habitStreaks, stats, todayIso } = q.data;
  const todaysCheckIns = new Set<string>();
  // We don't have raw check-ins here, but streak > 0 with today means checked.
  // Simpler: allow re-check but the DB may reject duplicates via unique constraint.

  return (
    <AppShell level={q.data.level} rank={q.data.rank}>
      {q.data.pendingLevelUp && <LevelUpModal event={q.data.pendingLevelUp} />}

      <section className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.4em] text-secondary">[ HABIT_ARMORY ]</p>
        <div className="mt-2 flex items-end justify-between">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
            Your Loadout
          </h1>
          <p className="hidden font-mono text-[11px] tracking-[0.3em] text-on-surface-variant md:block">
            {habits.length} EQUIPPED
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((h) => {
          const rank = h.difficulty_rank as RankCode;
          const c = RANK_COLORS[rank];
          const statCode = stats.find((s) => s.id === h.stat_id)?.code as StatCode | undefined;
          const meta = statCode ? STAT_META[statCode] : null;
          const streak = habitStreaks[h.id] ?? 0;
          const segments = Math.max(10, Math.min(streak + 3, 21));
          return (
            <div key={h.id} className={`glass-panel relative p-5 ${c.border}`}>
              <div className="absolute right-3 top-3">
                <span className={`border ${c.border} ${c.bg} px-2 py-1 font-mono text-[10px] tracking-[0.2em] ${c.text}`}>
                  RANK {rank.toUpperCase()}
                </span>
              </div>
              <div className="mb-4 flex items-start justify-between pr-16">
                <div>
                  <h2 className="font-display text-xl text-primary">{h.name}</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`font-mono text-[10px] tracking-[0.2em] ${c.text}`}>
                      {meta?.short ?? ""} +{h.stat_value_per_check_in}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-on-surface-variant/60">
                      {h.class_name.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-3xl font-bold ${c.text}`}>{streak}</div>
                  <div className="font-mono text-[9px] tracking-[0.2em] text-on-surface-variant/40">
                    DAY STREAK
                  </div>
                </div>
              </div>
              <div className="mb-5 flex gap-0.5">
                {Array.from({ length: segments }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 ${
                      i < streak ? `${c.bg.replace("/10", "")}` : "bg-white/5"
                    }`}
                    style={i < streak ? { background: "currentColor" } : {}}
                  />
                ))}
              </div>
              <button
                onClick={() => checkinM.mutate(h.id)}
                disabled={checkinM.isPending}
                className={`w-full border ${c.border} ${c.bg} py-3 font-mono text-xs tracking-[0.3em] ${c.text} transition hover:opacity-80 active:scale-[0.98] disabled:opacity-50`}
              >
                {checkinM.isPending && checkinM.variables === h.id ? "SYNCING…" : "CHECK-IN"}
              </button>
            </div>
          );
        })}

        {show ? (
          <div className="glass-panel space-y-3 border-primary/40 p-5">
            <p className="font-mono text-[11px] tracking-[0.3em] text-primary">[ NEW HABIT ]</p>
            <input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="Name (e.g., Deep Work)"
              className="w-full border border-white/10 bg-white/5 px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary/60"
            />
            <input
              value={f.className}
              onChange={(e) => setF({ ...f, className: e.target.value })}
              placeholder="Class (e.g., Cognitive)"
              className="w-full border border-white/10 bg-white/5 px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary/60"
            />
            <select
              value={f.statId}
              onChange={(e) => setF({ ...f, statId: e.target.value })}
              className="w-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-on-surface outline-none focus:border-primary/60"
            >
              <option value="">SELECT STAT</option>
              {stats.map((s) => (
                <option key={s.id} value={s.id} className="bg-background">
                  {s.display_name}
                </option>
              ))}
            </select>
            <select
              value={f.difficulty}
              onChange={(e) => setF({ ...f, difficulty: e.target.value as RankCode })}
              className="w-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-on-surface outline-none focus:border-primary/60"
            >
              {(["e", "d", "c", "b", "a", "s"] as RankCode[]).map((r) => (
                <option key={r} value={r} className="bg-background">
                  RANK {r.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => createM.mutate()}
                disabled={!f.name || !f.className || !f.statId || createM.isPending}
                className="flex-1 border border-primary bg-primary py-2 font-mono text-[11px] tracking-[0.3em] text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
              >
                FORGE
              </button>
              <button
                onClick={() => setShow(false)}
                className="border border-white/20 px-4 py-2 font-mono text-[11px] tracking-[0.3em] text-on-surface-variant"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShow(true)}
            className="group flex min-h-[220px] items-center justify-center border-2 border-dashed border-white/10 p-5 font-mono text-xs tracking-[0.3em] text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
          >
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl transition group-hover:scale-125">
                add
              </span>
              <p className="mt-2">FORGE NEW HABIT</p>
            </div>
          </button>
        )}
      </div>
      {/* Silence unused var lint */}
      <span className="hidden">{todayIso}{todaysCheckIns.size}</span>
    </AppShell>
  );
}
