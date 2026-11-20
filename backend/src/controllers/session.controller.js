const supabase = require("../db/db.js");
const { z } = require("zod");

const logWorkoutSchema = z.object({
  program_day_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(120).optional(),
  duration_minutes: z.coerce.number().int().min(0).max(600).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  sets: z
    .array(
      z.object({
        exercise_id: z.string().min(1, "exercise_id is required"),
        set_number: z.coerce.number().int().min(1).max(50),
        reps: z.coerce.number().int().min(0).max(500),
        weight_kg: z.coerce.number().min(0).max(1000).default(0),
        rpe: z.coerce.number().min(1).max(10).optional().nullable(),
      })
    )
    .min(1, "At least one set is required to log a workout"),
});

// POST /api/sessions - Log a completed workout session + its sets
async function logWorkoutSession(req, res) {
  const validation = logWorkoutSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  const { program_day_id, title, duration_minutes, notes, sets } = validation.data;
  const userId = req.userID;

  try {
    // Auto-fill title from program_day if program_day_id is provided and title was omitted
    let sessionTitle = title;
    if (!sessionTitle && program_day_id) {
      const { data: day } = await supabase
        .from("program_days")
        .select("day_name")
        .eq("id", program_day_id)
        .maybeSingle();

      sessionTitle = day?.day_name || "Workout Session";
    }

    // 1. Insert parent workout_log
    const { data: log, error: logError } = await supabase
      .from("workout_logs")
      .insert({
        user_id: userId,
        program_day_id: program_day_id ?? null,
        title: sessionTitle || "Workout Session",
        duration_minutes: duration_minutes ?? null,
        notes: notes ?? null,
      })
      .select("id, user_id, program_day_id, title, duration_minutes, notes, completed_at")
      .single();

    if (logError) throw logError;

    // 2. Insert child workout_sets
    const setsPayload = sets.map((s) => ({
      workout_log_id: log.id,
      exercise_id: s.exercise_id,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
      rpe: s.rpe ?? null,
    }));

    const { data: insertedSets, error: setsError } = await supabase
      .from("workout_sets")
      .insert(setsPayload)
      .select(`
        id,
        set_number,
        reps,
        weight_kg,
        rpe,
        exercise:exercises (*)
      `);

    if (setsError) {
      // Rollback parent log if set insertion fails
      await supabase.from("workout_logs").delete().eq("id", log.id);
      throw setsError;
    }

    return res.status(201).json({
      success: true,
      message: "Workout session logged",
      data: {
        ...log,
        sets: insertedSets,
      },
    });
  } catch (err) {
    console.error("Log Workout Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to log workout session",
    });
  }
}

// GET /api/sessions - Fetch user's past logged sessions with nested sets + full exercises
async function getWorkoutHistory(req, res) {
  const userId = req.userID;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const { data, error, count } = await supabase
      .from("workout_logs")
      .select(
        `
        id,
        program_day_id,
        title,
        duration_minutes,
        notes,
        completed_at,
        workout_sets (
          id,
          set_number,
          reps,
          weight_kg,
          rpe,
          exercise:exercises (*)
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Sort sets inside each session by set_number
    data.forEach((session) => {
      if (session.workout_sets) {
        session.workout_sets.sort((a, b) => a.set_number - b.set_number);
      }
    });

    return res.status(200).json({
      success: true,
      total: count,
      page,
      limit,
      data,
    });
  } catch (err) {
    console.error("Fetch Workout History Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workout history",
    });
  }
}

// GET /api/sessions/:id - Fetch single session + volume breakdown
async function getWorkoutSessionById(req, res) {
  const { id } = req.params;
  const userId = req.userID;

  try {
    const { data: session, error } = await supabase
      .from("workout_logs")
      .select(`
        id,
        program_day_id,
        title,
        duration_minutes,
        notes,
        completed_at,
        workout_sets (
          id,
          set_number,
          reps,
          weight_kg,
          rpe,
          exercise:exercises (*)
        )
      `)
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ success: false, message: "Workout session not found" });
      }
      throw error;
    }

    session.workout_sets.sort((a, b) => a.set_number - b.set_number);

    // Calculate total volume, total reps, and per-exercise breakdown
    let totalVolumeKg = 0;
    let totalReps = 0;
    const exerciseMap = new Map();

    for (const s of session.workout_sets) {
      const vol = Number(s.weight_kg) * Number(s.reps);
      totalVolumeKg += vol;
      totalReps += Number(s.reps);

      const exId = s.exercise?.id || "unknown";
      if (!exerciseMap.has(exId)) {
        exerciseMap.set(exId, {
          exercise: s.exercise,
          sets_completed: 0,
          total_reps: 0,
          volume_kg: 0,
          top_weight_kg: 0,
          sets: [],
        });
      }

      const entry = exerciseMap.get(exId);
      entry.sets_completed += 1;
      entry.total_reps += Number(s.reps);
      entry.volume_kg += vol;
      entry.top_weight_kg = Math.max(entry.top_weight_kg, Number(s.weight_kg));
      entry.sets.push({
        id: s.id,
        set_number: s.set_number,
        reps: s.reps,
        weight_kg: s.weight_kg,
        rpe: s.rpe,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...session,
        summary: {
          total_sets: session.workout_sets.length,
          total_reps: totalReps,
          total_volume_kg: totalVolumeKg,
          exercises: Array.from(exerciseMap.values()),
        },
      },
    });
  } catch (err) {
    console.error("Fetch Single Session Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch workout session",
    });
  }
}

// DELETE /api/sessions/:id - Delete a logged workout session
async function deleteWorkoutSession(req, res) {
  const { id } = req.params;
  const userId = req.userID;

  try {
    const { data, error } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: "Workout session not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Workout session deleted",
    });
  } catch (err) {
    console.error("Delete Workout Session Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete workout session",
    });
  }
}

module.exports = {
  logWorkoutSession,
  getWorkoutHistory,
  getWorkoutSessionById,
  deleteWorkoutSession,
};