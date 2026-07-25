# Ascend — v1 MVP Build Plan

A gamified habit tracker with the "System" aesthetic. Auth via email + Google, five screens ported pixel-close from the Stitch designs, all progression (level, rank, XP, stats, streaks) derived at read time from check-ins and completed quests per the data model.

---

## 1. Enable Lovable Cloud + Auth

- Enable Lovable Cloud (Supabase under the hood).
- Configure email/password + Google via the social-auth broker.
- Auth page at `/auth` (sign in / sign up tabs) styled to match the System aesthetic.
- Onboarding step after first sign-up: collect `hunter_name` and optional `epithet`, write `user` row.

## 2. Database Schema (single migration)

Implements the data model verbatim, with RLS + grants:

- **Lookup tables (seeded):** `stat_definition`, `rank_definition`, `title_definition`, `system_quest_template`.
- **User-scoped tables:** `user`, `habit`, `habit_check_in`, `quest`, `level_event`.
- Enums: `stat_code`, `rank_code`, `quest_source`, `quest_scope`.
- RLS: user tables policy = `auth.uid() = user_id`; lookup tables readable by `authenticated`.
- Grants per template.
- Seed content (defaults):
  - 5 stats: STR / VIT / INT / DISC / WILL.
  - Ranks E→S with level thresholds (E:1, D:10, C:25, B:50, A:100, S:200).
  - ~12 titles (e.g. "Iron Will", "Shadow Monarch of Mornings", "Wolf Slayer", rank-based + raid-based).
  - ~8 system quest templates (push-ups, hydration, reading, meditation, cold shower, etc.).

## 3. Derivation Layer (server functions in `src/lib/progression.functions.ts`)

Everything derived, per the model's decision:

- `getHunterState(userId)` → `{ total_xp, level, rank, stat_totals[], current_streak, earned_titles[] }`
  - XP = sum of `habit_check_in.xp_awarded` + completed `quest.xp_reward`.
  - Level curve: level N requires `100 * N * (N+1) / 2` cumulative XP.
  - Rank = highest `rank_definition` where `min_level <= level`.
  - Stat totals = sum of `stat_value` grouped by `stat_id` across check-ins + completed quests.
  - Streak = longest consecutive-day chain ending today across all check-ins.
  - Earned titles = evaluate each `title_definition.unlock_condition` (parser supports `rank>=X`, `raid:<slug>:completed`, `level>=N`).
- `checkInHabit(habitId)` → inserts `habit_check_in`, compares pre/post derived level+rank+stats, and if a threshold crossed, inserts a `level_event` snapshot.
- `completeQuest(questId)` → sets `completed_at`, same level_event evaluation.
- `getDailyBoard(userId)` → ensures today's system quests exist (spawns from templates on first read of the day), returns hybrid daily list.
- `getRaids(userId, scope)` → weekly/monthly quests with derived progress (`count(check_ins WHERE date BETWEEN start_date AND end_date AND habit_id = linked_habit_id) / target_count`).

## 4. Design System (`src/styles.css`)

Port the DESIGN.md tokens verbatim:

- OKLCH conversions of the Monarch Purple (`#ddb7ff`), Mana Blue (`#adc6ff`), Legendary Gold (`#f9bd22`), void-black surfaces, outline variants.
- Fonts loaded via `<link>` in `__root.tsx`: Space Grotesk (display/headline), Inter (body), JetBrains Mono (data/labels).
- Utilities for glass panels (`.glass-panel`: 10% white bg + 16px backdrop-blur + 1px `#ffffff10` border), sharp corners (radius 0), chamfered corner clip-path, luminous hover glow, segmented progress bars.

## 5. Routes & Screens (pixel-close ports of the Stitch HTML)

Public:
- `/` — Landing (hero + sign-in CTA, brief pitch).
- `/auth` — Sign in / sign up.

Under `_authenticated/`:
- `/dashboard` (default post-login) → **Hunter Profile** screen: status bar, rank plaque, level/XP bar, hex radar of stats, titles, level_event feed.
- `/quests` → **Daily Quest Board**: today's hybrid list (system + custom), completion toggles, XP tallies, "+ Add Custom Quest" sheet.
- `/habits` → **Habit List**: grouped by Class, difficulty chip, streak, per-habit stat mapping, Check-In button, "+ New Class" form (name, class label, stat, difficulty).
- `/raids` → **Weekly Raids** (also monthly): raid cards with boss_name, progress bar `X/target_count`, XP + title reward, tabs Weekly | Monthly.
- `/level-up/$eventId` → **Level Up** celebration: full-screen animated set-piece from a `level_event` row. Auto-invoked after a check-in that spawns an event (client stashes newest event id and navigates).

Each route file gets its own `head()` (title, description, og:title/description). No og:image on `__root`.

## 6. Interaction & Motion

- Check-in tap: card pulses primary, XP counter tweens up, stat delta chip animates in.
- Level-up: full-screen overlay with radial glow, "SYSTEM" preamble, before/after level + stat comparison from `level_event`.
- Rank-up variant of the same screen when `new_rank` differs; renders a "Shareable Card" (PNG-ready DOM) at the bottom.
- All motion via Motion for React; keep respect for `prefers-reduced-motion`.

## 7. Data Fetching

- TanStack Query with `ensureQueryData` in loaders, `useSuspenseQuery` in components.
- Mutations: `checkInHabit`, `completeQuest`, `createHabit`, `createCustomQuest` — invalidate `hunterState`, board, habits, raids on success.

## 8. Out of Scope (v2)

Per brief: guilds/social, public leaderboards, PWA offline sync, penalty/decay beyond streak reset, cosmetic marketplace, native apps.

---

## Technical notes

- Level curve constants live in `src/lib/progression-config.ts` for easy tuning.
- `system_quest_template` → `quest` spawn is lazy on first daily read (no cron needed); idempotent by `(user_id, source_template_id, start_date)`.
- `level_event` snapshots are the only "denormalized" write, matching the model's stated exception.
- Streak grace ("streak freeze") is deferred to v2; MVP uses strict consecutive-day streaks derived from `habit_check_in.date`.
- All 5 Stitch HTMLs live in `/tmp` for reference during the port; I'll match structure, spacing, and copy 1:1 while wiring live data.

## Open items I'll assume unless you say otherwise

- **Level curve**: cumulative `100·N·(N+1)/2` (level 1→2 needs 100 XP, 2→3 needs 200, …). Feels right for a first-week tempo of ~2 check-ins/day landing D-rank around 3–4 weeks. Tell me if you want a steeper or flatter curve.
- **Streak definition**: any check-in on any tracked habit that day counts as a "streak day". Alternative is per-habit streaks; the Stitch designs show one global streak, so I'll go with that.
- **Rank-up thresholds**: purely level-gated in v1 (matches `rank_definition.min_level`). The brief mentions "gated by consistency too" — I'll add a secondary check (e.g. 7-day streak required) in v2 rather than complicate MVP.
