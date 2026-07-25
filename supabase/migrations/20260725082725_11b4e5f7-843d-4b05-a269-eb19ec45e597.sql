
-- ===== ENUMS =====
CREATE TYPE public.stat_code AS ENUM ('str','vit','int','disc','will');
CREATE TYPE public.rank_code AS ENUM ('e','d','c','b','a','s');
CREATE TYPE public.quest_source AS ENUM ('system','custom');
CREATE TYPE public.quest_scope AS ENUM ('daily','weekly','monthly');

-- ===== PROFILES (user extension) =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hunter_name text NOT NULL DEFAULT 'Hunter',
  avatar_url text,
  epithet text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, hunter_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'hunter_name', split_part(NEW.email, '@', 1), 'Hunter'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== LOOKUP TABLES =====
CREATE TABLE public.stat_definition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.stat_code NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon text NOT NULL,
  sort_order int NOT NULL
);
GRANT SELECT ON public.stat_definition TO authenticated, anon;
GRANT ALL ON public.stat_definition TO service_role;
ALTER TABLE public.stat_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read stats" ON public.stat_definition FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.rank_definition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code public.rank_code NOT NULL UNIQUE,
  min_level int NOT NULL,
  sort_order int NOT NULL
);
GRANT SELECT ON public.rank_definition TO authenticated, anon;
GRANT ALL ON public.rank_definition TO service_role;
ALTER TABLE public.rank_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read ranks" ON public.rank_definition FOR SELECT TO authenticated, anon USING (true);

CREATE TABLE public.title_definition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unlock_condition text NOT NULL
);
GRANT SELECT ON public.title_definition TO authenticated;
GRANT ALL ON public.title_definition TO service_role;
ALTER TABLE public.title_definition ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read titles" ON public.title_definition FOR SELECT TO authenticated USING (true);

CREATE TABLE public.system_quest_template (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stat_id uuid REFERENCES public.stat_definition(id),
  xp_reward int NOT NULL,
  stat_value numeric,
  recurrence text NOT NULL DEFAULT 'daily'
);
GRANT SELECT ON public.system_quest_template TO authenticated;
GRANT ALL ON public.system_quest_template TO service_role;
ALTER TABLE public.system_quest_template ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read templates" ON public.system_quest_template FOR SELECT TO authenticated USING (true);

-- ===== USER-SCOPED =====
CREATE TABLE public.habit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_name text NOT NULL,
  stat_id uuid NOT NULL REFERENCES public.stat_definition(id),
  difficulty_rank public.rank_code NOT NULL DEFAULT 'e',
  xp_per_check_in int NOT NULL DEFAULT 10,
  stat_value_per_check_in numeric NOT NULL DEFAULT 1,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit TO authenticated;
GRANT ALL ON public.habit TO service_role;
ALTER TABLE public.habit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habit FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habit_check_in (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habit(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  xp_awarded int NOT NULL,
  stat_id uuid NOT NULL REFERENCES public.stat_definition(id),
  stat_value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_check_in TO authenticated;
GRANT ALL ON public.habit_check_in TO service_role;
ALTER TABLE public.habit_check_in ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own check-ins" ON public.habit_check_in FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.quest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source public.quest_source NOT NULL,
  scope public.quest_scope NOT NULL,
  source_template_id uuid REFERENCES public.system_quest_template(id),
  title text NOT NULL,
  boss_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_count int NOT NULL DEFAULT 1,
  linked_habit_id uuid REFERENCES public.habit(id) ON DELETE SET NULL,
  xp_reward int NOT NULL,
  stat_id uuid REFERENCES public.stat_definition(id),
  stat_value numeric,
  title_reward_id uuid REFERENCES public.title_definition(id),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_template_id, start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest TO authenticated;
GRANT ALL ON public.quest TO service_role;
ALTER TABLE public.quest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quests" ON public.quest FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.level_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  prev_level int NOT NULL,
  new_level int NOT NULL,
  prev_rank public.rank_code,
  new_rank public.rank_code,
  stat_id uuid REFERENCES public.stat_definition(id),
  prev_stat_value numeric,
  new_stat_value numeric,
  title_unlocked_id uuid REFERENCES public.title_definition(id),
  shared_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.level_event TO authenticated;
GRANT ALL ON public.level_event TO service_role;
ALTER TABLE public.level_event ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.level_event FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== SEED DATA =====
INSERT INTO public.stat_definition (code, display_name, icon, sort_order) VALUES
  ('str', 'Strength', 'fitness_center', 1),
  ('vit', 'Vitality', 'favorite', 2),
  ('int', 'Intelligence', 'psychology', 3),
  ('disc', 'Discipline', 'self_improvement', 4),
  ('will', 'Willpower', 'bolt', 5);

INSERT INTO public.rank_definition (code, min_level, sort_order) VALUES
  ('e', 1, 1),
  ('d', 10, 2),
  ('c', 25, 3),
  ('b', 50, 4),
  ('a', 100, 5),
  ('s', 200, 6);

INSERT INTO public.title_definition (name, unlock_condition) VALUES
  ('Novice Hunter', 'level>=1'),
  ('D-Rank Awakened', 'rank>=d'),
  ('C-Rank Certified', 'rank>=c'),
  ('B-Rank Elite', 'rank>=b'),
  ('A-Rank Ascendant', 'rank>=a'),
  ('S-Rank Monarch', 'rank>=s'),
  ('Iron Will', 'level>=25'),
  ('Shadow Monarch of Mornings', 'level>=50'),
  ('The One Who Overcomes', 'level>=75'),
  ('Wolf Slayer', 'level>=15'),
  ('Igris Vanquisher', 'level>=40'),
  ('Sovereign', 'level>=150');

INSERT INTO public.system_quest_template (title, xp_reward, stat_value, stat_id, recurrence)
SELECT t.title, t.xp, t.sv, s.id, 'daily'
FROM (VALUES
  ('Complete 50 Push-Ups', 30, 1.5, 'str'),
  ('Drink 8 Glasses of Water', 20, 1.0, 'vit'),
  ('Read for 30 Minutes', 25, 1.5, 'int'),
  ('Meditate for 10 Minutes', 25, 1.5, 'will'),
  ('Take a 20-Minute Walk', 20, 1.0, 'vit'),
  ('Write in Journal', 15, 1.0, 'disc'),
  ('No Sugar for the Day', 30, 1.5, 'disc'),
  ('Cold Shower', 35, 2.0, 'will')
) AS t(title, xp, sv, stat) 
JOIN public.stat_definition s ON s.code::text = t.stat;
