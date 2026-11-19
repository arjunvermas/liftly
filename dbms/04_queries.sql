-- =============================================================================
-- Liftly: SQL queries used by the app
-- File: dbms/04_queries.sql
-- =============================================================================
-- The backend (Node.js) talks to PostgreSQL through the Supabase client, so each
-- query below is the SQL equivalent of a Supabase call in backend/src/controllers.
-- Values such as UUIDs and emails are sample values; the app passes real ones.
-- Ids: R1.. are reads, W1.. are writes.
--   Sample user    = 11111111-1111-1111-1111-111111111111
--   Sample program = 22222222-2222-2222-2222-222222222222
--   Sample day     = 33333333-3333-3333-3333-333333333333
--   Sample log     = 44444444-4444-4444-4444-444444444444
-- =============================================================================


-- #############################################################################
-- READ QUERIES
-- #############################################################################

-- R1: Register: check if the email or username is already taken
-- Used by: auth.controller.js registerUser
-- READ
SELECT id
FROM users
WHERE email = 'asha@example.com' OR username = 'asha_fit'
LIMIT 1;

-- R2: Login: find the user by email or username (identifier)
-- Used by: auth.controller.js loginUser
-- READ
SELECT id, username, email, name, password_hash
FROM users
WHERE email = 'asha_fit' OR username = 'asha_fit'
LIMIT 1;

-- R3: Fetch a user's fitness profile
-- Used by: auth.controller.js loginUser, getMe, googleAuth
-- READ
SELECT avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level
FROM profiles
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- R4: Get the logged-in user's account details
-- Used by: auth.controller.js getMe
-- READ
SELECT id, username, email, name, created_at
FROM users
WHERE id = '11111111-1111-1111-1111-111111111111';

-- R5: Update account: check the new email or username is not used by someone else
-- Used by: auth.controller.js updateUser
-- READ
SELECT id
FROM users
WHERE (email = 'new@example.com' OR username = 'new_name')
  AND id <> '11111111-1111-1111-1111-111111111111'
LIMIT 1;

-- R6: Google sign-in: find the user by email
-- Used by: auth.controller.js googleAuth
-- READ
SELECT id, username, email, name
FROM users
WHERE email = 'asha@example.com';

-- R7: List all workout programs
-- Used by: program.controller.js getAllPrograms (GET /api/programs)
-- READ
SELECT id, title, description, days_per_week, is_default, created_at
FROM workout_programs
ORDER BY created_at ASC;

-- R8: Program details: program with its days, each day's exercises, and exercise names
-- Used by: program.controller.js getProgramById (GET /api/programs/:id)
-- READ
SELECT wp.id, wp.title, wp.description, wp.days_per_week,
       pd.id AS day_id, pd.day_number, pd.day_name, pd.focus,
       pde.id AS day_exercise_id, pde.order_index, pde.target_sets, pde.target_reps,
       pde.rest_seconds, pde.notes,
       e.id AS exercise_id, e.name AS exercise_name, e.body_part
FROM workout_programs wp
LEFT JOIN program_days pd           ON pd.program_id = wp.id
LEFT JOIN program_day_exercises pde ON pde.program_day_id = pd.id
LEFT JOIN exercises e               ON e.id = pde.exercise_id
WHERE wp.id = '22222222-2222-2222-2222-222222222222'
ORDER BY pd.day_number, pde.order_index;

-- R9: Activate program: check that the program exists
-- Used by: program.controller.js activateProgram
-- READ
SELECT id, title
FROM workout_programs
WHERE id = '22222222-2222-2222-2222-222222222222';

-- R10: The user's active program with all days, exercises and full exercise details
-- Used by: program.controller.js getActiveProgram
-- READ
SELECT uap.id AS active_id, uap.started_at,
       wp.id AS program_id, wp.title, wp.description, wp.days_per_week,
       pd.id AS day_id, pd.day_number, pd.day_name, pd.focus,
       pde.id AS day_exercise_id, pde.order_index, pde.target_sets, pde.target_reps,
       pde.rest_seconds, pde.notes,
       e.id AS exercise_id, e.name AS exercise_name, e.body_part, e.target_muscles,
       e.equipment, e.gif_url, e.image_url
FROM user_active_programs uap
JOIN workout_programs wp            ON wp.id = uap.program_id
LEFT JOIN program_days pd           ON pd.program_id = wp.id
LEFT JOIN program_day_exercises pde ON pde.program_day_id = pd.id
LEFT JOIN exercises e               ON e.id = pde.exercise_id
WHERE uap.user_id = '11111111-1111-1111-1111-111111111111'
ORDER BY pd.day_number, pde.order_index;

-- R11: Log a workout: look up the day name to use as the session title
-- Used by: session.controller.js logWorkoutSession (only when no title is given)
-- READ
SELECT day_name
FROM program_days
WHERE id = '33333333-3333-3333-3333-333333333333';

-- R12: Workout history: total number of sessions (for pagination)
-- Used by: session.controller.js getWorkoutHistory
-- READ
SELECT count(*)
FROM workout_logs
WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- R13: Workout history: one page of sessions with their sets and exercise details
-- Used by: session.controller.js getWorkoutHistory (GET /api/sessions, page 1, limit 20)
-- The page of sessions is chosen first, so LIMIT counts sessions and not joined rows.
-- READ
WITH page AS (
    SELECT id, program_day_id, title, duration_minutes, notes, completed_at
    FROM workout_logs
    WHERE user_id = '11111111-1111-1111-1111-111111111111'
    ORDER BY completed_at DESC
    LIMIT 20 OFFSET 0
)
SELECT p.id, p.program_day_id, p.title, p.duration_minutes, p.notes, p.completed_at,
       ws.id AS set_id, ws.set_number, ws.reps, ws.weight_kg, ws.rpe,
       e.id AS exercise_id, e.name AS exercise_name, e.body_part, e.target_muscles,
       e.equipment, e.gif_url, e.image_url
FROM page p
LEFT JOIN workout_sets ws ON ws.workout_log_id = p.id
LEFT JOIN exercises e     ON e.id = ws.exercise_id
ORDER BY p.completed_at DESC, ws.set_number;

-- R14: One workout session with its sets and exercise details (own sessions only)
-- Used by: session.controller.js getWorkoutSessionById (GET /api/sessions/:id)
-- READ
SELECT wl.id, wl.program_day_id, wl.title, wl.duration_minutes, wl.notes, wl.completed_at,
       ws.id AS set_id, ws.set_number, ws.reps, ws.weight_kg, ws.rpe,
       e.id AS exercise_id, e.name AS exercise_name, e.body_part, e.target_muscles,
       e.equipment, e.gif_url, e.image_url
FROM workout_logs wl
LEFT JOIN workout_sets ws ON ws.workout_log_id = wl.id
LEFT JOIN exercises e     ON e.id = ws.exercise_id
WHERE wl.id = '44444444-4444-4444-4444-444444444444'
  AND wl.user_id = '11111111-1111-1111-1111-111111111111'
ORDER BY ws.set_number;

-- R15: Browse and filter exercises (every filter is optional; all are shown here)
-- Used by: workout.controller.js Workouts (GET /api/workouts), page 1, limit 50
-- READ
SELECT *
FROM exercises
WHERE name ILIKE '%press%'
  AND body_part = 'chest'
  AND target_muscles @> ARRAY['pectorals']::text[]
  AND equipment = 'barbell'
ORDER BY name ASC
LIMIT 50 OFFSET 0;

-- R16: Number of exercises matching the same filters (for pagination)
-- Used by: workout.controller.js Workouts
-- READ
SELECT count(*)
FROM exercises
WHERE name ILIKE '%press%'
  AND body_part = 'chest'
  AND target_muscles @> ARRAY['pectorals']::text[]
  AND equipment = 'barbell';


-- #############################################################################
-- WRITE QUERIES
-- #############################################################################

-- W1: Register: create the user account
-- Used by: auth.controller.js registerUser
-- WRITE
INSERT INTO users (username, email, name, password_hash)
VALUES ('asha_fit', 'asha@example.com', 'Asha', '$2b$10$sampleHashSampleHashSampleHashSampleHashSampleHash')
RETURNING *;

-- W2: Google sign-in: create the user on first login
-- Used by: auth.controller.js googleAuth
-- WRITE
INSERT INTO users (username, email, name, password_hash)
VALUES ('asha_1a2b3c4d', 'asha@example.com', 'Asha', '$2b$10$sampleHashSampleHashSampleHashSampleHashSampleHash')
RETURNING id, username, email, name;

-- W3: Register: create the fitness profile for the new user
-- Used by: auth.controller.js registerUser
-- WRITE
INSERT INTO profiles (user_id, avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level)
VALUES ('11111111-1111-1111-1111-111111111111',
        'https://api.dicebear.com/7.x/initials/svg?seed=asha_fit',
        '', 165, 60, 'general_fitness', 'beginner')
RETURNING avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level;

-- W4: Register: undo the user if creating the profile failed
-- Used by: auth.controller.js registerUser (error path)
-- WRITE
DELETE FROM users
WHERE id = '11111111-1111-1111-1111-111111111111';

-- W5: Update account details (the app only sets the fields that were sent)
-- Used by: auth.controller.js updateUser
-- WRITE
UPDATE users
SET name = 'Asha K', username = 'new_name', email = 'new@example.com'
WHERE id = '11111111-1111-1111-1111-111111111111'
RETURNING id, username, email, name, created_at;

-- W6: Update fitness profile (the app only sets the fields that were sent)
-- Used by: auth.controller.js updateProfile
-- WRITE
UPDATE profiles
SET bio = 'Lifting 4 days a week', height_cm = 170, weight_kg = 62,
    fitness_goal = 'strength', experience_level = 'intermediate'
WHERE user_id = '11111111-1111-1111-1111-111111111111'
RETURNING avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level;

-- W7: Create a custom workout program
-- Used by: program.controller.js createProgram (POST /api/programs)
-- WRITE
INSERT INTO workout_programs (title, description, days_per_week, is_default, user_id)
VALUES ('Push Pull Legs', 'Three day split', 3, false, '11111111-1111-1111-1111-111111111111')
RETURNING id, title, description, days_per_week, is_default, user_id, created_at;

-- W8: Create the days of the new program
-- Used by: program.controller.js createProgram
-- WRITE
INSERT INTO program_days (program_id, day_number, day_name, focus)
VALUES ('22222222-2222-2222-2222-222222222222', 1, 'Push Day', 'Chest'),
       ('22222222-2222-2222-2222-222222222222', 2, 'Pull Day', 'Back')
RETURNING id, day_number;

-- W9: Add exercises to the days of the new program
-- Used by: program.controller.js createProgram
-- WRITE
INSERT INTO program_day_exercises
    (program_day_id, exercise_id, order_index, target_sets, target_reps, rest_seconds, notes)
VALUES ('33333333-3333-3333-3333-333333333333', 'exercise-id-1', 1, 4, '8-10', 90, NULL),
       ('33333333-3333-3333-3333-333333333333', 'exercise-id-2', 2, 3, '10-12', 60, 'Slow tempo');

-- W10: Create program: undo the program if a later insert failed (days and exercises cascade)
-- Used by: program.controller.js createProgram (error path)
-- WRITE
DELETE FROM workout_programs
WHERE id = '22222222-2222-2222-2222-222222222222';

-- W11: Activate a program for the user (insert, or replace the user's current one)
-- Used by: program.controller.js activateProgram
-- WRITE
INSERT INTO user_active_programs (user_id, program_id, started_at)
VALUES ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now())
ON CONFLICT (user_id)
DO UPDATE SET program_id = EXCLUDED.program_id, started_at = EXCLUDED.started_at
RETURNING id, user_id, program_id, started_at;

-- W12: Log a completed workout session (header row)
-- Used by: session.controller.js logWorkoutSession (POST /api/sessions)
-- WRITE
INSERT INTO workout_logs (user_id, program_day_id, title, duration_minutes, notes)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333',
        'Push Day', 55, 'Felt strong')
RETURNING id, user_id, program_day_id, title, duration_minutes, notes, completed_at;

-- W13: Log the sets of the session and return them with their exercise details
-- Used by: session.controller.js logWorkoutSession
-- WRITE
WITH inserted AS (
    INSERT INTO workout_sets (workout_log_id, exercise_id, set_number, reps, weight_kg, rpe)
    VALUES ('44444444-4444-4444-4444-444444444444', 'exercise-id-1', 1, 10, 60, 8),
           ('44444444-4444-4444-4444-444444444444', 'exercise-id-1', 2, 8, 62.5, NULL)
    RETURNING id, workout_log_id, exercise_id, set_number, reps, weight_kg, rpe
)
SELECT i.id, i.set_number, i.reps, i.weight_kg, i.rpe,
       e.id AS exercise_id, e.name AS exercise_name, e.body_part, e.target_muscles,
       e.equipment, e.gif_url, e.image_url
FROM inserted i
JOIN exercises e ON e.id = i.exercise_id;

-- W14: Log a workout: undo the session header if inserting the sets failed
-- Used by: session.controller.js logWorkoutSession (error path)
-- WRITE
DELETE FROM workout_logs
WHERE id = '44444444-4444-4444-4444-444444444444';

-- W15: Delete one of the user's own workout sessions (its sets cascade)
-- Used by: session.controller.js deleteWorkoutSession (DELETE /api/sessions/:id)
-- WRITE
DELETE FROM workout_logs
WHERE id = '44444444-4444-4444-4444-444444444444'
  AND user_id = '11111111-1111-1111-1111-111111111111'
RETURNING id;

-- W16: Add a new exercise to the catalog
-- Used by: workout.controller.js createExerciseController (POST /api/workouts)
-- WRITE
INSERT INTO exercises (name, body_part, target_muscles, equipment, gif_url, image_url)
VALUES ('Bench Press', 'chest', ARRAY['pectorals', 'triceps'], 'barbell',
        'https://ik.imagekit.io/sample/exercises/videos/bench-press-demo.mp4',
        'https://ik.imagekit.io/sample/exercises/images/bench-press-thumb.jpg')
RETURNING *;

-- W17: Delete an exercise from the catalog
-- Used by: workout.controller.js deleteExerciseController
-- WRITE
DELETE FROM exercises
WHERE id = 'exercise-id-1'
RETURNING *;
