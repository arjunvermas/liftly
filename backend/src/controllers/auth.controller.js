const bcrypt = require("bcrypt");
const supabase = require("../db/db.js");
const { z } = require("zod");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const cookieParser = require('cookie-parser')

//used ZOD for filtering data
const registerSchema = z.object({
  name: z
    .string()
    .max(100, "Name must not exceed 100 characters")
    .optional()
    .nullable(),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores"
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(255, "Email must not exceed 255 characters")
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, a number, and a special character"
    ),

    profile : z.object({
        bio: z
        .string()
        .trim()
        .max(300, "Bio must not exceed 300 characters")
        .optional()
        .default(""),

        height_cm: z.coerce
        .number({ invalid_type_error: "Height must be a valid number" })
        .min(50, "Height must be at least 50 cm")
        .max(280, "Height must not exceed 280 cm"),

        weight_kg: z.coerce
        .number({ invalid_type_error: "Weight must be a valid number" })
        .min(20, "Weight must be at least 20 kg")
        .max(400, "Weight must not exceed 400 kg"),

        fitness_goal: z.enum(
        ["hypertrophy", "strength", "endurance", "weight_loss", "general_fitness"],
        {
            errorMap: () => ({
            message:
                "Goal must be: hypertrophy, strength, endurance, weight_loss, or general_fitness",
            }),
        }
        ),

        experience_level: z
        .enum(["beginner", "intermediate", "advanced"], {
            errorMap: () => ({
            message: "Experience must be: beginner, intermediate, or advanced",
            }),
        })
        .default("beginner"),
    })
});

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Username or Email is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

//register done
async function createProfileRecord(profileData, username, userId) {
  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      avatar_url: defaultAvatar,
      bio: profileData.bio,
      height_cm: profileData.height_cm,
      weight_kg: profileData.weight_kg,
      fitness_goal: profileData.fitness_goal,
      experience_level: profileData.experience_level,
    })
    .select("avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level")
    .single();

  if (error) {
    throw new Error(`Profile creation failed: ${error.message}`);
  }

  return data;
}
async function registerUser(req, res){
    try{
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
        const formattedErrors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ errors: formattedErrors });
        }
        const { name, username, email, password, profile} = validation.data;
        const saltRounds = 10;  // Number of hashing rounds (can increase for more security)
        const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('id')
                .or(`email.eq.${email},username.eq.${username}`)
                .maybeSingle(); 

        if (fetchError){ 
            res.status(500).json({message : "Internal Server Error"});
            return;
        }

        if (existingUser) {
            return res.status(409).json({ message: "Email or Username is already registered." });
        }
        const hashedPass = await bcrypt.hash(password, saltRounds);
        
        const {data , error} = await supabase
            .from('users')
            .insert({
                username,
                email,
                name,
                password_hash: hashedPass,
            })
            .select()
            .single();
        
        if (error) {
            console.error("Supabase Insert Error:", error.message);
            return res.status(400).json({ error: error.message });
        }
        let profileData;
        try {
            profileData = await createProfileRecord(profile, username, data.id);
        } catch (profileError) {
            console.error("Profile Error:", profileError.message);
            await supabase.from("users").delete().eq("id", data.id);
            return res.status(500).json({ message: "Failed to initialize profile. User registration rolled back." });
        }


        const jwtsecret = process.env.JWT_SECRET;
        const token = jwt.sign({userId : data.id}, jwtsecret, {expiresIn : "30d"});
        
        res.cookie("token", token, {
            httpOnly: true, // Blocks JavaScript from reading the cookie (prevents XSS attacks)
            secure: process.env.NODE_ENV === "production", // HTTPS only in production, works on http://localhost in development
            sameSite: "lax", // Protects against CSRF attacks
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (2,592,000,000 ms)
        });
        const { password_hash, ...dataWithouthash } = data;
        res.status(201).json({message : "registered successfully", dataWithouthash, profileData});
    }
    
    catch(err){
        return res.status(500).json({ message: "Internal server error" });
    }
}

//either username or password should work or either email or password there is no multiple user
//for one email in our schema all are unique 
//we aint handling multiple username with same email case
//cuz our schema doesnt allows to do it
async function loginUser(req, res){
    try{
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            const formattedErrors = validation.error.flatten().fieldErrors;
            return res.status(400).json({ errors: formattedErrors });
        }

        const { identifier, password } = validation.data;

        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("id, username, email, name, password_hash")
            .or(`email.eq.${identifier},username.eq.${identifier}`)
            .maybeSingle();

        if (fetchError) {
            console.error("Fetch Error:", fetchError.message);
            return res.status(500).json({ message: "Internal server error" });
        }
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level")
            .eq("user_id", user.id)
            .single();

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
            });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        const { password_hash, ...safeUserData } = user;
        return res.status(200).json({
            message : "Logged in Successfully",
            data : safeUserData,
            profile
        })
    }catch(error){
        return res.status(500).json({ message: "Internal server error" });
    }
    
}

async function updateUser(req, res){
    
}
module.exports = {
    registerUser,
    loginUser
}