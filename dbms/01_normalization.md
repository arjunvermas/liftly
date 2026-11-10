# Database Normalization

## 1. What is Database Normalization?

Database normalization is the process of organizing data into tables to reduce duplication, prevent inconsistent data, and maintain data integrity.

The main normal forms are:

1. First Normal Form (1NF)
2. Second Normal Form (2NF)
3. Third Normal Form (3NF)
4. Boyce-Codd Normal Form (BCNF)

Normalization is a design guideline, not a rule that every piece of data must always be split into separate tables. Practical applications sometimes use deliberate denormalization for performance or simplicity.

---

## 2. Current Database Schema

The application currently uses these tables:

- `users`
- `profiles`
- `exercises`

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP,
  email_verified_at TIMESTAMP,
  followers_count INT NOT NULL DEFAULT 0,
  following_count INT NOT NULL DEFAULT 0
);
```

**Important:** `followers_count` and `following_count` are denormalized counters. They represent values that can be calculated from a user-follow relationship table.

They can be kept for faster reads, provided the backend maintains them consistently with the actual follow relationships.

### Profiles

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  height_cm NUMERIC(5,2) NOT NULL
    CHECK (height_cm >= 50 AND height_cm <= 280),
  weight_kg NUMERIC(5,2) NOT NULL
    CHECK (weight_kg >= 20 AND weight_kg <= 400),
  fitness_goal TEXT NOT NULL CHECK (
    fitness_goal IN (
      'hypertrophy',
      'strength',
      'endurance',
      'weight_loss',
      'general_fitness'
    )
  ),
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (
    experience_level IN ('beginner', 'intermediate', 'advanced')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

The `user_id` is both the primary key and a foreign key referencing `users(id)`.

This creates a one-to-one relationship between a user and their profile.

### Exercises

```sql
CREATE TABLE public.exercises (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  body_part TEXT NOT NULL,
  target_muscles TEXT[] NOT NULL,
  equipment TEXT DEFAULT 'none'::text,
  gif_url TEXT,
  image_url TEXT,
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);
```

The `target_muscles` column uses PostgreSQL's native array type (`TEXT[]`) to store multiple muscle names for an exercise.

For example:

```text
target_muscles = {'chest', 'triceps', 'shoulders'}
```

This is a deliberate design choice that keeps the exercise data simple to work with in the existing backend.

---

## 3. First Normal Form (1NF)

### Definition

A table is in First Normal Form when:

- Each row is uniquely identifiable.
- Each column contains a value for that row.
- There are no repeating groups of columns.
- Under the traditional relational definition, each cell contains an atomic value.

### Example of a 1NF violation

| exercise_id | name | target_muscles |
|---|---|---|
| 1 | Bench Press | chest, triceps, shoulders |

Under the strict relational definition, storing multiple muscle values in one cell violates 1NF.

### How to achieve strict 1NF

A fully normalized alternative would be to create a separate table:

```sql
CREATE TABLE exercise_muscles (
  exercise_id TEXT REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_name TEXT NOT NULL,
  PRIMARY KEY (exercise_id, muscle_name)
);
```

Example data:

| exercise_id | muscle_name |
|---|---|
| 1 | chest |
| 1 | triceps |
| 1 | shoulders |

Each row now represents one exercise-muscle relationship.

### Our implementation decision

We currently use:

```sql
target_muscles TEXT[] NOT NULL
```

PostgreSQL supports arrays natively, including array searching and GIN indexing.

For this application, keeping the array is a reasonable pragmatic choice because:

- The backend already works with this structure.
- Muscle names do not currently need independent metadata.
- We do not currently need a separate muscle catalogue with foreign-key constraints.
- It avoids unnecessary backend complexity.

**Conclusion:** The current `exercises` table does not satisfy strict traditional 1NF because of `TEXT[]`. This is an intentional PostgreSQL-specific design choice, not an accidental schema mistake.

We should consider a separate `exercise_muscles` table only if future requirements justify it.

---

## 4. Second Normal Form (2NF)

### Definition

A table is in Second Normal Form when:

1. It is already in 1NF.
2. Every non-key attribute depends on the entire candidate key, not just part of a composite key.

This mainly matters when a table has a composite primary key.

### Example of a 2NF violation

Consider:

| student_id | course_id | student_name | course_name |
|---|---|---|---|
| 1 | 101 | Rahul | Mathematics |
| 1 | 102 | Rahul | Physics |
| 2 | 101 | Aman | Mathematics |

Suppose the primary key is:

```text
(student_id, course_id)
```

But:

- `student_name` depends only on `student_id`.
- `course_name` depends only on `course_id`.

These are partial dependencies.

### Solution

Separate the data into three tables:

**Students**

| student_id | student_name |
|---|---|
| 1 | Rahul |
| 2 | Aman |

**Courses**

| course_id | course_name |
|---|---|
| 101 | Mathematics |
| 102 | Physics |

**Enrollments**

| student_id | course_id |
|---|---|
| 1 | 101 |
| 1 | 102 |
| 2 | 101 |

Now, non-key attributes depend on their respective table keys.

### Our schema

- `users` has a single-column primary key: `id`.
- `profiles` has a single-column primary key: `user_id`.
- `exercises` has a single-column primary key: `id`.

There are no partial dependencies on a composite primary key in these tables.

The optional `exercise_muscles` table would use a composite key, but it has no non-key attributes in the proposed design.

**Conclusion:** No partial-key dependency is identified in the current schema.

---

## 5. Third Normal Form (3NF)

### Definition

A table is in Third Normal Form when:

1. It is already in 2NF.
2. Non-key attributes do not depend transitively on a candidate key.

In simple terms, non-key columns should describe the key, the whole key, and nothing but the key.

### Example of a 3NF violation

Consider:

| employee_id | employee_name | department_id | department_name |
|---|---|---|---|
| 1 | Rahul | 10 | Engineering |
| 2 | Aman | 20 | Marketing |

Here:

```text
employee_id -> department_id
department_id -> department_name
```

Therefore:

```text
employee_id -> department_name
```

`department_name` depends on `department_id`, rather than directly on the employee's key.

This is a transitive dependency.

### Solution

Separate the department information.

**Employees**

| employee_id | employee_name | department_id |
|---|---|---|
| 1 | Rahul | 10 |
| 2 | Aman | 20 |

**Departments**

| department_id | department_name |
|---|---|
| 10 | Engineering |
| 20 | Marketing |

Now department information is stored in one place.

### Our schema

**Users**

- `id` identifies a user.
- `username` and `email` are unique candidate keys.
- Other user attributes describe that user.

**Profiles**

- `user_id` identifies the profile.
- Profile attributes describe that user's fitness profile.

**Exercises**

- `id` identifies an exercise.
- Other columns describe that exercise.

No obvious transitive dependency is present under the current functional-dependency assumptions.

The follower counters are intentionally denormalized values. They should be treated as cached counts derived from follow relationships, rather than as independent source-of-truth data.

**Conclusion:** The current tables have no identified 3NF violation apart from the separate strict-1NF consideration for the exercise array.

---

## 6. Boyce-Codd Normal Form (BCNF)

### Definition

A table is in BCNF when, for every non-trivial functional dependency:

```text
X -> Y
```

`X` must be a superkey.

BCNF is stricter than 3NF.

### Our schema

Assuming the declared keys and unique constraints represent the relevant candidate keys:

- `users`: `id`, `username`, and `email` are candidate keys.
- `profiles`: `user_id` is the primary key.
- `exercises`: `id` is the primary key.

Under these assumptions, the determinants of the identified functional dependencies are candidate keys.

**Conclusion:** No BCNF violation is identified under the stated assumptions. A complete BCNF proof would require knowing all business-level functional dependencies, not just the SQL constraints.

---

## 7. Summary

| Normal Form | Main Rule | Current Schema |
|---|---|---|
| 1NF | Atomic values; no repeating groups | `exercises.target_muscles` is a deliberate array exception |
| 2NF | No partial dependency | No identified violation |
| 3NF | No transitive dependency | No identified violation |
| BCNF | Every determinant must be a superkey | No identified violation under stated assumptions |

## 8. Final Design Decisions

We will keep the existing schema for now.

1. Keep `users` and `profiles` separate because they represent different responsibilities.
2. Keep `target_muscles TEXT[]` because PostgreSQL supports arrays and the current backend uses this structure.
3. Do not introduce `exercise_muscles` unless future requirements need independent muscle records, metadata, or relational constraints.
4. Keep follower counters only if the backend reliably synchronizes them with follow relationships.
5. Use normalization to prevent real data-integrity problems, not simply to increase the number of tables.

**Important takeaway:** Normalization helps us make better database design decisions. It does not mean we must rewrite a working backend every time we discover a more normalized alternative.