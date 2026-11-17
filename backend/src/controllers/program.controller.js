const { z } = require('zod');
const supabase = require('../db/db');

const createProgramSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  days_per_week: z.number().int().min(1).max(7),
  days: z
    .array(
      z.object({
        day_number: z.number().int().min(1).max(7),
        day_name: z.string().min(1).max(100),
        focus: z.string().min(1).max(50),
        exercises: z
          .array(
            z.object({
              exercise_id: z.string().min(1),
              order_index: z.number().int().min(1),
              target_sets: z.number().int().min(1).max(20),
              target_reps: z.string().min(1).max(20),
              rest_seconds: z.number().int().min(0).max(600).default(90),
              notes: z.string().max(255).optional().nullable(),
            })
          )
          .default([]),
      })
    )
    .min(1)
    .max(7),
});

async function getAllPrograms(req, res) {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('id, title, description, days_per_week, is_default, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('Error fetching programs:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch workout programs' });
  }
}

async function getProgramById(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select(`
        id,
        title,
        description,
        days_per_week,
        program_days (
          id,
          day_number,
          day_name,
          focus,
          program_day_exercises (
            id,
            order_index,
            target_sets,
            target_reps,
            rest_seconds,
            notes,
            exercise:exercises (
              id,
              name,
              body_part
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Program not found' });
      }
      throw error;
    }

    if (data?.program_days) {
      data.program_days.sort((a, b) => a.day_number - b.day_number);
      data.program_days.forEach((day) => {
        if (day.program_day_exercises) {
          day.program_day_exercises.sort((a, b) => a.order_index - b.order_index);
        }
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Error fetching program details:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch program details' });
  }
}

async function createProgram(req, res) {
  const parsed = createProgramSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { title, description, days_per_week, days } = parsed.data;
  const userId = req.userID;

  try {
    const { data: program, error: programError } = await supabase
      .from('workout_programs')
      .insert({
        title,
        description: description ?? null,
        days_per_week,
        is_default: false,
        user_id: userId,
      })
      .select('id, title, description, days_per_week, is_default, user_id, created_at')
      .single();

    if (programError) throw programError;

    const daysPayload = days.map((d) => ({
      program_id: program.id,
      day_number: d.day_number,
      day_name: d.day_name,
      focus: d.focus,
    }));

    const { data: insertedDays, error: daysError } = await supabase
      .from('program_days')
      .insert(daysPayload)
      .select('id, day_number');

    if (daysError) {
      await supabase.from('workout_programs').delete().eq('id', program.id);
      throw daysError;
    }

    const dayIdByNumber = new Map(insertedDays.map((d) => [d.day_number, d.id]));
    const exercisesPayload = [];

    for (const day of days) {
      const programDayId = dayIdByNumber.get(day.day_number);
      for (const ex of day.exercises) {
        exercisesPayload.push({
          program_day_id: programDayId,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes ?? null,
        });
      }
    }

    if (exercisesPayload.length > 0) {
      const { error: exError } = await supabase
        .from('program_day_exercises')
        .insert(exercisesPayload);

      if (exError) {
        await supabase.from('workout_programs').delete().eq('id', program.id);
        throw exError;
      }
    }

    return res.status(201).json({ success: true, message: 'Workout program created', data: program });
  } catch (err) {
    console.error('Error creating program:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to create workout program' });
  }
}

async function activateProgram(req, res) {
  const { id: programId } = req.params;
  const userId = req.userID;

  try {
    const { data: program, error: progError } = await supabase
      .from('workout_programs')
      .select('id, title')
      .eq('id', programId)
      .single();

    if (progError || !program) {
      return res.status(404).json({ success: false, message: 'Program not found' });
    }

    const { data, error } = await supabase
      .from('user_active_programs')
      .upsert(
        {
          user_id: userId,
          program_id: programId,
          started_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select('id, user_id, program_id, started_at')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, message: `Activated "${program.title}"`, data });
  } catch (err) {
    console.error('Error activating program:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to activate program' });
  }
}

async function getActiveProgram(req, res) {
  const userId = req.userID;

  try {
    const { data: active, error: activeError } = await supabase
      .from('user_active_programs')
      .select(`
        id,
        started_at,
        program:workout_programs (
          id,
          title,
          description,
          days_per_week,
          program_days (
            id,
            day_number,
            day_name,
            focus,
            program_day_exercises (
              id,
              order_index,
              target_sets,
              target_reps,
              rest_seconds,
              notes,
              exercise:exercises (*)
            )
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (activeError) {
      if (activeError.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'No active program found' });
      }
      throw activeError;
    }

    const program = active.program;
    program.program_days.sort((a, b) => a.day_number - b.day_number);
    program.program_days.forEach((day) => {
      if (day.program_day_exercises) {
        day.program_day_exercises.sort((a, b) => a.order_index - b.order_index);
      }
    });

    const totalDays = program.program_days.length || 1;
    const start = new Date(active.started_at);
    const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const now = new Date();
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const daysElapsed = Math.max(0, Math.floor((todayUtc - startUtc) / 86400000));

    const currentDayNumber = (daysElapsed % totalDays) + 1;
    const todayWorkout =
      program.program_days.find((d) => d.day_number === currentDayNumber) || program.program_days[0];

    return res.status(200).json({
      success: true,
      data: {
        started_at: active.started_at,
        current_day_number: currentDayNumber,
        today: todayWorkout,
        program,
      },
    });
  } catch (err) {
    console.error('Error fetching active program:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch active program' });
  }
}

module.exports = {
  getAllPrograms,
  getProgramById,
  createProgram,
  activateProgram,
  getActiveProgram,
};