import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import {
  getHunterOverview,
  completeQuest,
  createCustomQuest,
  seedStarterQuests,
} from "@/lib/ascend.functions";
import { AppShell } from "@/components/ascend/AppShell";
import { LevelUpModal } from "@/components/ascend/LevelUpModal";
import { toast } from "sonner";
import { STAT_META, type StatCode } from "@/lib/progression";

export const Route = createFileRoute("/_authenticated/quests")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Daily Quests — Ascend" },
      { name: "description", content: "Today's system quests and custom missions." },
      { property: "og:title", content: "Daily Quests — Ascend" },
      { property: "og:description", content: "Clear your daily quests to gain XP." },
    ],
  }),
  component: QuestsPage,
});

function QuestsPage() {
  const fn = useServerFn(getHunterOverview);
  const q = useQuery(
    queryOptions({ queryKey: ["hunter-overview"], queryFn: () => fn() }),
  );
  const qc = useQueryClient();
  const complete = useServerFn(completeQuest);
  const create = useServerFn(createCustomQuest);
  const seed = useServerFn(seedStarterQuests);

  const completeM = useMutation({
    mutationFn: (id: string) => complete({ data: { questId: id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["hunter-overview"] });
      if (r?.xpGained) toast.success(`+${r.xpGained} XP acquired`);
    },
  });

  const seedM = useMutation({
    mutationFn: () => seed(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hunter-overview"] }),
  });

  const [showNew, setShowNew] = useState(false);
  const [nt, setNt] = useState({ title: "", statId: "", xp: 100, val: 3 });
  const createM = useMutation({
    mutationFn: () =>
      create({
        data: {
          title: nt.title,
          statId: nt.statId,
          xpReward: nt.xp,
          statValue: nt.val,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hunter-overview"] });
      setShowNew(false);
      setNt({ title: "", statId: "", xp: 100, val: 3 });
      toast.success("Quest initialized");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (q.isLoading || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs tracking-[0.4em] text-primary hologram-flicker">
          [ QUEST.LOAD ]
        </p>
      </div>
    );
  }

  const today = q.data.todayIso;
  const todaysQuests = q.data.quests.filter((qq) => qq.start_date === today);
  const systemQuests = todaysQuests.filter((qq) => qq.source === "system");
  const customQuests = todaysQuests.filter((qq) => qq.source === "custom");
  const completedCount = todaysQuests.filter((qq) => qq.completed_at).length;
  const total = todaysQuests.length || 5;

  return (
    <AppShell level={q.data.level} rank={q.data.rank}>
      {q.data.pendingLevelUp && <LevelUpModal event={q.data.pendingLevelUp} />}

      <section className="mb-8 space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[11px] tracking-[0.4em] text-secondary">
              [ CURRENT_PROGRESS ]
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
              {completedCount}/{total} Quests Complete
            </h1>
          </div>
        </div>
        <div className="flex h-3 w-full gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 border ${
                i < completedCount
                  ? "border-primary/40 bg-primary shadow-[0_0_10px_rgba(221,183,255,0.5)]"
                  : "border-white/5 bg-surface-container-high"
              }`}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          <div className="flex items-center gap-3 border-l-2 border-secondary pl-4">
            <span className="material-symbols-outlined text-secondary">shield</span>
            <h2 className="font-display text-lg uppercase tracking-widest text-on-surface">
              System Quests
            </h2>
          </div>
          {systemQuests.length === 0 ? (
            <button
              onClick={() => seedM.mutate()}
              disabled={seedM.isPending}
              className="w-full border-2 border-dashed border-white/10 p-8 font-mono text-xs tracking-[0.3em] text-on-surface-variant transition hover:border-secondary/40 hover:text-secondary"
            >
              [ SUMMON TODAY'S SYSTEM QUESTS ]
            </button>
          ) : (
            systemQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                stats={q.data!.stats}
                accent="secondary"
                onComplete={() => completeM.mutate(quest.id)}
              />
            ))
          )}
        </section>

        <section className="space-y-4 lg:col-span-5">
          <div className="flex items-center gap-3 border-l-2 border-primary pl-4">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            <h2 className="font-display text-lg uppercase tracking-widest text-on-surface">
              Custom Quests
            </h2>
          </div>
          {customQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              stats={q.data!.stats}
              accent="primary"
              onComplete={() => completeM.mutate(quest.id)}
            />
          ))}

          {showNew ? (
            <div className="glass-panel space-y-3 border-primary/40 p-5">
              <input
                value={nt.title}
                onChange={(e) => setNt({ ...nt, title: e.target.value })}
                placeholder="Quest title"
                className="w-full border border-white/10 bg-white/5 px-3 py-2 font-body text-sm text-on-surface outline-none focus:border-primary/60"
              />
              <select
                value={nt.statId}
                onChange={(e) => setNt({ ...nt, statId: e.target.value })}
                className="w-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-on-surface outline-none focus:border-primary/60"
              >
                <option value="">SELECT STAT</option>
                {q.data.stats.map((s) => (
                  <option key={s.id} value={s.id} className="bg-background">
                    {s.display_name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                    XP
                  </span>
                  <input
                    type="number"
                    value={nt.xp}
                    onChange={(e) => setNt({ ...nt, xp: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-primary outline-none focus:border-primary/60"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-on-surface-variant">
                    STAT+
                  </span>
                  <input
                    type="number"
                    step={0.5}
                    value={nt.val}
                    onChange={(e) => setNt({ ...nt, val: Number(e.target.value) })}
                    className="mt-1 w-full border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-tertiary outline-none focus:border-primary/60"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => createM.mutate()}
                  disabled={!nt.title || !nt.statId || createM.isPending}
                  className="flex-1 border border-primary bg-primary py-2 font-mono text-[11px] tracking-[0.3em] text-on-primary transition hover:bg-primary/90 disabled:opacity-50"
                >
                  INITIALIZE
                </button>
                <button
                  onClick={() => setShowNew(false)}
                  className="border border-white/20 px-4 py-2 font-mono text-[11px] tracking-[0.3em] text-on-surface-variant"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="group flex w-full items-center justify-center gap-2 border-2 border-dashed border-white/10 py-4 font-mono text-xs tracking-[0.3em] text-on-surface-variant transition hover:border-primary/50 hover:text-primary"
            >
              <span className="material-symbols-outlined transition group-hover:scale-125">
                add
              </span>
              INITIALIZE NEW QUEST
            </button>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function QuestCard({
  quest,
  stats,
  accent,
  onComplete,
}: {
  quest: {
    id: string;
    title: string;
    xp_reward: number;
    stat_id: string | null;
    completed_at: string | null;
  };
  stats: Array<{ id: string; code: string }>;
  accent: "primary" | "secondary";
  onComplete: () => void;
}) {
  const statCode = stats.find((s) => s.id === quest.stat_id)?.code as StatCode | undefined;
  const meta = statCode ? STAT_META[statCode] : null;
  const completed = !!quest.completed_at;
  const colorMap = {
    primary: {
      border: "border-primary/40",
      text: "text-primary",
      bg: "bg-primary",
      soft: "bg-primary-container/20",
      softBorder: "border-primary/50",
      glow: "glow-primary",
    },
    secondary: {
      border: "border-secondary/40",
      text: "text-secondary",
      bg: "bg-secondary",
      soft: "bg-secondary-container/20",
      softBorder: "border-secondary/50",
      glow: "glow-secondary",
    },
  }[accent];

  if (completed) {
    return (
      <div className="glass-panel flex items-center justify-between p-5 opacity-60">
        <div className="flex items-center gap-4">
          <div className={`grid h-10 w-10 place-items-center ${colorMap.soft} border ${colorMap.softBorder}`}>
            <span
              className={`material-symbols-outlined ${colorMap.text}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div>
            <h3 className={`font-display text-base text-on-surface line-through decoration-${accent}/50`}>
              {quest.title}
            </h3>
            <p className={`font-mono text-[11px] tracking-[0.2em] ${colorMap.text}`}>
              +{quest.xp_reward} XP {meta ? `[${meta.short}]` : ""}
            </p>
          </div>
        </div>
        <span className={`border ${colorMap.border}/50 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.3em] ${colorMap.text}`}>
          COMPLETED
        </span>
      </div>
    );
  }

  return (
    <div className={`glass-panel flex items-center justify-between p-5 ${colorMap.border} ${colorMap.glow}`}>
      <div className="flex items-center gap-4">
        <div className={`grid h-10 w-10 place-items-center ${colorMap.soft} border ${colorMap.softBorder}`}>
          <span className={`material-symbols-outlined ${colorMap.text}`}>
            {meta?.icon ?? "flag"}
          </span>
        </div>
        <div>
          <h3 className="font-display text-base text-on-surface">{quest.title}</h3>
          <p className={`font-mono text-[11px] tracking-[0.2em] ${colorMap.text}`}>
            +{quest.xp_reward} XP {meta ? `[${meta.short}]` : ""}
          </p>
        </div>
      </div>
      <button
        onClick={onComplete}
        aria-label="Complete quest"
        className={`grid h-9 w-9 place-items-center border-2 ${colorMap.border} transition hover:${colorMap.bg}`}
      >
        <span className={`material-symbols-outlined ${colorMap.text}`}>check</span>
      </button>
    </div>
  );
}
