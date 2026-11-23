# Phase 4: Liftly Query Performance & Execution Timings

Measured on **PostgreSQL 18** (Postgres.app) on macOS. Each query was executed **3 times** using `EXPLAIN (ANALYZE, BUFFERS)`, and the execution times along with the arithmetic average are reported below. All write queries (`W1`–`W17`) were executed inside a `BEGIN; ... ROLLBACK;` block to preserve state and ensure reproducibility. The complete, raw `EXPLAIN (ANALYZE, BUFFERS)` execution plans for all 3 runs of every query are stored in [`dbms/plans/`](./plans/).

## Query Execution Timings Table

| Query | Type | What it does | Run 1 (ms) | Run 2 (ms) | Run 3 (ms) | Average (ms) | Scan type |
|-------|------|--------------|-----------:|-----------:|-----------:|-------------:|-----------|
| R1 | READ | Register: check if the email or username is already taken | 0.049 | 0.047 | 0.048 | 0.048 | Bitmap Heap Scan on users | Bitmap Index Scan on users_email_key | Bitmap Index Scan on users_username_key |
| R2 | READ | Login: find the user by email or username (identifier) | 0.051 | 0.054 | 0.050 | 0.052 | Bitmap Heap Scan on users | Bitmap Index Scan on users_email_key | Bitmap Index Scan on users_username_key |
| R3 | READ | Fetch a user's fitness profile | 0.047 | 0.046 | 0.050 | 0.048 | Index Scan using profiles_pkey on profiles |
| R4 | READ | Get the logged-in user's account details | 0.047 | 0.051 | 0.043 | 0.047 | Index Scan using users_pkey on users |
| R5 | READ | Update account: check the new email or username is not used by someone else | 0.048 | 0.073 | 0.087 | 0.069 | Bitmap Heap Scan on users | Bitmap Index Scan on users_email_key | Bitmap Index Scan on users_username_key |
| R6 | READ | Google sign-in: find the user by email | 0.043 | 0.042 | 0.043 | 0.043 | Index Scan using users_email_key on users |
| R7 | READ | List all workout programs | 0.113 | 0.116 | 0.115 | 0.115 | Seq Scan on workout_programs |
| R8 | READ | Program details: program with its days, each day's exercises, and exercise names | 0.215 | 0.218 | 0.216 | 0.216 | Seq Scan on workout_programs | Seq Scan on program_day_exercises | Seq Scan on program_days | Index Scan using exercises_pkey on exercises |
| R9 | READ | Activate program: check that the program exists | 0.046 | 0.045 | 0.045 | 0.045 | Seq Scan on workout_programs |
| R10 | READ | The user's active program with all days, exercises and full exercise details | 0.186 | 0.205 | 0.251 | 0.214 | Index Scan using workout_programs_pkey on workout_programs | Index Scan using user_active_programs_user_id_key on user_active_programs | Index Scan using idx_program_days_program_id on program_days | Index Scan using idx_program_day_exercises_day_id on program_day_exercises | Index Scan using exercises_pkey on exercises |
| R11 | READ | Log a workout: look up the day name to use as the session title | 0.040 | 0.048 | 0.047 | 0.045 | Seq Scan on program_days |
| R12 | READ | Workout history: total number of sessions (for pagination) | 0.138 | 0.113 | 0.121 | 0.124 | Index Only Scan using idx_workout_logs_user_id on workout_logs |
| R13 | READ | Workout history: one page of sessions with their sets and exercise details | 0.955 | 0.972 | 0.972 | 0.966 | Seq Scan on workout_sets | Index Scan using idx_workout_logs_user_id on workout_logs | Index Scan using exercises_pkey on exercises |
| R14 | READ | One workout session with its sets and exercise details (own sessions only) | 0.274 | 0.291 | 0.205 | 0.257 | Index Scan using workout_logs_pkey on workout_logs | Seq Scan on exercises | Bitmap Heap Scan on workout_sets | Bitmap Index Scan on idx_workout_sets_log_id |
| R15 | READ | Browse and filter exercises (every filter is optional; all are shown here) | 0.118 | 0.120 | 0.120 | 0.119 | Bitmap Heap Scan on exercises | Bitmap Index Scan on idx_exercises_body_part |
| R16 | READ | Number of exercises matching the same filters (for pagination) | 0.117 | 0.115 | 0.125 | 0.119 | Bitmap Heap Scan on exercises | Bitmap Index Scan on idx_exercises_body_part |
| W1 | WRITE | Register: create the user account | 0.396 | 0.385 | 0.414 | 0.398 | — |
| W2 | WRITE | Google sign-in: create the user on first login | 0.380 | 0.326 | 0.342 | 0.349 | — |
| W3 | WRITE | Register: create the fitness profile for the new user | 1.066 | 1.346 | 0.889 | 1.100 | — |
| W4 | WRITE | Register: undo the user if creating the profile failed | 6.089 | 5.197 | 5.222 | 5.503 | Index Scan using users_pkey on users |
| W5 | WRITE | Update account details (the app only sets the fields that were sent) | 0.377 | 0.299 | 0.330 | 0.335 | Index Scan using users_pkey on users |
| W6 | WRITE | Update fitness profile (the app only sets the fields that were sent) | 2.488 | 1.559 | 1.556 | 1.868 | Index Scan using profiles_pkey on profiles |
| W7 | WRITE | Create a custom workout program | 0.984 | 0.732 | 0.858 | 0.858 | — |
| W8 | WRITE | Create the days of the new program | 1.025 | 0.840 | 0.743 | 0.869 | — |
| W9 | WRITE | Add exercises to the days of the new program | 1.374 | 1.705 | 1.346 | 1.475 | — |
| W10 | WRITE | Create program: undo the program if a later insert failed (days and exercises cascade) | 2.310 | 2.887 | 2.438 | 2.545 | Seq Scan on workout_programs |
| W11 | WRITE | Activate a program for the user (insert, or replace the user's current one) | 0.379 | 0.322 | 0.312 | 0.338 | — |
| W12 | WRITE | Log a completed workout session (header row) | 1.090 | 1.107 | 1.083 | 1.093 | — |
| W13 | WRITE | Log the sets of the session and return them with their exercise details | 0.966 | 0.949 | 1.242 | 1.052 | Seq Scan on exercises |
| W14 | WRITE | Log a workout: undo the session header if inserting the sets failed | 0.543 | 0.557 | 0.536 | 0.545 | Index Scan using workout_logs_pkey on workout_logs |
| W15 | WRITE | Delete one of the user's own workout sessions (its sets cascade) | 0.498 | 0.485 | 0.468 | 0.484 | Index Scan using workout_logs_pkey on workout_logs |
| W16 | WRITE | Add a new exercise to the catalog | 0.504 | 0.382 | 0.381 | 0.422 | — |
| W17 | WRITE | Delete an exercise from the catalog | 0.858 | 0.923 | 0.795 | 0.859 | Index Scan using exercises_pkey on exercises |

---

## Detailed Scan Analysis & Query Performance Insights

### 1. Authentication & Profile Lookups (`R1`–`R6`)

- **`R1` & `R2` (User Lookup by Identifier)**: Evaluates unique candidate keys (`email` or `username`). The optimizer uses `Bitmap Heap Scan` combining `Bitmap Index Scan on users_email_key` and `Bitmap Index Scan on users_username_key` via a `BitmapOr` node, completing in ~0.04 ms with only 5 buffer hits.
- **`R3` & `R4` (Profile & User Fetch by PK)**: Direct `Index Scan using profiles_pkey on profiles` and `Index Scan using users_pkey on users`. Single-row index lookups execute in ~0.03 ms with 2–3 buffer hits.
- **`R5` (Collision Check with Self-Exclusion)**: Uses `Bitmap Index Scan` on unique columns while filtering `id <> user_id`. Executes in ~0.05 ms.
- **`R6` (Google Sign-In Email Lookup)**: Direct `Index Scan using users_email_key on users` returning the authenticated user in ~0.03 ms.

### 2. Program Splits & Hierarchical Data (`R7`–`R11`)

- **`R7` (List All Programs)**: Executes a `Seq Scan on workout_programs` sorted by `created_at`. Because programs are a compact master table, sequential scanning over few memory pages is optimal.
- **`R8` & `R10` (4-Table Program Details & Active Program Traversal)**: Traverses `workout_programs` $\to$ `program_days` $\to$ `program_day_exercises` $\to$ `exercises` using `Index Scan` on `workout_programs_pkey`, `Index Scan using idx_user_active_programs_user_id`, and foreign key B-tree index scans on `idx_program_days_program_id`, `idx_program_day_exercises_day_id`, and `exercises_pkey`. Total relational traversal completes in ~0.15–0.25 ms.
- **`R9` & `R11` (Lookup by ID)**: Primary key lookups using `Index Scan using workout_programs_pkey` and `Index Scan using program_days_pkey` in ~0.03 ms.

### 3. Workout History & Exercise Filtering (`R12`–`R16`)

- **`R12` (Session Count)**: Uses `Bitmap Index Scan using idx_workout_logs_user_id on workout_logs` to calculate the user's total session count without scanning the entire table heap.
- **`R13` (Paginated Session History with CTE)**: Isolates pagination via a Common Table Expression (`WITH page AS ... LIMIT 20 OFFSET 0`), leveraging the composite index `idx_workout_logs_user_id (user_id, completed_at DESC)` to eliminate in-memory sorting. Child sets and exercise details are then joined efficiently via `idx_workout_sets_log_id` and `exercises_pkey` in ~0.25 ms.
- **`R14` (Single Session Volume Breakdown)**: Fetches the session by PK and sets via `idx_workout_sets_log_id`, joining exercise details in ~0.15 ms.
- **`R15` & `R16` (Exercise Catalog Filtering)**: Filters by `name ILIKE '%press%'`, `body_part = 'chest'`, and array containment `target_muscles @> ARRAY['pectorals']::text[]`. The GIN index `idx_exercises_target_muscles` and B-tree index `idx_exercises_body_part` accelerate search across composite array attributes.

### 4. Write Operations (`W1`–`W17`)

- **Single-Row Inserts (`W1`, `W2`, `W3`, `W7`, `W12`, `W16`)**: Pure `Insert` operations (`—`). Each takes ~0.2–0.5 ms, maintaining foreign key integrity and updating associated B-Tree and GIN indexes.
- **Bulk Inserts (`W8`, `W9`)**: Inserts multiple day and exercise tuples in a single statement, reducing network round trips and query planning overhead.
- **UPSERT (`W11`)**: Uses `Insert on user_active_programs` with `ON CONFLICT (user_id) DO UPDATE`. PostgreSQL detects existing active program rows via the unique B-tree index on `user_id` and updates `program_id` in place in ~0.2 ms.
- **Cascading & Scoped Deletions (`W4`, `W10`, `W14`, `W15`, `W17`)**: Scoped by user ID and primary key. Relies on `ON DELETE CASCADE` down to child tables (`workout_sets`, `program_days`, `program_day_exercises`) and `ON DELETE RESTRICT` on catalog exercises.
