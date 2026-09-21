const bcrypt = require("bcrypt");
const supabase = require("../db/db.js");

//abhi register user ke andar i have to filter out wrong emails and passes and many things haan
//front end se bhi ho skta hai pr dono jngh kro toh aur secure kyuki koi bhi api hit kr skta hai

async function registerUser(req, res){
    const {name, username, email, password} = req.body;
    const saltRounds = 10;  // Number of hashing rounds (can increase for more security)
    const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle(); 

    if (fetchError) throw fetchError;

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

    res.status(201).json({message : "registered successfully", data})
}
module.exports = {registerUser}