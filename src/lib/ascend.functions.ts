import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { levelFromXp, rankFromLevel, type RankCode } from "./progression";

/** Aggregates a hunter's XP + stat totals from raw events. */
export const getHunterOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profileRes, statsRes, checkInsRes, questsRes, habitsRes, levelEventsRes] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("stat_definition").select("*").order("sort_order"),
        supabase
          .from("habit_check_in")
          .select("stat_id, stat_value, xp_awarded, date, habit_id")
          .eq("user_id", userId),
        supabase
          .from("quest")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("habit")
          .select("*")
          .eq("user_id", userId)
          .eq("is_archived", false),
        supabase
          .from("level_event")
          .select("*")
          .eq("user_id", userId)
          .is("shared_at", null)
          .order("occurred_at", { ascending: false })
          .limit(1),
      ]);

    if (statsRes.error) throw statsRes.error;
    const stats = statsRes.data ?? [];

    const checkIns = checkInsRes.data ?? [];
    const quests = questsRes.data ?? [];
    const habits = habitsRes.data ?? [];

    // Sum XP from check-ins + completed quests
    let totalXp = 0;
    const statTotals: Record<string, number> = {};
    for (const s of stats) statTotals[s.id] = 0;

    for (const ci of checkIns) {
      totalXp += ci.xp_awarded ?? 0;
      statTotals[ci.stat_id] = (statTotals[ci.stat_id] ?? 0) + Number(ci.stat_value ?? 0);
    }
    for (const q of quests) {
      if (q.completed_at) {
        totalXp += q.xp_reward ?? 0;
        if (q.stat_id)
          statTotals[q.stat_id] = (statTotals[q.stat_id] ?? 0) + Number(q.stat_value ?? 0);
      }
    }

    const level = levelFromXp(totalXp);
    const rank = rankFromLevel(level);

    // streak per habit: consecutive days ending today with a check-in
    const today = new Date();
    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const habitStreaks: Record<string, number> = {};
    for (const h of habits) {
      const set = new Set(
        checkIns.filter((c) => c.habit_id === h.id).map((c) => c.date as string),
      );
      let streak = 0;
      const cursor = new Date(today);
      while (set.has(toKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      habitStreaks[h.id] = streak;
    }

    return {
      profile: profileRes.data,
      stats,
      totalXp,
      level,
      rank: rank as RankCode,
      statTotals,
      habits,
      habitStreaks,
      quests,
      pendingLevelUp: levelEventsRes.data?.[0] ?? null,
      todayIso: toKey(today),
    };
  });

/** Check-in a habit for a given date (defaults today). */
export const checkInHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ habitId: z.string().uuid(), date: z.string().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = data.date ?? new Date().toISOString().slice(0, 10);

    const { data: habit, error: hErr } = await supabase
      .from("habit")
      .select("*")
      .eq("id", data.habitId)
      .eq("user_id", userId)
      .maybeSingle();
    if (hErr) throw hErr;
    if (!habit) throw new Error("Habit not found");

    // Prev XP snapshot for level-up detection
    const prev = await computeTotals(supabase, userId);

    const { error } = await supabase.from("habit_check_in").insert({
      habit_id: habit.id,
      user_id: userId,
      date,
      stat_id: habit.stat_id,
      stat_value: habit.stat_value_per_check_in,
      xp_awarded: habit.xp_per_check_in,
    });
    if (error) throw error;

    const next = await computeTotals(supabase, userId);
    await maybeRecordLevelEvent(supabase, userId, prev, next, habit.stat_id);

    return { ok: true, xpGained: habit.xp_per_check_in, statGained: habit.stat_value_per_check_in };
  });

export const createHabit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        className: z.string().min(1).max(40),
        statId: z.string().uuid(),
        difficulty: z.enum(["e", "d", "c", "b", "a", "s"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const rankXp: Record<string, number> = { e: 20, d: 35, c: 60, b: 100, a: 175, s: 300 };
    const rankStat: Record<string, number> = { e: 1, d: 2, c: 4, b: 7, a: 12, s: 20 };
    const { error, data: row } = await supabase
      .from("habit")
      .insert({
        user_id: userId,
        name: data.name,
        class_name: data.className,
        stat_id: data.statId,
        difficulty_rank: data.difficulty,
        xp_per_check_in: rankXp[data.difficulty],
        stat_value_per_check_in: rankStat[data.difficulty],
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const createCustomQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().min(1).max(120),
        statId: z.string().uuid(),
        xpReward: z.number().int().min(10).max(2000),
        statValue: z.number().min(0).max(50),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    const { data: row, error } = await supabase
      .from("quest")
      .insert({
        user_id: userId,
        source: "custom",
        scope: "daily",
        title: data.title,
        stat_id: data.statId,
        xp_reward: data.xpReward,
        stat_value: data.statValue,
        start_date: today,
        end_date: today,
        target_count: 1,
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const completeQuest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ questId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quest } = await supabase
      .from("quest")
      .select("*")
      .eq("id", data.questId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!quest) throw new Error("Quest not found");
    if (quest.completed_at) return { ok: true, already: true };

    const prev = await computeTotals(supabase, userId);
    const { error } = await supabase
      .from("quest")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", quest.id);
    if (error) throw error;
    const next = await computeTotals(supabase, userId);
    await maybeRecordLevelEvent(supabase, userId, prev, next, quest.stat_id);
    return { ok: true, xpGained: quest.xp_reward };
  });

export const dismissLevelEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ eventId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase
      .from("level_event")
      .update({ shared_at: new Date().toISOString() })
      .eq("id", data.eventId)
      .eq("user_id", userId);
    return { ok: true };
  });

export const seedStarterQuests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    // Skip if user already has any quests today
    const { data: existing } = await supabase
      .from("quest")
      .select("id")
      .eq("user_id", userId)
      .eq("start_date", today)
      .limit(1);
    if (existing && existing.length > 0) return { ok: true, seeded: 0 };

    const { data: templates } = await supabase.from("system_quest_template").select("*").limit(5);
    if (!templates?.length) return { ok: true, seeded: 0 };

    const rows = templates.map((t) => ({
      user_id: userId,
      source: "system" as const,
      scope: "daily" as const,
      title: t.title,
      stat_id: t.stat_id,
      xp_reward: t.xp_reward,
      stat_value: t.stat_value,
      source_template_id: t.id,
      start_date: today,
      end_date: today,
      target_count: 1,
    }));
    const { error } = await supabase.from("quest").insert(rows);
    if (error) throw error;
    return { ok: true, seeded: rows.length };
  });

// --- helpers (server-only, not exported as fns) ---

async function computeTotals(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<{ totalXp: number; byStat: Record<string, number> }> {
  const [ci, q] = await Promise.all([
    supabase.from("habit_check_in").select("xp_awarded, stat_id, stat_value").eq("user_id", userId),
    supabase
      .from("quest")
      .select("xp_reward, stat_id, stat_value, completed_at")
      .eq("user_id", userId),
  ]);
  let totalXp = 0;
  const byStat: Record<string, number> = {};
  for (const r of ci.data ?? []) {
    totalXp += r.xp_awarded ?? 0;
    byStat[r.stat_id] = (byStat[r.stat_id] ?? 0) + Number(r.stat_value ?? 0);
  }
  for (const r of q.data ?? []) {
    if (!r.completed_at) continue;
    totalXp += r.xp_reward ?? 0;
    if (r.stat_id) byStat[r.stat_id] = (byStat[r.stat_id] ?? 0) + Number(r.stat_value ?? 0);
  }
  return { totalXp, byStat };
}

async function maybeRecordLevelEvent(
  supabase: { from: (t: string) => any },
  userId: string,
  prev: { totalXp: number; byStat: Record<string, number> },
  next: { totalXp: number; byStat: Record<string, number> },
  statId: string | null,
) {
  const prevLevel = levelFromXp(prev.totalXp);
  const newLevel = levelFromXp(next.totalXp);
  if (newLevel <= prevLevel) return;
  const prevRank = rankFromLevel(prevLevel);
  const newRank = rankFromLevel(newLevel);
  await supabase.from("level_event").insert({
    user_id: userId,
    prev_level: prevLevel,
    new_level: newLevel,
    prev_rank: prevRank,
    new_rank: newRank,
    stat_id: statId,
    prev_stat_value: statId ? prev.byStat[statId] ?? 0 : null,
    new_stat_value: statId ? next.byStat[statId] ?? 0 : null,
  });
}
