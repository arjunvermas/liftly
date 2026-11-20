const bcrypt = require("bcrypt");
const supabase = require("../db/db.js");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Client, Account } = require("node-appwrite");
dotenv.config();

// ==================== ZOD SCHEMAS ====================

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

    profile: z.object({
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
    }),
});

const loginSchema = z.object({
    identifier: z
        .string()
        .trim()
        .toLowerCase()
        .min(1, "Username or Email is required"),
    password: z.string().min(1, "Password is required"),
});

const updateUserSchema = z
    .object({
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
            )
            .optional(),

        email: z
            .string()
            .trim()
            .toLowerCase()
            .max(255, "Email must not exceed 255 characters")
            .email("Invalid email address")
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one user field must be provided to update",
    });

const updateProfileSchema = z
    .object({
        avatar_url: z.string().url("Invalid avatar URL").optional(),
        bio: z.string().trim().max(300, "Bio must not exceed 300 characters").optional(),
        height_cm: z.coerce.number().min(50).max(280).optional(),
        weight_kg: z.coerce.number().min(20).max(400).optional(),
        fitness_goal: z
            .enum(["hypertrophy", "strength", "endurance", "weight_loss", "general_fitness"])
            .optional(),
        experience_level: z
            .enum(["beginner", "intermediate", "advanced"])
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one profile field must be provided to update",
    });

// ==================== HELPERS ====================

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

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

// ==================== CONTROLLERS ====================

async function registerUser(req, res) {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
        }

        const { name, username, email, password, profile } = validation.data;
        const saltRounds = 10;

        const { data: existingUser, error: fetchError } = await supabase
            .from("users")
            .select("id")
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle();

        if (fetchError) {
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (existingUser) {
            return res.status(409).json({ message: "Email or Username is already registered." });
        }

        const hashedPass = await bcrypt.hash(password, saltRounds);

        const { data, error } = await supabase
            .from("users")
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
            return res
                .status(500)
                .json({ message: "Failed to initialize profile. User registration rolled back." });
        }

        const token = jwt.sign({ userId: data.id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        res.cookie("token", token, COOKIE_OPTIONS);

        const { password_hash, ...dataWithouthash } = data;
        return res.status(201).json({
            message: "Registered successfully",
            data: dataWithouthash,
            profile: profileData,
        });
    } catch (err) {
        console.error("Register Error:", err.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function loginUser(req, res) {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
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

        res.cookie("token", token, COOKIE_OPTIONS);

        const { password_hash, ...safeUserData } = user;
        return res.status(200).json({
            message: "Logged in Successfully",
            data: safeUserData,
            profile,
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function logoutUser(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
}

async function getMe(req, res) {
    try {
        const userId = req.userID;

        const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, username, email, name, created_at")
            .eq("id", userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level")
            .eq("user_id", userId)
            .maybeSingle();

        return res.status(200).json({
            success: true,
            data: user,
            profile,
        });
    } catch (err) {
        console.error("GetMe Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function updateUser(req, res) {
    try {
        const validation = updateUserSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
        }

        const updates = validation.data;
        const userId = req.userID;

        // Check if new email or username is already taken by someone else
        if (updates.email || updates.username) {
            const filters = [];
            if (updates.email) filters.push(`email.eq.${updates.email}`);
            if (updates.username) filters.push(`username.eq.${updates.username}`);

            const { data: conflict } = await supabase
                .from("users")
                .select("id")
                .or(filters.join(","))
                .neq("id", userId)
                .maybeSingle();

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: "Username or Email is already taken",
                });
            }
        }

        const { data, error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", userId)
            .select("id, username, email, name, created_at")
            .single();

        if (error) {
            console.error("Update User Error:", error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(200).json({
            success: true,
            message: "Account details updated",
            data,
        });
    } catch (err) {
        console.error("Update User Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function updateProfile(req, res) {
    try {
        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ errors: validation.error.flatten().fieldErrors });
        }

        const userId = req.userID;
        const updates = validation.data;

        const { data, error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("user_id", userId)
            .select("avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level")
            .single();

        if (error) {
            console.error("Update Profile Error:", error.message);
            return res.status(400).json({ success: false, message: error.message });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated",
            profile: data,
        });
    } catch (err) {
        console.error("Update Profile Error:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function googleAuth(req, res) {
    try {
        const { appwriteJwt } = req.body;
        if (!appwriteJwt || typeof appwriteJwt !== "string") {
            return res.status(400).json({ message: "appwriteJwt is required" });
        }

        // 1. Verify the Appwrite JWT directly with Appwrite
        const appwriteClient = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
            .setProject(process.env.APPWRITE_PROJECT_ID)
            .setJWT(appwriteJwt);

        const appwriteAccount = new Account(appwriteClient);
        const appwriteUser = await appwriteAccount.get();

        const email = appwriteUser.email.toLowerCase().trim();
        const name = appwriteUser.name?.trim() || email.split("@")[0];

        // 2. Check if user already exists in Supabase
        let { data: user, error: fetchError } = await supabase
            .from("users")
            .select("id, username, email, name")
            .eq("email", email)
            .maybeSingle();

        if (fetchError) {
            console.error("Supabase Fetch Error:", fetchError.message);
            return res.status(500).json({ message: "Internal server error" });
        }

        let isNewUser = false;

        // 3. First-time Google login -> insert into users table only
        if (!user) {
            isNewUser = true;
            const baseUsername =
                email
                    .split("@")[0]
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "_")
                    .slice(0, 22) || "user";

            const uniqueUsername = `${baseUsername}_${crypto.randomUUID().slice(0, 8)}`;
            const randomPasswordHash = await bcrypt.hash(
                `${appwriteUser.$id}-${Date.now()}-${Math.random()}`,
                10
            );

            const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                    username: uniqueUsername,
                    email,
                    name,
                    password_hash: randomPasswordHash,
                })
                .select("id, username, email, name")
                .single();

            if (insertError) {
                console.error("Google User Insert Error:", insertError.message);
                return res.status(500).json({ message: "Failed to create user account" });
            }

            user = newUser;
        }

        // 4. Fetch profile if it exists (null until onboarding is completed)
        const { data: profile } = await supabase
            .from("profiles")
            .select("avatar_url, bio, height_cm, weight_kg, fitness_goal, experience_level")
            .eq("user_id", user.id)
            .maybeSingle();

        // 5. Issue your standard 30-day HTTP-only JWT cookie
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        res.cookie("token", token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: "Google authentication successful",
            isNewUser,
            hasProfile: Boolean(profile),
            data: user,
            profile: profile || null,
        });
    } catch (err) {
        console.error("Google Auth Error:", err.message);
        return res.status(401).json({ message: "Invalid or expired Appwrite session" });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateUser,
    updateProfile,
    googleAuth
};