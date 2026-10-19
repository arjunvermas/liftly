const jwt = require('jsonwebtoken');
const supabase = require("../db/db.js");
const dotenv = require('dotenv');
dotenv.config();
const cookieParser = require('cookie-parser');
const { z } = require("zod");

const exerciseFilterSchema = z.object({
  name: z.string().trim().optional(),
  body_part: z.string().trim().toLowerCase().optional(),
  target_muscle: z.string().trim().toLowerCase().optional(),
  equipment: z.string().trim().toLowerCase().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});


async function Workouts(req, res){
    try {
        const validation = exerciseFilterSchema.safeParse(req.query);
        if (!validation.success) {
        return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
        }

        const { name, body_part, target_muscle, equipment, page, limit } = validation.data;

        let query = supabase
        .from("exercises")
        .select("*", { count: "exact" });

        if (name) {
        query = query.ilike("name", `%${name}%`);
        }

        if (body_part) {
        query = query.eq("body_part", body_part);
        }

        if (target_muscle) {
        query = query.contains("target_muscles", [target_muscle]);
        }

        if (equipment) {
        query = query.eq("equipment", equipment);
        }

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
module.exports = Workouts;