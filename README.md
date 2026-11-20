Liftly

Liftly is a fitness and workout management application that helps users explore exercises, create workout programs, and track their fitness journey.

Features
User registration and login with JWT authentication.
Browse and filter exercises by name, body part, muscle, and equipment.
Create custom workout programs.
View workout programs with their days and exercises.
Upload exercise images and videos.
Store user profile and fitness information.

Tech Stack
Backend: Node.js
Database: PostgreSQL (Supabase)
Authentication: JWT and bcrypt
Validation: Zod
Media Storage: ImageKit
Deployment: Vercel

Main API Routes
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/registerUser` | Register a user |
| POST | `/api/auth/loginUser` | Login a user |
| GET | `/api/workouts/` | Get and filter exercises |
| POST | `/api/workouts` | Add an exercise |
| GET | `/api/programs` | Get workout programs |
| GET | `/api/programs/:id` | Get program details |
| POST | `/api/programs` | Create a custom program |

Database
The database includes the following main tables:
 `users` – Stores user account details.
 `profiles` – Stores fitness goals and personal information.
`exercises` – Stores exercise details and media URLs.
 `workout_programs` – Stores workout programs.
 `program_days` – Stores individual program days.
 `program_day_exercises` – Stores exercises assigned to program days.
 `user_active_programs` – Tracks users' active programs.
 `workout_logs` – Stores completed workout records.
 `workout_sets` – Stores individual workout sets.

Project Structure
Liftly/
├── backend/
├── dbms/
├── .gitignore
├── team.json
└── README.md
