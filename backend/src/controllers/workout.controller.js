const supabase = require("../db/db.js");
const { z } = require("zod");
const imagekit = require("../config/imagekit.js");

const exerciseFilterSchema = z.object({
  name: z.string().trim().optional(),
  body_part: z.string().trim().toLowerCase().optional(),
  target_muscle: z.string().trim().toLowerCase().optional(),
  equipment: z.string().trim().toLowerCase().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const createExerciseSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  body_part: z.string().trim().toLowerCase(),
  equipment: z.string().trim().toLowerCase().default("none"),
  target_muscles: z
    .string()
    .transform((val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [val];
      } catch {
        return val.split(",").map((m) => m.trim().toLowerCase());
      }
    })
    .pipe(z.array(z.string()).min(1, "At least one target muscle is required")),
});

async function Workouts(req, res) {
  try {
    const validation = exerciseFilterSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
    }

    const { name, body_part, target_muscle, equipment, page, limit } = validation.data;

    let query = supabase.from("exercises").select("*", { count: "exact" });

    if (name) query = query.ilike("name", `%${name}%`);
    if (body_part) query = query.eq("body_part", body_part);
    if (target_muscle) query = query.contains("target_muscles", [target_muscle]);
    if (equipment) query = query.eq("equipment", equipment);

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order("name", { ascending: true });

    const { data: exercises, error, count } = await query;

    if (error) {
      console.error("Exercise Fetch Error:", error.message);
      return res.status(500).json({ message: "Failed to fetch exercises" });
    }

    return res.status(200).json({
      total: count,
      page,
      limit,
      data: exercises,
    });
  } catch (err) {
    console.error("Workout Controller Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function createExerciseController(req, res) {
  try {
    const validation = createExerciseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
    }

    const {name, body_part, equipment, target_muscles } = validation.data;
    const files = req.files;

    let imageUrl = null;
    let videoUrl = null;
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    if (files?.image?.[0]) {
      const imgFile = files.image[0];
      const imgUpload = await imagekit.upload({
        file: imgFile.buffer,
        fileName: `${safeName}-thumb-${Date.now()}`,
        folder: "/exercises/images",
      });
      imageUrl = imgUpload.url;
    }
    
    const mediaFile = files?.video?.[0] || files?.gif?.[0];
    if (mediaFile) {
      const vidUpload = await imagekit.upload({
        file: mediaFile.buffer,
        fileName: `${safeName}-demo-${Date.now()}`,
        folder: "/exercises/videos",
      });
      videoUrl = vidUpload.url;
    }
    

    const { data: newExercise, error: dbError } = await supabase
      .from("exercises")
      .insert([
        {
          name,
          body_part,
          target_muscles,
          equipment,
          gif_url: videoUrl,
          image_url: imageUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Insert Error:", dbError.message);
      return res.status(500).json({ error: "Failed to save exercise in database" });
    }

    return res.status(201).json({
      message: "Exercise created successfully",
      exercise: newExercise,
    });
  } catch (err) {
    console.error("Create Exercise Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function deleteExerciseController(req, res) {
  try {
    const validation = z.object({ id: z.uuid() }).safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
    }

    const { data: deletedExercise, error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", validation.data.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase Delete Error:", error.message);
      return res.status(500).json({ error: "Failed to delete exercise" });
    }

    if (!deletedExercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    return res.status(200).json({
      message: "Exercise deleted successfully",
      exercise: deletedExercise,
    });
  } catch (err) {
    console.error("Delete Exercise Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  Workouts,
  createExerciseController,
  deleteExerciseController,
};

