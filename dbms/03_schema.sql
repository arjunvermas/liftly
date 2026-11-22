-- =============================================================================
-- Liftly — PostgreSQL / Supabase Database Schema
-- File: dbms/03_schema.sql
-- =============================================================================
-- Tables (9):
--   1. users                  — User accounts and authentication credentials
--   2. profiles               — 1:1 fitness profile per user
--   3. exercises              — Exercise catalog with muscle tags & media URLs
--   4. workout_programs       — Default library and user-created workout splits
--   5. program_days           — Individual training days within a program
--   6. program_day_exercises  — Ordered exercise prescriptions per program day
--   7. user_active_programs   — Currently active workout program per user (1:1)
--   8. workout_logs           — Completed workout session headers
--   9. workout_sets           — Individual logged sets within a workout session
-- =============================================================================

-- Required for gen_random_uuid() on PostgreSQL < 13 (built-in on PG 13+/Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. IDENTITY & USER PROFILES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(30) UNIQUE NOT NULL
                          CHECK (char_length(username) >= 3 AND username ~ '^[a-z0-9_]+$'),
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    name              VARCHAR(100),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login_at     TIMESTAMP,
    email_verified_at TIMESTAMP,
    followers_count   INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
    following_count   INTEGER NOT NULL DEFAULT 0 CHECK (following_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.profiles (
    user_id          UUID PRIMARY KEY
                         REFERENCES public.users(id) ON DELETE CASCADE,
    avatar_url       TEXT,
    bio              TEXT DEFAULT '',
    height_cm        NUMERIC(5, 2) NOT NULL
                         CHECK (height_cm >= 50 AND height_cm <= 280),
    weight_kg        NUMERIC(5, 2) NOT NULL
                         CHECK (weight_kg >= 20 AND weight_kg <= 400),
    fitness_goal     TEXT NOT NULL
                         CHECK (
                             fitness_goal IN (
                                 'hypertrophy',
                                 'strength',
                                 'endurance',
                                 'weight_loss',
                                 'general_fitness'
                             )
                         ),
    experience_level TEXT NOT NULL DEFAULT 'beginner'
                         CHECK (
                             experience_level IN (
                                 'beginner',
                                 'intermediate',
                                 'advanced'
                             )
                         ),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. EXERCISE CATALOG
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exercises (
    id             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    name           TEXT NOT NULL CHECK (char_length(name) >= 2),
    body_part      TEXT NOT NULL,
    target_muscles TEXT[] NOT NULL CHECK (cardinality(target_muscles) >= 1),
    equipment      TEXT NULL DEFAULT 'none'::text,
    gif_url        TEXT NULL,
    image_url      TEXT NULL,
    CONSTRAINT exercises_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- 3. WORKOUT PROGRAMS & SPLITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workout_programs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 100),
    description   TEXT,
    days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
    is_default    BOOLEAN NOT NULL DEFAULT false,
    user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE DEFAULT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.program_days (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL
                   REFERENCES public.workout_programs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    day_name   TEXT NOT NULL CHECK (char_length(day_name) BETWEEN 1 AND 100),
    focus      TEXT NOT NULL CHECK (char_length(focus) BETWEEN 1 AND 50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_program_days_program_day_number UNIQUE (program_id, day_number)
);

CREATE TABLE IF NOT EXISTS public.program_day_exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id UUID NOT NULL
                       REFERENCES public.program_days(id) ON DELETE CASCADE,
    exercise_id    TEXT NOT NULL
                       REFERENCES public.exercises(id) ON DELETE RESTRICT,
    order_index    INTEGER NOT NULL CHECK (order_index >= 1),
    target_sets    INTEGER NOT NULL CHECK (target_sets BETWEEN 1 AND 20),
    target_reps    TEXT NOT NULL CHECK (char_length(target_reps) BETWEEN 1 AND 20),
    rest_seconds   INTEGER NOT NULL DEFAULT 90
                       CHECK (rest_seconds BETWEEN 0 AND 600),
    notes          TEXT,
    CONSTRAINT uq_program_day_exercises_order UNIQUE (program_day_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.user_active_programs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL UNIQUE
                   REFERENCES public.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL
                   REFERENCES public.workout_programs(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. WORKOUT SESSION LOGGING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workout_logs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL
                         REFERENCES public.users(id) ON DELETE CASCADE,
    program_day_id   UUID
                         REFERENCES public.program_days(id) ON DELETE SET NULL,
    title            TEXT NOT NULL DEFAULT 'Workout Session',
    duration_minutes INTEGER CHECK (duration_minutes >= 0),
    notes            TEXT,
    completed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_sets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_log_id UUID NOT NULL
                       REFERENCES public.workout_logs(id) ON DELETE CASCADE,
    exercise_id    TEXT NOT NULL
                       REFERENCES public.exercises(id) ON DELETE RESTRICT,
    set_number     INTEGER NOT NULL CHECK (set_number >= 1),
    reps           INTEGER NOT NULL CHECK (reps >= 0),
    weight_kg      NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
    rpe            NUMERIC(3, 1) CHECK (rpe BETWEEN 1 AND 10),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. INDEXES
-- =============================================================================

-- Exercise filtering (GET /api/workouts)
CREATE INDEX IF NOT EXISTS idx_exercises_body_part
    ON public.exercises (body_part);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment
    ON public.exercises (equipment);
CREATE INDEX IF NOT EXISTS idx_exercises_target_muscles
    ON public.exercises USING GIN (target_muscles);

-- Programs & nested structure (GET /api/programs, GET /api/programs/:id)
CREATE INDEX IF NOT EXISTS idx_workout_programs_user_id
    ON public.workout_programs (user_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_is_default
    ON public.workout_programs (is_default);
CREATE INDEX IF NOT EXISTS idx_program_days_program_id
    ON public.program_days (program_id);
CREATE INDEX IF NOT EXISTS idx_program_day_exercises_day_id
    ON public.program_day_exercises (program_day_id);
CREATE INDEX IF NOT EXISTS idx_program_day_exercises_exercise_id
    ON public.program_day_exercises (exercise_id);

-- Active program lookup
CREATE INDEX IF NOT EXISTS idx_user_active_programs_program_id
    ON public.user_active_programs (program_id);

-- Session history & set lookups (GET /api/sessions, GET /api/sessions/:id)
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id
    ON public.workout_logs (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_program_day_id
    ON public.workout_logs (program_day_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_log_id
    ON public.workout_sets (workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id
    ON public.workout_sets (exercise_id);

-- =============================================================================
-- 6. UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workout_programs_updated_at ON public.workout_programs;
CREATE TRIGGER trg_workout_programs_updated_at
    BEFORE UPDATE ON public.workout_programs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.user_active_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
