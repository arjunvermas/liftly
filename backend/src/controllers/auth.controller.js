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
    .regex(/^[a-z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

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
async function registerUser(req, res){
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      const formattedErrors = validation.error.flatten().fieldErrors;
      return res.status(400).json({ errors: formattedErrors });
    }
    const { name, username, email, password } = validation.data;
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
    const hashedPass = bcrypt.hashSync(password, saltRounds);
    
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

    const jwtsecret = process.env.JWT_SECRET;
    const token = jwt.sign({userId : data.id}, jwtsecret, {expiresIn : "30d"});
    
    res.cookie("token", token, {
        httpOnly: true, // Blocks JavaScript from reading the cookie (prevents XSS attacks)
        secure: process.env.NODE_ENV === "production", // HTTPS only in production, works on http://localhost in development
        sameSite: "lax", // Protects against CSRF attacks
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (2,592,000,000 ms)
    });
    const { password_hash, ...dataWithouthash } = data;
    res.status(201).json({message : "registered successfully", dataWithouthash})
}

//either username or password should work or either email or password there is no multiple user
//for one email in our schema all are unique 
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
            data : safeUserData
        })
    }catch(error){
        return res.status(500).json({ message: "Internal server error" });
    }
    
}
module.exports = {
    registerUser,
    loginUser
}